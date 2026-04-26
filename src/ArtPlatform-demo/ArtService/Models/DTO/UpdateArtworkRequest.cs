using System.ComponentModel.DataAnnotations;

namespace ArtService.Models.DTO
{
    /// <summary>
    /// DTO для обновления картины
    /// </summary>
    public class UpdateArtworkRequest
    {
        // Название
        [MinLength(3, ErrorMessage = "Минимум 3 символа")]
        [MaxLength(50, ErrorMessage = "Максимум 50 символов")]
        [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Только буквы, цифры и подчеркивание")]
        public string? Title { get; set; }

        // Описание
        [MaxLength(500, ErrorMessage = "Максимум 500 символов")]
        public string? Description { get; set; }

        // Категория
        [MaxLength(100, ErrorMessage = "Максимум 100 символов")]
        public string? Category { get; set; }

        // Стиль
        [MaxLength(100, ErrorMessage = "Максимум 100 символов")]
        public string? Style { get; set; }

        // Материалы
        [MaxLength(100, ErrorMessage = "Максимум 100 символов")]
        public string? Material { get; set; }

        // Цена
        [Range(0, double.MaxValue)]
        public decimal? Price { get; set; }

        // Количество
        [Range(0, double.MaxValue)]
        public int? Quantity { get; set; }

        // Размеры
        [Range(1, double.MaxValue)]
        public double? Width { get; set; }

        [Range(1, double.MaxValue)]
        public double? Height { get; set; }

        // Главное изображение
        public IFormFile? MainImage { get; set; }

        // Доп изображения
        public List<IFormFile>? AdditionalImages { get; set; }
    }
}
