using Confluent.Kafka;
using RoleService.Models.Entities;
using RoleService.Models.Kafka;
using System.Text.Json;

namespace RoleService.Services.Kafka
{
    /// <summary>
    /// Сервис, создающий консамера для потребления сообщений из кафки (работает в фоновом режиме)
    /// </summary>
    public class KafkaConsumerService : BackgroundService
    {
        private readonly IConfiguration _configuration; // Конфигурация
        private readonly IServiceScopeFactory _scopeFactory; // Фабрика для создания служб (внедрение зависимостей)
        private readonly ILogger<KafkaConsumerService> _logger; // логирование

        /// <summary>
        /// Конструктор
        /// </summary>
        /// <param name="configuration">конфигурация</param>
        /// <param name="scopeFactory">Фабрика для создания служб</param>
        /// <param name="logger">логирование</param>
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
                GroupId = "role-service-consumer-group",
                AutoOffsetReset = AutoOffsetReset.Earliest
            };

            // Данные админа
            var bootstrapAdminUserId = _configuration["INITIAL_ADMIN_USERID"]
                ?? Environment.GetEnvironmentVariable("INITIAL_ADMIN_USERID")
                ?? string.Empty;
            var bootstrapAdminUsername = _configuration["INITIAL_ADMIN_USERNAME"]
                ?? Environment.GetEnvironmentVariable("INITIAL_ADMIN_USERNAME")
                ?? string.Empty;

            using var consumer = new ConsumerBuilder<Null, string>(config).Build();

            // Подписываемся на топик
            consumer.Subscribe(new[] { "user-registered", "user-deleted" });
            _logger.LogInformation("RolesService Kafka consumer subscribed to: user-registered, user-deleted ");

            // Основной цикл обработки сообщений (ждем новое сообщение)
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Читаем сообщение
                    var cr = consumer.Consume(stoppingToken);
                    if (cr?.Message?.Value == null) continue;

                    // Топик
                    var topic = cr.Topic;

                    // Создаем scope для DI
                    using var scope = _scopeFactory.CreateScope();
                    var roleService = scope.ServiceProvider.GetRequiredService<IRolesService>();
                    var producer = scope.ServiceProvider.GetRequiredService<KafkaProducerService>();

                    // Обрабатываем топик user-registered
                    if (string.Equals(topic, "user-registered", StringComparison.OrdinalIgnoreCase))
                    {
                        // Десериализуем сообщение
                        var evt = JsonSerializer.Deserialize<UserRegisteredEvent>(cr.Message.Value);
                        if (evt == null) continue;

                        // Смена роли на админ
                        var isBootstrapAdmin = (!string.IsNullOrWhiteSpace(bootstrapAdminUserId) && evt.UserId == bootstrapAdminUserId)
                            || (!string.IsNullOrWhiteSpace(bootstrapAdminUsername) && string.Equals(evt.Username, bootstrapAdminUsername, StringComparison.OrdinalIgnoreCase));

                        var assignedRole = isBootstrapAdmin ? UserRole.Admin : UserRole.User;

                        // Изменяем роль
                        await roleService.UpsertRoleAsync(evt.UserId, assignedRole, assignedBy: "system");
                        _logger.LogInformation("Assigned default role '{Role}' to {UserId})", assignedRole, evt.UserId);

                    }

                    // Обрабатываем топик user-deleted
                    else if (string.Equals(topic, "user-deleted", StringComparison.OrdinalIgnoreCase))
                    {
                        // Десериализуем сообщение
                        var evt = JsonSerializer.Deserialize<UserDeletedEvent>(cr.Message.Value);
                        if (evt == null) continue;

                        _logger.LogInformation("Received user-deleted for {UserId}, role deleted", evt.UserId);

                        // Помечаем роль как Unauthorized
                        await roleService.DeleteRoleAsync(evt.UserId);

                    }
                }
                catch (OperationCanceledException) { break; }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Roles Kafka consumer error");
                }
            }
            consumer.Close();
        }
    }
}
