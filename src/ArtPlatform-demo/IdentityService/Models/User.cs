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

        public string UserId { get; set; } = string.Empty; // Внешний ID

        public string Username { get; set; } = string.Empty; // имя пользователя
        public string PasswordHash { get; set; } = string.Empty; // пароль
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // дата регистрации
    }
}
