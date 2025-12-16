namespace UserService.Models
{
    /// <summary>
    /// Основная модель пользовательского профиля
    /// Хранится в коллекции "Profiles" в mongo
    /// </summary>
    public class User
    {
        // Внутренний уникальный id для mongo
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // Внешний id пользователя, связывает микросервисы
        public string UserId { get; set; } = string.Empty;

        // Имя пользователя
        public string UserName { get; set; } = string.Empty;

        // Отображаемое имя - ник (может отличаться от UserName)
        public string DisplayName {  get; set; } = string.Empty;

        // Описание профиля
        public string Bio {  get; set; } = string.Empty;

        // Ссылка на аватар
        public string AvatarUrl {  get; set; } = string.Empty;

        // Дата создания профиля (устанавливается один раз)
        public DateTime CreatedAT { get; set; } = DateTime.UtcNow;

        // Дата обновления профиля
        public DateTime UpdatedAT { get; set; } = DateTime.UtcNow;



        //// Количество подписчиков
        //public int FollowersCount { get; set; } = 0;

        //// Количество подписок
        //public int FollowingCount { get; set; } = 0;

        //// Флаг контент-креатора
        //public bool IsContentCreator { get; set; } = false;

        //// Статус верификации на роль контент-креатора
        //public string? CreatorVerificationStatus { get; set; } // "pending", "verified", "rejected"

    }
}
