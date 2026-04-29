namespace FavoritesService.Models.DTO
{
    /// <summary>
    /// DTO для получения полной информации о картине
    /// </summary>
    public class ArtworkDto
    {
        // Идентификатор записи избранного
        public string Id { get; set; } = string.Empty;

        // Идентификатор художника
        public string ArtistId { get; set; } = string.Empty;

        // Имя художника (username)
        public string ArtistName {  get; set; } = string.Empty; 

        // Название
        public string Title { get; set; } = string.Empty;

        // Категория
        public string Category {  get; set; } = string.Empty;

        // Цена
        public decimal Price { get; set; }

        // Главное изображение (URL)
        public string MainImageUrl {  get; set; } = string.Empty;
    }
}
