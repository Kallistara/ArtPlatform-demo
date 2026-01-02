using System.Text.Json.Serialization;

namespace UserService.Models.Kafka
{
    /// <summary>
    /// Модель события создания профиля
    /// </summary>
    public class ProfileCreatedEvent
    {
        // Идентификатор события
        public string EventId { get; set; } = string.Empty;

        // Идентификатор пользователя
        public string UserId { get; set; } = string.Empty;

        // Флаг успеха
        public bool Success { get; set; }

        // Дата создания
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Ошибка
        public string? Error { get; set; }
    }
}
