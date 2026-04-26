using ArtService.Models.Kafka;
using Confluent.Kafka;
using System.Text.Json;

namespace ArtService.Services.Kafka
{
    /// <summary>
    /// Сервис, создающий консамера для потребления сообщений из кафки (работает в фоновом режиме)
    /// </summary>
    public class KafkaConsumerService : BackgroundService
    {

        private readonly IConfiguration _configuration; // Конфигурация
        private readonly IServiceScopeFactory _scopeFactory; // Фабрика для создания служб (внедрение зависимостей)
        private readonly ILogger<KafkaConsumerService> _logger; // Логирование

        /// <summary>
        /// Конструктор
        /// </summary>
        /// <param name="configuration">Конфигурация</param>
        /// <param name="scopeFactory">Фабрика для создания служб</param>
        /// <param name="logger">Логирование</param>
        public KafkaConsumerService(IConfiguration configuration, IServiceScopeFactory scopeFactory,
            ILogger<KafkaConsumerService> logger)
        {
            _configuration = configuration;
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        /// <summary>
        /// Основной цикл потребителя
        /// </summary>
        /// <param name="stoppingToken">токен для асинхронных задач</param>
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
                GroupId = "art-service-consumer-group",
                AutoOffsetReset = AutoOffsetReset.Earliest,
                EnableAutoCommit = true
            };
            using var consumer = new ConsumerBuilder<Null, string>(config).Build();

            // Подписываемся на топики
            consumer.Subscribe(new[] { "user-deleted" });

            _logger.LogInformation("Kafka consumer started and subscribed to topic: user-deleted");

            // Основной цикл обработки сообщений (ждем новое сообщение)
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Читаем сообщение
                    var cr = consumer.Consume(stoppingToken);
                    if (cr?.Message?.Value == null)
                        continue;

                    // Обрабатываем сообщение из топика user-deleted
                    if (string.Equals(cr.Topic, "user-deleted", StringComparison.OrdinalIgnoreCase))
                    {
                        // Десереализуем сообщение
                        var evt = JsonSerializer.Deserialize<UserDeletedEvent>(cr.Message.Value);
                        if (evt == null) continue;

                        // Создаем scope для DI
                        using var scope = _scopeFactory.CreateScope();
                        var artService = scope.ServiceProvider.GetRequiredService<IArtworkService>();

                        // Получаем количество удаленных картин художника
                        var deletedCount = await artService.DeleteByArtistIdAsync(evt.UserId);

                        _logger.LogInformation("UserDeleted recived for {UserId}. Deleted artworks count: {Count}", 
                            evt.UserId, deletedCount);
                    }
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Kafka consumer error");
                }
            }
            consumer.Close();
        }
    }
}
