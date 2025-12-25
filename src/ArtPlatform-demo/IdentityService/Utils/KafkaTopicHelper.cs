using Confluent.Kafka;
using Confluent.Kafka.Admin;

namespace IdentityService.Utils
{
    public class KafkaTopicHelper
    {
        public static async Task EnsureTopicsCreatedAsync(string bootstrapServers, IEnumerable<TopicSpecification> topics)
        {
            var adminConfig = new AdminClientConfig { BootstrapServers = bootstrapServers };
            using var admin = new AdminClientBuilder(adminConfig).Build();

            try
            {
                await admin.CreateTopicsAsync(topics);
                Console.WriteLine("Kafka topics created successfully");
            }
            catch (CreateTopicsException ex)
            {
                foreach (var result in ex.Results)
                {
                    if (result.Error.Code == ErrorCode.TopicAlreadyExists)
                    {
                        Console.WriteLine($"Topic {result.Topic} already exists");
                    }
                    else
                    {
                        Console.WriteLine($"Failed to create topic {result.Topic}: {result.Error.Reason}");
                    }
                }
            }
            catch (Exception e)
            {
                Console.WriteLine($"Unexpected error creating topics: {e.Message}");
            }
        }
    }
}
