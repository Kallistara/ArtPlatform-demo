using Confluent.Kafka;
using System.Text.Json;

namespace UserService.Services.Kafka
{
    public class KafkaProducerService
    {
        private readonly IProducer<Null, string> _producer;

        public KafkaProducerService(IConfiguration configuration)
        {
            var bootstrap = configuration["KAFKA_BOOTSTRAP_SERVERS"]
                            ?? Environment.GetEnvironmentVariable("KAFKA_BOOTSTRAP_SERVERS")
                            ?? "localhost:9092";

            var config = new ProducerConfig { BootstrapServers = bootstrap };
            _producer = new ProducerBuilder<Null, string>(config).Build();
        }

        public async Task ProduceAsync<T>(string topic, T message, CancellationToken cancellationToken = default)
        {
            var json = JsonSerializer.Serialize(message);
            var msg = new Message<Null, string> { Value = json };
            await _producer.ProduceAsync(topic, msg, cancellationToken);
        }

        public void Dispose()
        {
            _producer?.Dispose();
        }
    }
}
