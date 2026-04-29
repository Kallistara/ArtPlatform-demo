using MongoDB.Bson.Serialization.Attributes;

namespace FavoritesService.Models.Entities
{
    /// <summary>
    /// Модель для хренеия в БД данных об избранных картинах
    /// </summary>
    public class FavoriteItem
    {
        // Идентификатор записи избранного
        [BsonId]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // Идентификатор пользователя
        public string UserId { get; set; } = string.Empty;

        // Идентификатор картины
        public string ArtworkId { get; set; } = string.Empty;

        // Название картины
        public string ArtworkTitle { get; set; } = string.Empty;

        // Идентификатор художника
        public string ArtistId { get; set; } = string.Empty;

        // Имя художника (username)
        public string ArtistName { get; set; } = string.Empty;

        // Категория
        public string Category { get; set; } = string.Empty;

        // Цена
        public decimal Price {  get; set; } 

        // Ссылка на главное изображение
        public string MainImageUrl {  get; set; } = string.Empty;

        // Время добавления
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    }
}
