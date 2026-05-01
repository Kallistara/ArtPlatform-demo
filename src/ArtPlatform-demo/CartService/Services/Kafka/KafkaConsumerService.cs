
using CartService.Models.Kafka;
using Confluent.Kafka;
using System.Text.Json;

namespace CartService.Services.Kafka
{
    /// <summary>
    /// Сервис, создающий консамера для потребления сообщений из кафки (работает в фоновом режиме)
    /// </summary>
    public class KafkaConsumerService:BackgroundService
    {
        private readonly IConfiguration _configuration; // Конфигурация
        private readonly ILogger<KafkaConsumerService> _logger; //Логирование
        private readonly IServiceScopeFactory _scopeFactory; // Фабрика для создания служб (внедрение зависимостей)

        /// <summary>
        /// Конструктор
        /// </summary>
        /// <param name="configuration">Конфигурация</param>
        /// <param name="logger">Логирование</param>
        /// <param name="scopeFactory">Фабрика для создания служб</param>
        public KafkaConsumerService(IConfiguration configuration, ILogger<KafkaConsumerService> logger, 
            IServiceScopeFactory scopeFactory)
        {
            _configuration = configuration;
            _logger = logger;
            _scopeFactory = scopeFactory;
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
                GroupId = "cart-service-consumer-group",
                AutoOffsetReset = AutoOffsetReset.Earliest
            };
            using var consumer = new ConsumerBuilder<Null, string>(config).Build();

            // Подписываемся на топики
            consumer.Subscribe(new[] { "art-deleted", "user-deleted" });

            _logger.LogInformation("Kafka consumer started and subscribed to topics: art-deleted, user-deleted");

            // Основной цикл обработки сообщений (ждем новое сообщение)
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Читаем сообщение
                    var cr = consumer.Consume(stoppingToken);
                    if (cr?.Message?.Value == null)
                        continue;

                    // Создаем scope для DI
                    using var scope = _scopeFactory.CreateScope();
                    var cartService = scope.ServiceProvider.GetRequiredService<IArtCartService>();

                    // Обрабатываем сообщение из топика user-deleted
                    if (string.Equals(cr.Topic, "user-deleted", StringComparison.OrdinalIgnoreCase))
                    {
                        // Десереализуем сообщение
                        var evt = JsonSerializer.Deserialize<UserDeletedEvent>(cr.Message.Value);
                        if (evt == null) continue;

                        var deletedCount = await cartService.ClearCartAsync(evt.UserId);

                        _logger.LogInformation("Cart items removed by user-deleted. UserId = {UserId}, " +
                            "DeletedCount = {DeletedCount}", evt.UserId, deletedCount);
                    }
                    // Обрабатываем сообщение из топика art-deleted
                    else if (string.Equals(cr.Topic, "art-deleted", StringComparison.OrdinalIgnoreCase))
                    {
                        // Десереализуем сообщение
                        var evt = JsonSerializer.Deserialize<ArtDeletedEvent>(cr.Message.Value);
                        if (evt == null) continue;

                        var deletedCount = await cartService.RemoveByArtworkIdAsync(evt.ArtworkId);

                        _logger.LogInformation("Cart items removed by art-deleted. ArtworkId = {ArtworkId}, " +
                            "DeletedCount = {DeletedCount}", evt.ArtworkId, deletedCount);
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
