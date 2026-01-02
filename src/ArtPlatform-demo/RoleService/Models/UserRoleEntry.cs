using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace RoleService.Models
{
    /// <summary>
    /// Класс - роли пользователей в системе
    /// </summary>
    public class UserRoleEntry
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        // Внешний UserId 
        public string UserId { get; set; } = string.Empty;

        // Текущая роль
        [BsonRepresentation(BsonType.String)]
        public UserRole Role { get; set; } = UserRole.Unauthorized;

        // Кем назначено (UserId администратора)
        public string? AssignedBy { get; set; }

        // Время обновления роли
        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    }
}
