namespace UserService.Models.Kafka
{
    /// <summary>
    /// Модель события изменения роли пользователя
    /// </summary>
    public class RoleChangedEvent
    {
        // id
        public string EventId { get; set; } = Guid.NewGuid().ToString();

        // Идентификатор пользователя
        public string UserId { get; set; } = string.Empty;

        // Роль
        public string Role { get; set; } = string.Empty;

        // Кто назначил роль
        public string? AssignedBy { get; set; }

        // Время изменения роли
        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    }
}
