namespace RoleService.Models.Kafka
{
    /// <summary>
    /// Модель события создания профиля
    /// </summary>
    public class UserRegisteredEvent
    {
        // id
        public string EventId { get; set; } = Guid.NewGuid().ToString();

        // Идентификатор пользователя
        public string UserId { get; set; } = string.Empty;

        // Имя пользователя (логин)
        public string Username { get; set; } = string.Empty;

        // Дата создания
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
