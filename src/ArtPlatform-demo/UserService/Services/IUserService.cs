using UserService.Models.DTO;
using UserService.Models.Entities;

namespace UserService.Services
{
    /// <summary>
    /// Интерфейс бизнес-логики для работы с профилями пользователей
    /// </summary>
    public interface IUserService
    {
        // ====== CRUD-операции ======
        // Получить все профили
        Task<List<User>> GetAsync();

        // Получить профиль по UserId (может вернуть null)
        Task<User?> GetProfileAsync(string userId);

        // Создать новый профиль
        Task<User> CreateProfileAsync (CreatedProfileRequest request);

        // Обновить существующий профиль 
        Task<User?> UpdateProfileAsync (string userId, UpdatedProfileRequest request);

        // Удалить профиль
        Task<bool> DeleteProfileAsync (string userId);

        // ====== Поиск и валидация ======
        // Поиск профилей по текстовому запросу
        Task<IEnumerable<User>> SearchProfileAsync (string query);

        // Проверка существования username
        Task<bool> UsernameExistsAsync(string username);

        // ====== Статистика ======
        // Изменение данных контент-креатора
        Task<User?> UpdateCreatorStatsAsync(string userId, ContentCreatorStats stats);

        // Изменение данных пользователя
        Task<User?> UpdateUserStatsAsync(string userId, UserStats stats);

        // Изменение социальных данных 
        Task<User?> UpdateSocialStatsAsync(string userId, SocialStats stats);

        // ====== Обновление роли ======
        Task<User?> UpdateRoleAsync(string userId, UserRoleEnum role);
    }
}
