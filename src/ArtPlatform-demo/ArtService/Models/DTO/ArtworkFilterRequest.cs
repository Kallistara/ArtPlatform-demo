using System.ComponentModel.DataAnnotations;

namespace ArtService.Models.DTO
{
    /// <summary>
    /// DTO для задания фильтров для поиска
    /// </summary>
    public class ArtworkFilterRequest
    {
        // Username логин автора
        public string? ArtistName { get; set; }

        // Категория
        [MaxLength(100, ErrorMessage = "Максимум 100 символов")]
        public string? Category { get; set; }

        // Стиль
        [MaxLength(100, ErrorMessage = "Максимум 100 символов")]
        public string? Style { get; set; }

        // Материалы
        [MaxLength(100, ErrorMessage = "Максимум 100 символов")]
        public string? Material { get; set; }

        // Минимальная и максимальная цена
        [Range(0, double.MaxValue)]
        public decimal? MinPrice { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? MaxPrice { get; set; }

        // Минимальные и максимальные размеры
        [Range(1, double.MaxValue)]
        public double? MinWidth { get; set; }

        [Range(1, double.MaxValue)]
        public double? MaxWidth { get; set; }

        [Range(1, double.MaxValue)]
        public double? MinHeight { get; set; }

        [Range(1, double.MaxValue)]
        public double? MaxHeight { get; set; }

        // Флаг наличия
        public bool? isAvailable { get; set; }
    }
}
