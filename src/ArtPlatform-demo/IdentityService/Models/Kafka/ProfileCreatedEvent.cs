namespace IdentityService.Models.Kafka
{
    public class ProfileCreatedEvent
    {
        public string EventId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public bool Success { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? Error { get; set; }
    }
}
