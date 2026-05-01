using CartService.Models.Entities;

namespace CartService.Services
{
    /// <summary>
    /// Интерфейс бизнес-логики для работы с картинами в корзине
    /// </summary>
    public interface IArtCartService
    {
        // Получение всей корзины пользователя.
        Task<List<CartItem>> GetCartAsync(string userId);

        // Добавление в корзину пользователя картины.
        Task<CartItem?> AddToCartAsync(string userId, string artworkId);

        // Удаление одной картины из корзины пользователя.
        Task<bool> RemoveOneFromCartAsync (string userId, string artworkId);

        // Удаление всех экземпляров одной картины из корзины пользователя.
        Task<bool> RemoveAllFromCartAsync(string userId, string artworkId);

        // Проверка на наличие картины в корзине.
        Task<bool> IsInCartAsync(string userId, string artworkId);

        // Удаление всего содержимого корзины.
        Task<int> ClearCartAsync (string userId);

        // Удаление всех записей о картине из корзин.
        Task<int> RemoveByArtworkIdAsync(string artworkId);
    }
}
