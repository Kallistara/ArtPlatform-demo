using IdentityService.Models;

namespace IdentityService.Services
{
    /// <summary>
    /// Интерфейс бизнес-логики для работы с авторизацией
    /// </summary>
    public interface IAuthService
    {
        Task<string> RegisterAsync(RegisterRequest request); // регистрация
        Task<AuthResponse?> LoginAsync(LoginRequest request); // аутенфикация
        Task<UserInfoResponse?> GetUserByIdAsync(string userId); // получение информации и пользователе
        Task<bool> ResetPasswordAsync(Models.LoginRequest request); // сброс пароля
    }
}
