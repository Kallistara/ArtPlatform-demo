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
            consumer.Subscribe("profile-created");
            _logger.LogInformation("ProfileCreatedConsumer subscribed to topic: profile-created");

            // Основной цикл обработки сообщений (ждем новое сообщение)
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Читаем сообщение
                    var cr = consumer.Consume(stoppingToken);
                    if (cr?.Message?.Value == null) continue;

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
                            .Unset(u => u.ProfileCreationError) // убираем старую ошибку
                        : Builders<User>.Update
                            .Set(u => u.ProfileCreated, false)
                            .Set(u => u.ProfileCreationError, evt.Error)
                            .Set(u => u.ProfileCreatedAt, evt.CreatedAt);

                    await _db.Users.UpdateOneAsync(filter, update);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error while consuming profile-created");
                }
            }
            consumer.Close();
        }
    }
}
