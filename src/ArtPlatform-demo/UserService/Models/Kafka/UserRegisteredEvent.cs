using System.Text.Json.Serialization;

namespace UserService.Models.Kafka
{
    /// <summary>
    /// Модель события регистрации пользователя
    /// </summary>
    public class UserRegisteredEvent
    {
        // Идентификатор события
        public string EventId { get; set; } = Guid.NewGuid().ToString();

        // Идентификатор пользователя
        public string UserId { get; set; } = string.Empty;

        // Логин (имя пользователя)
        public string Username { get; set; } = string.Empty;

        // Дата создания
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
