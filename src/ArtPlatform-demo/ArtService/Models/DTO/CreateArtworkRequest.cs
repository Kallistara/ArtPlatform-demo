using System.ComponentModel.DataAnnotations;

namespace ArtService.Models.DTO
{
    /// <summary>
    /// DTO для создания новой картины
    /// </summary>
    public class CreateArtworkRequest
    {
        // Название
        [Required]
        public string Title { get; set; } = string.Empty;

        // Описание
        [Required]
        public string Description { get; set; } = string.Empty;

        // Категория
        [Required]
        public string Category { get; set; } = string.Empty;

        // Стиль
        [Required]
        public string Style { get; set; } = string.Empty;

        // Материалы
        [Required]
        public string Material { get; set; } = string.Empty;

        // Цена
        public decimal Price { get; set; }

        // Количество
        public int Quantity { get; set; }

        // Размеры
        public double Width { get; set; }
        public double Height { get; set; }

        // Главное изображение
        [Required]
        public IFormFile? MainImage { get; set; }

        // Доп изображения
        public List<IFormFile>? AdditionalImages { get; set; }
    }
}
