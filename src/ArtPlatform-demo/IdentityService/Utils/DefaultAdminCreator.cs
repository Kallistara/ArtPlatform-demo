using IdentityService.data;
using IdentityService.Models.Kafka;
using MongoDB.Driver;

namespace IdentityService.Utils
{
    /// <summary>
    /// Утилита для создания дефолного админа.
    /// </summary>
    public class DefaultAdminCreator
    {
        public static async Task EnsureAsync(IServiceProvider services, string adminUserId, string adminUsername, string adminPassword)
        {
            if (string.IsNullOrWhiteSpace(adminUsername) || string.IsNullOrWhiteSpace(adminPassword)) return;

            using var scope = services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<MongoDBContext>();
            var producer = scope.ServiceProvider.GetRequiredService<IdentityService.Services.Kafka.KafkaProducerService>();
            var logger = scope.ServiceProvider.GetService<ILoggerFactory>()?.CreateLogger("DefaultAdminCreator"); 

            try
            {
                // Проверяем наличие по username или userId
                var existingByUsername = await db.Users.Find(u => u.Username == adminUsername).FirstOrDefaultAsync();
                var existingByUserId = await db.Users.Find(u => u.UserId == adminUserId).FirstOrDefaultAsync();

                if (existingByUsername == null && existingByUserId == null)
                {
                    // Создаем новго админа
                    var passwordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword);
                    var adminUser = new IdentityService.Models.User
                    {
                        UserId = adminUserId,
                        Username = adminUsername,
                        PasswordHash = passwordHash,
                        CreatedAt = DateTime.UtcNow
                    };

                    await db.Users.InsertOneAsync(adminUser);
                    logger?.LogInformation("Default admin created: Username={Username}, UserId={UserId}", adminUsername, adminUserId);

                    // Публикуем событие создания нового пользователя
                    try
                    {
                        var evt = new UserRegisteredEvent
                        {
                            UserId = adminUser.UserId,
                            Username = adminUser.Username,
                            CreatedAt = adminUser.CreatedAt
                        };
                        await producer.ProduceAsync("user-registered", evt);
                        logger?.LogInformation("Published user-registered for Default admin {UserId}", adminUser.UserId);
                    }
                    catch (Exception ex)
                    {
                        logger?.LogError(ex, "Failed to publish user-registered for Default admin {UserId}", adminUser.UserId);
                    }
                }
                else
                {
                    // Если уже существует админ
                    var existing = existingByUsername ?? existingByUserId;
                    logger?.LogInformation("Default admin already exists: Username={Username}, UserId={UserId}", existing.Username, existing.UserId);
                }
            }
            catch (Exception ex)
            {
                var l = scope.ServiceProvider.GetService<ILoggerFactory>()?.CreateLogger("DefaultAdminCreator");
                l?.LogError(ex, "Error while creating Default admin");
            }
        }
    }
}
