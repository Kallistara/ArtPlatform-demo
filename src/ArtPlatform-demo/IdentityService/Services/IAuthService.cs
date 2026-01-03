using IdentityService.Models.DTO;

namespace IdentityService.Services
{
    /// <summary>
    /// Интерфейс бизнес-логики для работы с авторизацией
    /// </summary>
    public interface IAuthService
    {
        // Регистрация
        Task<string> RegisterAsync(RegisterRequest request); 

        // Аутенфикация
        Task<AuthResponse?> LoginAsync(LoginRequest request); 

        // Смена пароля
        Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword);
    }
}
