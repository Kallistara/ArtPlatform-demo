using System.Text.Json;
using Confluent.Kafka;
using Confluent.Kafka.Admin;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using UserService.Models;
using UserService.Models.Kafka;
using UserService.Models.Entities;
using UserService.Models.DTO;

namespace UserService.Services.Kafka
{
    /// <summary>
    /// Сервис, создающий консамера для потребления сообщений из кафки (работает в фоновом режиме)
    /// </summary>
    public class KafkaConsumerService : BackgroundService
    {
        
        private readonly IConfiguration _configuration; // Конфигурация
        private readonly IServiceScopeFactory _scopeFactory; // Фабрика для создания служб (внедрение зависимостей)
        private readonly KafkaProducerService _producer; // Продьюсер
        private readonly ILogger<KafkaConsumerService> _logger; // Логирование

        /// <summary>
        /// Конструктор
        /// </summary>
        /// <param name="configuration">Конфигурация</param>
        /// <param name="scopeFactory">Фабрика для создания служб</param>
        /// <param name="producer">Продьюсер</param>
        /// <param name="logger">Логирование</param>
        public KafkaConsumerService(IConfiguration configuration, IServiceScopeFactory scopeFactory, 
            KafkaProducerService producer, ILogger<KafkaConsumerService> logger)
        {
            _configuration = configuration;
            _scopeFactory = scopeFactory;
            _producer = producer;
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
                GroupId = "user-service-consumer-group",
                AutoOffsetReset = AutoOffsetReset.Earliest,
                EnableAutoCommit = true
            };
            using var consumer = new ConsumerBuilder<Null, string>(config).Build();

            // Подписываемся на топики
            consumer.Subscribe(new[] { "user-registered", "role-changed" });

            _logger.LogInformation("Kafka consumer started and subscribed to topics: user-registered, role-changed");

            // Основной цикл обработки сообщений (ждем новое сообщение)
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Читаем сообщение
                    var cr = consumer.Consume(stoppingToken);
                    if (cr?.Message?.Value == null)
                        continue;

                    // Топик
                    var topic = cr.Topic;

                    // Создаем scope для DI
                    using var scope = _scopeFactory.CreateScope();
                    var userService = scope.ServiceProvider.GetRequiredService<IUserService>();

                    // Обрабатываем сообщение из топика user-registered
                    if (string.Equals(topic, "user-registered", StringComparison.OrdinalIgnoreCase))
                    {
                        // Десереализуем сообщение
                        var evt = JsonSerializer.Deserialize<UserRegisteredEvent>(cr.Message.Value);
                        if (evt == null) continue;

                        // Проверяем есть ли такой профиль
                        var existing = await userService.GetProfileAsync(evt.UserId);
                        if (existing != null)
                        {
                            _logger.LogInformation("Profile already exists for UserId {UserId}", evt.UserId);
                            var alreadyCreatedEvent = new ProfileCreatedEvent
                            {
                                EventId = Guid.NewGuid().ToString(),
                                UserId = evt.UserId,
                                Success = true,
                                CreatedAt = existing.CreatedAt
                            };

                            // Отправляем сообщение, что профиль уже есть
                            await _producer.ProduceAsync("profile-created", alreadyCreatedEvent, stoppingToken);
                            continue;
                        }
                        // Создаем профиль
                        try
                        {
                            var created = await userService.CreateProfileAsync(new CreatedProfileRequest
                            {
                                UserId = evt.UserId,
                                UserName = evt.Username,
                                DisplayName = evt.Username
                            });
                            _logger.LogInformation("Profile created for UserId {UserId}", evt.UserId);

                            // Отправляем событие успешного создания профиля
                            var successEvent = new ProfileCreatedEvent
                            {
                                EventId = Guid.NewGuid().ToString(),
                                UserId = created.UserId,
                                Success = true,
                                CreatedAt = created.CreatedAt
                            };
                            await _producer.ProduceAsync("profile-created", successEvent, stoppingToken);
                        }
                        // Логируем и отправляем событие с ошибкой
                        catch (Exception exCreate)
                        {
                            _logger.LogError(exCreate, "Failed to create profile for UserId {UserId}", evt.UserId);
                            var errorEvent = new ProfileCreatedEvent
                            {
                                EventId = Guid.NewGuid().ToString(),
                                UserId = evt.UserId,
                                Success = false,
                                Error = exCreate.Message,
                                CreatedAt = DateTime.UtcNow
                            };
                            try
                            {
                                await _producer.ProduceAsync("profile-created", errorEvent, stoppingToken);
                            }
                            catch (Exception exProduce)
                            {
                                _logger.LogError(exProduce, "Failed to publish profile-created for UserId {UserId}", evt.UserId);
                            }
                        }
                    }
                    // Обрабатывем топик role-changed
                    else if (string.Equals(topic, "role-changed", StringComparison.OrdinalIgnoreCase))
                    {
                        var evt = JsonSerializer.Deserialize<RoleChangedEvent>(cr.Message.Value);
                        if (evt == null) continue;

                        _logger.LogInformation("role-changed event for {UserId} -> {NewRole}", evt.UserId, evt.Role);

                        // Обновляем роль в профиле
                        try
                        {
                            if (Enum.TryParse<UserRoleEnum>(evt.Role, true, out var parsedRole))
                            {
                                await userService.UpdateRoleAsync(evt.UserId, parsedRole);
                            }
                            else
                            {
                                _logger.LogWarning("Unknown role received in role-changed: {Role}", evt.Role);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to update role for UserId {UserId}", evt.UserId);
                        }
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
