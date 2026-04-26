using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace ArtService.Models.Entities
{
    /// <summary>
    /// Основная модель объектов картина
    /// Хранится в коллекции "Artworks" в mongo
    /// </summary>
    public class Artwork
    {
        [BsonId]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // Id автора
        public string ArtistId { get; set; } = string.Empty;

        // Username логин автора
        public string ArtistName { get; set; } = string.Empty;

        // Название
        public string Title {  get; set; } = string.Empty;
            
        // Описание
        public string Description { get; set; } = string.Empty;

        // Категория
        public string Category { get; set; } = string.Empty;

        // Стиль
        public string Style { get; set; } = string.Empty;

        // Материаллы
        public string Material { get; set; } = string.Empty;

        // Цена
        public decimal Price { get; set; }

        // Количество
        public int Quantity { get; set; } 

        // Размеры картины
        public double Width { get; set;}
        public double Height { get; set;}

        // Ссылка на главное изображение
        public string MainImageUrl { get; set; } = string.Empty;

        // Ссылки на доп изображения
        public List<string> AdditionaImageUrls { get; set; } = new List<string>();

        // Дата создания
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Дата изменения
        public DateTime UpdatedAt { get; set;} = DateTime.UtcNow;

        // Флаг доступности
        [BsonIgnore]
        [JsonIgnore]
        public bool isAvailable => Quantity > 0;
    }
}
