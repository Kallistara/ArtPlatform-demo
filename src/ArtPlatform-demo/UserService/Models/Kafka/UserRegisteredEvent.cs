using System.Text.Json.Serialization;

namespace UserService.Models.Kafka
{
    public class UserRegisteredEvent
    {
        public string EventId { get; set; } = Guid.NewGuid().ToString();

        public string UserId { get; set; } = string.Empty;

        public string Username { get; set; } = string.Empty;

        public DateTime CreatedAT { get; set; } = DateTime.UtcNow;
    }
}
