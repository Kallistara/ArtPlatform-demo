using Confluent.Kafka;
using System.Text.Json;

namespace RoleService.Services.Kafka
{
    /// <summary>
    /// Сервис для отправки сообщений кафка
    /// </summary>
    public class KafkaProducerService : IDisposable
    {
        private readonly IProducer<Null, string> _producer;

        /// <summary>
        /// Конструктор
        /// </summary>
        /// <param name="configuration"><конфигурация/param>
        public KafkaProducerService(IConfiguration configuration)
        {
            // Адрес брокера
            var bootstrap = configuration["KAFKA_BOOTSTRAP_SERVERS"]
                            ?? Environment.GetEnvironmentVariable("KAFKA_BOOTSTRAP_SERVERS")
                            ?? "localhost:9092";

            var config = new ProducerConfig { BootstrapServers = bootstrap };
            _producer = new ProducerBuilder<Null, string>(config).Build();
        }

        /// <summary>
        /// Метод, отправляющий сообщение в топик кафки
        /// </summary>
        /// <param name="topic">топик</param>
        /// <param name="message">сообщение</param>
        /// <param name="cancellationToken">токен асинхронных задач</param>
        /// <returns></returns>
        public async Task ProduceAsync<T>(string topic, T message, CancellationToken cancellationToken = default)
        {
            var json = JsonSerializer.Serialize(message);
            var msg = new Message<Null, string> { Value = json };
            await _producer.ProduceAsync(topic, msg, cancellationToken);
        }

        /// <summary>
        /// Метод, освобождающий ресурсы
        /// </summary>
        public void Dispose() => _producer?.Dispose();
    }

}
