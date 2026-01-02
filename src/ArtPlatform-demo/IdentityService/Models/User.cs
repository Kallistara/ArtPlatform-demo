using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace IdentityService.Models
{
    /// <summary>
    /// Модель для хренеия в БД данных для регистрации
    /// </summary>
    public class User
    {
        [BsonId]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // Внешний ID
        public string UserId { get; set; } = string.Empty;

        // Имя пользователя (логин)
        public string Username { get; set; } = string.Empty;

        // Пароль
        public string PasswordHash { get; set; } = string.Empty;

        // Дата создания аккаунта
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow; 

        // Роль пользователя 
        [BsonRepresentation(BsonType.String)]
        public string? Role { get; set; } = null;

        // Флаг создания профиля
        public bool? ProfileCreated { get; set; } = null;

        // Дата создания профиля 
        public DateTime? ProfileCreatedAt { get; set; } = null;

        // Текст ошибки
        public string? ProfileCreationError { get; set; } = null; 
    }
}
