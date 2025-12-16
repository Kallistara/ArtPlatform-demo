namespace UserService.Models
{
    /// <summary>
    /// Основная модель пользовательского профиля со статистикой 
    /// Хранится в коллекции "Profiles" в mongo
    /// </summary>
    public class User
    {
        public string Id { get; set; } = Guid.NewGuid().ToString(); // Внутренний уникальный id для mongo
        
        public string UserId { get; set; } = string.Empty; // Внешний id пользователя, связывает микросервисы
        
        public string UserName { get; set; } = string.Empty; // Уникальное ммя пользователя (логин)
        
        public string DisplayName {  get; set; } = string.Empty; // Отображаемое имя - ник (может отличаться от UserName)
        
        public string Bio {  get; set; } = string.Empty; // Описание профиля
        
        public ContactInfo Contact { get; set; } = new ContactInfo(); // Контактная информация
        
        public DateTime CreatedAT { get; set; } = DateTime.UtcNow; // Дата создания профиля
        
        public DateTime UpdatedAT { get; set; } = DateTime.UtcNow; // Дата обновления профиля
        
        public ContentCreatorStats? CreatorStats { get; set; } // Статистика для Контент-креатора
        
        public UserStats UserStats { get; set; } = new UserStats(); // Статистика для авторизованного пользователя (заказчика)
        
        public SocialStats SocialStats { get; set; } = new SocialStats(); // Социальная статистика
    }
}
