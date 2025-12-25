namespace IdentityService.Models.Kafka
{
    public class UserRegisteredEvent
    {
        public string EventId { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
