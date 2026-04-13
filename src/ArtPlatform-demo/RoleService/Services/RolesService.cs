using MongoDB.Driver;
using RoleService.data;
using RoleService.Models.Entities;
using RoleService.Models.Kafka;
using RoleService.Services.Kafka;

namespace RoleService.Services
{
    /// <summary>
    /// Сервис управления ролями пользователей
    /// </summary>
    public class RolesService : IRolesService
    {
        private readonly IMongoCollection<UserRoleEntry> _roles; // коллекция ролей
        private readonly KafkaProducerService _producer; // продьюсер
        private readonly ILogger<RolesService> _logger; // логирование

        /// <summary>
        /// Конструктор
        /// </summary>
        /// <param name="context">БД</param>
        /// <param name="producer">продюсер</param>
        /// <param name="logger">логирование</param>
        public RolesService(MongoDBContext context, KafkaProducerService producer, ILogger<RolesService> logger)
        {
            _roles = context.Roles;
            _producer = producer;
            _logger = logger;
        }

        /// <summary>
        /// Получить роль пользователя по UserId
        /// </summary>
        /// <param name="userId">идентификатор пользователя</param>
        /// <returns>роль или null</returns>
        public async Task<UserRoleEntry?> GetByUserIdAsync(string userId)
        {
            return await _roles.Find(r => r.UserId == userId).FirstOrDefaultAsync();
        }

        /// <summary>
        /// Обновить роль пользователя
        /// </summary>
        /// <param name="userId">идентификатор пользователя</param>
        /// <param name="role">роль</param>
        /// <param name="assignedBy">кем назначена</param>
        /// <returns>объект роли</returns>
        public async Task<UserRoleEntry> UpsertRoleAsync(string userId, UserRole role, string? assignedBy = null)
        {
            var now = DateTime.UtcNow;

            // Проверяем есть ли уже роль у пользователя
            var existing = await GetByUserIdAsync(userId);

            if (existing != null)
            {
                // Если роль не изменилась — ничего не делаем 
                if (existing.Role == role)
                {
                    _logger.LogInformation("UpsertRole: role for {UserId} is already {Role}, no-op", userId, role);
                    return existing;
                }

                // Обновляем существующую запись
                var update = Builders<UserRoleEntry>.Update
                    .Set(r => r.Role, role)
                    .Set(r => r.AssignedAt, now)
                    .Set(r => r.AssignedBy, assignedBy);

                var filter = Builders<UserRoleEntry>.Filter.Eq(r => r.UserId, userId);
                var options = new FindOneAndUpdateOptions<UserRoleEntry> { ReturnDocument = ReturnDocument.After };

                // Обновляем роль
                var updated = await _roles.FindOneAndUpdateAsync(filter, update, options);

                // Публикуем событие о смене роли
                try
                {
                    var evt = new RoleChangedEvent
                    {
                        EventId = Guid.NewGuid().ToString(),
                        UserId = userId,
                        Role = role.ToString(),
                        AssignedBy = assignedBy,
                        AssignedAt = now
                    };
                    await _producer.ProduceAsync("role-changed", evt);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to produce role-changed event after update for UserId {UserId}", userId);
                }

                return updated!;
            }
            else
            {
                // Создаем новую запись
                var newEntry = new UserRoleEntry
                {
                    UserId = userId,
                    Role = role,
                    AssignedBy = assignedBy,
                    AssignedAt = now
                };

                // Создаем новую роль
                await _roles.InsertOneAsync(newEntry);

                // Публикуем событие о назначении роли
                try
                {
                    var evt = new RoleChangedEvent
                    {
                        EventId = Guid.NewGuid().ToString(),
                        UserId = userId,
                        Role = role.ToString(),
                        AssignedBy = assignedBy,
                        AssignedAt = now
                    };
                    await _producer.ProduceAsync("role-changed", evt);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to produce role-changed event after insert for UserId {UserId}", userId);
                }

                return newEntry;
            }
        }

        /// <summary>
        /// Удалить роль пользователя
        /// </summary>
        /// <param name="userId"></param>
        /// <returns>1 - если удалена, 0 - если не удалена</returns>
        public async Task<bool> DeleteRoleAsync(string userId)
        {
            var filter = Builders<UserRoleEntry>.Filter.Eq(r => r.UserId, userId);
            var result = await _roles.DeleteOneAsync(filter);
            return result.DeletedCount > 0;
        }

        /// <summary>
        /// Получить всех пользователей с указанной ролью
        /// </summary>
        /// <param name="role">роль</param>
        /// <returns>список пользователей с ролью</returns>
        public async Task<IEnumerable<UserRoleEntry>> GetByRoleAsync(UserRole role)
        {
            return await _roles.Find(r => r.Role == role).ToListAsync();
        }
    }
}
