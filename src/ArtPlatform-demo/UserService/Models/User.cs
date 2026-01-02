using MongoDB.Bson.Serialization.Attributes;

namespace UserService.Models
{
    /// <summary>
    /// Основная модель пользовательского профиля со статистикой 
    /// Хранится в коллекции "Profiles" в mongo
    /// </summary>
    public class User
    {
        // Внутренний уникальный id для mongo
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // Внешний id пользователя, связывает микросервисы
        public string UserId { get; set; } = string.Empty;

        // Уникальное ммя пользователя (логин)
        public string UserName { get; set; } = string.Empty;

        // Отображаемое имя - ник (может отличаться от UserName)
        public string DisplayName {  get; set; } = string.Empty;

        // Описание профиля
        public string Bio {  get; set; } = string.Empty;

        // Контактная информация
        public ContactInfo Contact { get; set; } = new ContactInfo();

        // Дата создания профиля
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Дата обновления профиля
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Роль пользователя 
        [BsonRepresentation(MongoDB.Bson.BsonType.String)]
        public UserRole Role { get; set; } = UserRole.Unauthorized;

        // Статистика для Контент-креатора
        public ContentCreatorStats? CreatorStats { get; set; }

        // Статистика для авторизованного пользователя (заказчика)
        public UserStats UserStats { get; set; } = new UserStats();

        // Социальная статистика
        public SocialStats SocialStats { get; set; } = new SocialStats(); 
    }
}
