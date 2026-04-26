using ArtService.Models.DTO;
using ArtService.Models.Entities;
using System.Globalization;

namespace ArtService.Services
{
    /// <summary>
    /// Интерфейс бизнес-логики для работы с картинами
    /// </summary>
    public interface IArtworkService
    {
        // Получить все картины 
        Task<List<Artwork>> GetAsync();

        // Получить картину по идентоификатору
        Task<Artwork?> GetByIdAsync(string artworkId);

        // Получить все картины художника
        Task<List<Artwork>> GetByArtistIdAsync (string artistId);

        // Получить похожие картины
        Task<List<Artwork>> GetSimilarAsync(string artworkId, int limit = 6);

        // Найти картины по запросу
        Task<List<Artwork>> SearchAsync (string query);

        // Отфильтровать картины
        Task<List<Artwork>> FilterAsync(ArtworkFilterRequest request);

        // Создать новую картину
        Task<Artwork> CreateAsync (string artistId, string artistName, CreateArtworkRequest request);

        // Обновить существующую картину
        Task<Artwork?> UpdateAsync(string artworkId, string callerUserId, bool isAdmin, UpdateArtworkRequest request);

        // Удалить картину по идентификатору
        Task<bool> DeleteAsync(string artworkId, string callerUserId, bool isAdmin);

        // Удалить все картины художника
        Task<int> DeleteByArtistIdAsync(string artistId);
    }
}
