using MongoDB.Bson.Serialization.Attributes;

namespace CartService.Models.Entities
{
    /// <summary>
    /// Модель для хренения в БД данных о корзине
    /// </summary>
    public class CartItem
    {
        // Идентификтор записи о картине в корзине
        [BsonId]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // Идентификатор пользователя чья корзина
        public string UserId { get; set; } = string.Empty;

        // Идентификтор художника картины из корзины
        public string ArtistId { get; set; } = string.Empty;

        // Имя художника картины 
        public string ArtistName {  get; set; } = string.Empty;

        // Идентификатор картины из корзины
        public string ArtworkId { get; set; } = string.Empty;

        // Название картины
        public string ArtworkTitle { get; set; } = string.Empty;

        // Категория
        public string Category {  get; set; } = string.Empty;

        // Цена
        public decimal Price { get; set; } 

        // Ссылка на главное изображение
        public string MainImageUrl { get; set; } = string.Empty;

        // Дата добавления
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;

        // Количество одного и того же товара в корзине
        public int Quantity { get; set; } = 1;
    }
}
