namespace ArtService.Models.Kafka
{
    /// <summary>
    /// Модель события удаления пользователя
    /// </summary>
    public class UserDeletedEvent
    {
        // Идентификатор события
        public string EventId { get; set; } = Guid.NewGuid().ToString();

        // Идентификтор пользователя
        public string UserId { get; set; } = string.Empty;
    }
}
