using System.ComponentModel.DataAnnotations;

namespace ArtService.Models.DTO
{
    /// <summary>
    /// DTO для обновления картины
    /// </summary>
    public class UpdateArtworkRequest
    {
        // Название
        public string? Title { get; set; }

        // Описание
        public string? Description { get; set; }

        // Категория
        public string? Category { get; set; }

        // Стиль
        public string? Style { get; set; }

        // Материалы
        public string? Material { get; set; }

        // Цена
        public decimal? Price { get; set; }

        // Количество
        public int? Quantity { get; set; }

        // Размеры
        public double? Width { get; set; }
        public double? Height { get; set; }

        // Главное изображение
        public IFormFile? MainImage { get; set; }

        // Доп изображения
        public List<IFormFile>? AdditionalImages { get; set; }
    }
}
