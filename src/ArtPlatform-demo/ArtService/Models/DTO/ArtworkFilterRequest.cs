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
        public string? Category { get; set; } 

        // Стиль
        public string? Style { get; set; } 

        // Материалы
        public string? Material { get; set; } 

        // Минимальная и максимальная цена
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }

        // Минимальные и максимальные размеры
        public double? MinWidth { get; set; }
        public double? MaxWidth { get; set; }
        public double? MinHeight { get; set; }
        public double? MaxHeight { get; set; }

        // Флаг наличия
        public bool? isAvailable { get; set; }
    }
}
