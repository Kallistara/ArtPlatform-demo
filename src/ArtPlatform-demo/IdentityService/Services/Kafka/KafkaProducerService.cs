using System.Text.Json;
using Confluent.Kafka;

namespace IdentityService.Services.Kafka
{
    /// <summary>
    /// Класс для создания продьюсера для отправки сообщений в кафку
    /// </summary>
    public class KafkaProducerService
    {
        private readonly IProducer<Null, string> _producer;

        /// <summary>
        /// Конструктор создающий продьюсера
        /// </summary>
        /// <param name="configuration">конфигурация</param>
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
        /// <param name="topic">топик, куда отправляется сообщение</param>
        /// <param name="message">сообщение</param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        public async Task ProduceAsync<T>(string topic, T message, CancellationToken cancellationToken = default)
        {
            // Сериализация события в json
            var json = JsonSerializer.Serialize(message);

            // Сообщение
            var msg = new Message<Null, string> { Value = json };

            // отправка сообщения в топик
            _ = await _producer.ProduceAsync(topic, msg, cancellationToken);
        }

        /// <summary>
        /// Освобождение ресурсов
        /// </summary>
        public void Dispose()
        {
            _producer?.Dispose();
        }
    }
}
