using Confluent.Kafka;
using IdentityService.data;
using IdentityService.Models;
using IdentityService.Models.Kafka;
using MongoDB.Driver;
using System.Text.Json;

namespace IdentityService.Services.Kafka
{
    /// <summary>
    /// Класс, создающий консамера для потребления сообщений из кафки (работает в фоновом режиме)
    /// </summary>
    public class KafkaConsumerService : BackgroundService
    {
        private readonly IConfiguration _configuration; // Конфигурация
        private readonly MongoDBContext _db; // БД
        private readonly ILogger<KafkaConsumerService> _logger; // Логирование

        /// <summary>
        /// Конструктор
        /// </summary>
        /// <param name="configuration">Конфигурация</param>
        /// <param name="db">БД</param>
        /// <param name="logger">Логирование</param>
        public KafkaConsumerService(IConfiguration configuration, MongoDBContext db, ILogger<KafkaConsumerService> logger)
        {
            _configuration = configuration;
            _db = db;
            _logger = logger;
        }

        /// <summary>
        /// Основной цикл потребителя
        /// </summary>
        /// <param name="stoppingToken">токен для асинхронных задач</param>
        /// <returns></returns>
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await Task.Yield(); // чтобы не блокировался поток

            // Адрес брокера
            var bootstrap = _configuration["KAFKA_BOOTSTRAP_SERVERS"]
                ?? Environment.GetEnvironmentVariable("KAFKA_BOOTSTRAP_SERVERS")
                ?? "localhost:9092";

            var config = new ConsumerConfig
            {
                BootstrapServers = bootstrap,
                GroupId = "identity-profile-created-group",
                AutoOffsetReset = AutoOffsetReset.Earliest
            };

            using var consumer = new ConsumerBuilder<Null, string>(config).Build();

            // Полписываемся на топик
            consumer.Subscribe(new[] { "profile-created", "role-changed", "user-deleted" });
            _logger.LogInformation("ProfileCreatedConsumer subscribed to topics: profile-created, role-changed, user-deleted ");

            // Основной цикл обработки сообщений (ждем новое сообщение)
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Читаем сообщение
                    var cr = consumer.Consume(stoppingToken);
                    if (cr?.Message?.Value == null) continue;

                    // Обрабатываем топик profile-created
                    if (string.Equals(cr.Topic, "profile-created", StringComparison.OrdinalIgnoreCase))
                    {
                        // Десериализуем сообщение
                        var evt = JsonSerializer.Deserialize<ProfileCreatedEvent>(cr.Message.Value);
                        if (evt == null) continue;

                        _logger.LogInformation("ProfileCreated event received for UserId {UserId} Success={Success} Error={Error}", evt.UserId, evt.Success, evt.Error);

                        // Обновляем поля для объектов User в бд
                        var filter = Builders<User>.Filter.Eq(u => u.UserId, evt.UserId);
                        var update = evt.Success
                            ? Builders<User>.Update
                                .Set(u => u.ProfileCreated, true)
                                .Set(u => u.ProfileCreatedAt, evt.CreatedAt)
                                .Unset(u => u.ProfileCreationError)
                            : Builders<User>.Update
                                .Set(u => u.ProfileCreated, false)
                                .Set(u => u.ProfileCreationError, evt.Error)
                                .Set(u => u.ProfileCreatedAt, evt.CreatedAt);

                        await _db.Users.UpdateOneAsync(filter, update);
                    }
                    // Обрабатываем топик role-changed
                    else if (string.Equals(cr.Topic, "role-changed", StringComparison.OrdinalIgnoreCase))
                    {
                        // Десериализуем сообщение
                        var evt = JsonSerializer.Deserialize<RoleChangedEvent>(cr.Message.Value);
                        if (evt == null) continue;

                        _logger.LogInformation("RoleChanged event received for UserId {UserId} Role={Role}", evt.UserId, evt.Role);

                        // Обновляем поля, связанные с ролью
                        var filter = Builders<User>.Filter.Eq(u => u.UserId, evt.UserId);
                        var update = Builders<User>.Update
                            .Set(u => u.Role, evt.Role)
                            .Set(u => u.ProfileCreatedAt, evt.AssignedAt); 

                        await _db.Users.UpdateOneAsync(filter, update);
                    }
                    else if (string.Equals(cr.Topic, "user-deleted", StringComparison.OrdinalIgnoreCase))
                    {
                        // Десериализуем сообщение
                        var evt = JsonSerializer.Deserialize<UserDeletedEvent>(cr.Message.Value);
                        if (evt == null) continue;

                        _logger.LogInformation("UserDeleted event received for UserId {UserId}. Removing identity record.", evt.UserId);

                        // Удаляем запись пользователя из коллекции
                        var filter = Builders<User>.Filter.Eq(u => u.UserId, evt.UserId);
                        var res = await _db.Users.DeleteOneAsync(filter);

                        if (res.DeletedCount > 0)
                        {
                            _logger.LogInformation("Identity record deleted for UserId {UserId}", evt.UserId);
                        }
                        else
                        {
                            _logger.LogWarning("No identity record found to delete for UserId {UserId}", evt.UserId);
                        }
                    }
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error while consuming messages");
                }
            }

            consumer.Close();
        }
    }
}

