using MongoDB.Driver;
using MongoDB.Driver.Linq;
using System.ComponentModel;
using UserService.data;
using UserService.Models;
using UserService.Models.Kafka;
using UserService.Services.Kafka;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace UserService.Services
{
    /// <summary>
    /// Реализация интерфейса IUserService бизнес-логики работы с профилями 
    /// </summary>
    public class UserProfileService : IUserService
    {
        // Коллекция Mongo
        private readonly IMongoCollection<User> _profiles;
        private readonly KafkaProducerService _producer;
        private readonly ILogger<UserProfileService> _logger;

        /// <summary>
        /// Конструктор
        /// </summary>
        /// <param name="context">бд</param>
        /// <param name="producer">продьюсер</param>
        /// <param name="logger">логирование</param>
        public UserProfileService(MongoDBContext context, KafkaProducerService producer, ILogger<UserProfileService> logger)
        {
            _profiles = context.Profiles;
            _producer = producer;
            _logger = logger;
        }

        /// <summary>
        /// Получение всех профилей
        /// </summary>
        /// <returns>список объектов User</returns>
        public async Task<List<User>> GetAsync() => await _profiles.Find(_ => true).ToListAsync();

        /// <summary>
        /// Получение профиля пользователя с заданным userId
        /// </summary>
        /// <param name="userId">идентификатор для поиска профиля</param>
        /// <returns>первый объект с заданным userId или null</returns>
        public async Task<User?> GetProfileAsync(string userId) =>
             await _profiles.Find(p => p.UserId == userId).FirstOrDefaultAsync();

        /// <summary>
        /// Создание нового профиля пользователя в коллекции
        /// </summary>
        /// <param name="request">DTO для создания объекта</param>
        /// <returns>новый объект User (пользователь)</returns>
        public async Task<User> CreateProfileAsync(CreatedProfileRequest request)
        {
            var user = new User
            {
                UserId = request.UserId,
                UserName = request.UserName,
                DisplayName = request.DisplayName,
                Bio = request.Bio,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Role = UserRole.Unauthorized
            };

            await _profiles.InsertOneAsync(user);
            return user;
        }

        /// <summary>
        /// Обновление профиля пользователя в коллекции
        /// </summary>
        /// <param name="userId">userid пользователя, который будет обновляться</param>
        /// <param name="request">DTO для обновления объекта</param>
        /// <returns>обновленный объект User или необновленный объект</returns>
        public async Task<User?> UpdateProfileAsync(string userId, UpdatedProfileRequest request)
        {
            // Получем текущий профиль
            var currentProfile = await GetProfileAsync(userId);
            
            if (currentProfile == null) 
                return null;

            // Фильтр по UserId и Обновление Mongo
            var filter = Builders<User>.Filter.Eq(p => p.UserId, userId);
            var updateBuilder = Builders<User>.Update;
            var updates = new List<UpdateDefinition<User>>();
            var hasChanges = false;

            if (request.DisplayName != null && request.DisplayName != currentProfile.DisplayName)
            {
                updates.Add(updateBuilder.Set(p => p.DisplayName, request.DisplayName));
                hasChanges = true;
            }

            if (request.Bio != null && request.Bio != currentProfile.Bio)
            {
                updates.Add(updateBuilder.Set(p => p.Bio, request.Bio));
                hasChanges = true;
            }

            if (request.Contact != null)
            {
                updates.Add(updateBuilder.Set(p => p.Contact, request.Contact));
                hasChanges = true;
            }

            // Если были изменения - обновляем
            if (hasChanges)
            {
                updates.Add(updateBuilder.Set(p => p.UpdatedAt, DateTime.UtcNow));

                var combinedUpdate = updateBuilder.Combine(updates);
                var options = new FindOneAndUpdateOptions<User>
                {
                    ReturnDocument = ReturnDocument.After
                };

                return await _profiles.FindOneAndUpdateAsync(filter, combinedUpdate, options);
            }

            // Если изменений нет - возвращаем текущий профиль
            return currentProfile;
        }

        /// <summary>
        /// Удаление профиля
        /// </summary>
        /// <param name="userId">userId объекта для удаления</param>
        /// <returns>1 - если объект удален, 0 - в обратном случае</returns>
        public async Task<bool> DeleteProfileAsync(string userId)
        {
            // Фильтр по UserId
            var filter = Builders<User>.Filter.Eq(p => p.UserId, userId);

            // Получаем профиль
            var existing = await _profiles.Find(filter).FirstOrDefaultAsync();
            if (existing == null)
                return false;

            // Удаляем из бд
            var result = await _profiles.DeleteOneAsync(filter);

            if (result.DeletedCount > 0)
            {
                // Публикуем событие user-deleted
                try
                {
                    var evt = new UserDeletedEvent
                    {
                        EventId = Guid.NewGuid().ToString(),
                        UserId = userId,
                        Username = existing.UserName,
                        DeletedAt = DateTime.UtcNow
                    };
                    await _producer.ProduceAsync("user-deleted", evt);
                    _logger.LogInformation("Published user-deleted for UserId {UserId}", userId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to publish user-deleted for UserId {UserId}", userId);
                }
                return true;
            }
            return false;
        }

        /// <summary>
        /// Поиск профилей (по полям UserName, DisplayName, Bio) по текстовому запросу
        /// </summary>
        /// <param name="query">строка для поиска профилей</param>
        /// <returns>список профилей, соответствующих строке поиска</returns>
        public async Task<IEnumerable<User>> SearchProfileAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
                return Enumerable.Empty<User>();

            // Поиск по подстроке 
            var filter = Builders<User>.Filter.Or(
                Builders<User>.Filter.Regex(p => p.UserName,
                    new MongoDB.Bson.BsonRegularExpression(query, "i")),
                Builders<User>.Filter.Regex(p => p.DisplayName,
                    new MongoDB.Bson.BsonRegularExpression(query, "i")),
                Builders<User>.Filter.Regex(p => p.Bio,
                    new MongoDB.Bson.BsonRegularExpression(query, "i"))
            );

            return await _profiles.Find(filter).Limit(20).ToListAsync();
        }

        /// <summary>
        /// Получение профиля по username
        /// </summary>
        /// <param name="username">для поиска профиля</param>
        /// <returns>найденного пользователя или null</returns>
        public async Task<User?> GetProfileByUsernameAsync(string username)
        {
            if (string.IsNullOrWhiteSpace(username))
                return null;

            return await _profiles.Find(p => p.UserName == username).FirstOrDefaultAsync();
        }

        /// <summary>
        /// Проверка существования профиля с заданным username
        /// </summary>
        /// <param name="username">для проверки существования</param>
        /// <returns>1 - если существует, 0 если не существует</returns>
        public async Task<bool> UsernameExistsAsync(string username)
        {
            if (string.IsNullOrWhiteSpace(username))
                return false;

            return await _profiles.Find(p => p.UserName == username).AnyAsync();
        }

        /// <summary>
        /// Изменение Username пользователя
        /// </summary>
        /// <param name="userId">id пользователя, имя которого будет меняться</param>
        /// <param name="newUsername">новое имя пользователя</param>
        /// <returns>null при ошибке + описание ошибки, измененного пользователя</returns>
        public async Task<ChangeUsernameResult> ChangeUsernameAsync(string userId, string newUsername)
        {
            // Получаем текущего пользователя
            var existingUser = await GetProfileAsync(userId);

            if (existingUser == null)
                return new ChangeUsernameResult
                {
                    Success = false,
                    Error = "User not found",
                    ErrorType = "NOT_FOUND"
                };

            // Проверяем, тот же username или другой
            if (existingUser.UserName == newUsername)
                return new ChangeUsernameResult
                {
                    Success = true,
                    User = existingUser,
                    Message = "Username is already set to this value"
                };

            // Проверяем доступность нового username
            if (await UsernameExistsAsync(newUsername))
                return new ChangeUsernameResult
                {
                    Success = false,
                    Error = "Username already taken",
                    ErrorType = "USERNAME_TAKEN"
                };

            // Обновляем username в базе
            var filter = Builders<User>.Filter.Eq(p => p.UserId, userId);
            var update = Builders<User>.Update
                .Set(p => p.UserName, newUsername)
                .Set(p => p.UpdatedAt, DateTime.UtcNow);

            var options = new FindOneAndUpdateOptions<User>
            {
                ReturnDocument = ReturnDocument.After
            };

            var updatedUser = await _profiles.FindOneAndUpdateAsync(filter, update, options);

            return new ChangeUsernameResult
            {
                Success = true,
                User = updatedUser,
                Message = "Username changed successfully"
            };
        }

        /// <summary>
        /// Обновление статистики контент-креатора
        /// </summary>
        /// <param name="userId">id контент-креатора для обновления статистики</param>
        /// <param name="stats">объект статистики контент-креатора</param>
        /// <returns>обновленный объект</returns>
        public async Task<User?> UpdateCreatorStatsAsync(string userId, ContentCreatorStats stats)
        {
            var user = await GetProfileAsync(userId);
            if (user == null) return null;

            var filter = Builders<User>.Filter.Eq(u => u.UserId, userId);
            var update = Builders<User>.Update
                .Set(u => u.UpdatedAt, DateTime.UtcNow)
                .Set(u => u.CreatorStats, stats);

            var options = new FindOneAndUpdateOptions<User>
            {
                ReturnDocument = ReturnDocument.After
            };

            return await _profiles.FindOneAndUpdateAsync(filter, update, options);
        }

        /// <summary>
        /// Обновление статистики пользователя
        /// </summary>
        /// <param name="userId">id пользователя для обновления статистики</param>
        /// <param name="stats">объект статистики пользователя</param>
        /// <returns>обновленный объект</returns>
        public async Task<User?> UpdateUserStatsAsync(string userId, UserStats stats)
        {
            var user = await GetProfileAsync(userId);
            if (user == null) return null;

            var filter = Builders<User>.Filter.Eq(u => u.UserId, userId);
            var update = Builders<User>.Update
                .Set(u => u.UpdatedAt, DateTime.UtcNow)
                .Set(u => u.UserStats, stats);

            var options = new FindOneAndUpdateOptions<User>
            {
                ReturnDocument = ReturnDocument.After
            };

            return await _profiles.FindOneAndUpdateAsync(filter, update, options);
        }

        /// <summary>
        /// Обновление социальной статистики
        /// </summary>
        /// <param name="userId">id пользователя для обновления статистики</param>
        /// <param name="stats">объект социальной статистики</param>
        /// <returns>обновленный объект</returns>
        public async Task<User?> UpdateSocialStatsAsync(string userId, SocialStats stats)
        {
            var user = await GetProfileAsync(userId);
            if (user == null) return null;

            var filter = Builders<User>.Filter.Eq(u => u.UserId, userId);
            var update = Builders<User>.Update
                .Set(u => u.UpdatedAt, DateTime.UtcNow)
                .Set(u => u.SocialStats, stats);

            var options = new FindOneAndUpdateOptions<User>
            {
                ReturnDocument = ReturnDocument.After
            };

            return await _profiles.FindOneAndUpdateAsync(filter, update, options);
        }

        /// <summary>
        /// Обновление роли
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="role"></param>
        /// <returns>обновленный объект</returns>
        public async Task<User?> UpdateRoleAsync(string userId, UserRole role)
        {
            var filter = Builders<User>.Filter.Eq(u => u.UserId, userId);
            var update = Builders<User>.Update
                .Set(u => u.Role, role)
                .Set(u => u.UpdatedAt, DateTime.UtcNow);

            var options = new FindOneAndUpdateOptions<User> 
            { 
                ReturnDocument = ReturnDocument.After, IsUpsert = false 
            };

            return await _profiles.FindOneAndUpdateAsync(filter, update, options);
        }
    }
}
