using FavoritesService.Models.Entities;

namespace FavoritesService.Services
{
    /// <summary>
    /// Интерфейс бизнес-логики для работы с избранными картинами
    /// </summary>
    public interface IFavoritesArtService
    {
        // Получение всего избранного
        Task<List<FavoriteItem>> GetFavoritesAsync(string userId);

        // Добавление в избранное
        Task<FavoriteItem?> AddToFavoritesAsync (string userId, string artworkId);

        // Удаление из избранного
        Task<bool> RemoveFromFavoritesAsync (string userId, string artworkId);

        // Проверка - избранное ли?
        Task<bool> IsFavoriteAsync(string userId, string artworkId);

        // Удаление всех записей с заданной картиной
        Task<int> RemoveByArtworkIdAsync(string artworkId);

        // Удаление всех записей заданного пользователя
        Task<int> RemoveByUserIdAsync(string userId);
    }
}
