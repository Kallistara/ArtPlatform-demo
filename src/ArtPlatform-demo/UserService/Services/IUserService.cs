using UserService.Models;

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

        // Получить профиль по username
        Task<User?> GetProfileByUsernameAsync(string username);

        // Проверка существования username
        Task<bool> UsernameExistsAsync(string username);

        // ====== Изменение имени username ======
        Task<ChangeUsernameResult> ChangeUsernameAsync(string userId, string newUsername);


        // ====== Статистика ======
        // Изменение данных контент-креатора
        Task<User?> UpdateCreatorStatsAsync(string userId, ContentCreatorStats stats);

        // Изменение данных пользователя
        Task<User?> UpdateUserStatsAsync(string userId, UserStats stats);

        // Изменение социальных данных 
        Task<User?> UpdateSocialStatsAsync(string userId, SocialStats stats);

        // ====== Получение роли креатора ======
        Task<User?> SetUserAsCreatorAsync(string userId);
    }
}
