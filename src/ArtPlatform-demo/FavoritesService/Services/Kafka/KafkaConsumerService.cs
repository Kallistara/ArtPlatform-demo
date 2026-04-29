using Confluent.Kafka;
using FavoritesService.Models.Kafka;
using System.Text.Json;

namespace FavoritesService.Services.Kafka
{
    /// <summary>
    /// Сервис, создающий консамера для потребления сообщений из кафки (работает в фоновом режиме)
    /// </summary>
    public class KafkaConsumerService: BackgroundService
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
                GroupId = "favorites-service-consumer-group",
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
                    var favoriteService = scope.ServiceProvider.GetRequiredService<IFavoritesArtService>();

                    // Обрабатываем сообщение из топика user-deleted
                    if (string.Equals(cr.Topic, "user-deleted", StringComparison.OrdinalIgnoreCase))
                    {
                        // Десереализуем сообщение
                        var evt = JsonSerializer.Deserialize<UserDeletedEvent>(cr.Message.Value);
                        if (evt == null) continue;

                        var deletedCount = await favoriteService.RemoveByUserIdAsync(evt.UserId);

                        _logger.LogInformation("Favorites removed by user-deleted. UserId = {UserId}, " +
                            "DeletedCount = {DeletedCount}", evt.UserId, deletedCount);
                    }
                    // Обрабатываем сообщение из топика art-deleted
                    else if (string.Equals(cr.Topic, "art-deleted", StringComparison.OrdinalIgnoreCase))
                    {
                        // Десереализуем сообщение
                        var evt = JsonSerializer.Deserialize<ArtDeletedEvent>(cr.Message.Value);
                        if (evt == null) continue;

                        var deletedCount = await favoriteService.RemoveByArtworkIdAsync(evt.ArtworkId);

                        _logger.LogInformation("Favorites removed by art-deleted. ArtworkId = {ArtworkId}, " +
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
