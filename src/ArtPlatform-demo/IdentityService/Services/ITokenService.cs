namespace IdentityService.Services
{
    /// <summary>
    /// Интерфейс бизнес-логики для работы с токенами
    /// </summary>
    public interface ITokenService
    {
        string GenerateToken(string userId, string email, string? role = null); // формирование токена
        string? GetUserIdFromToken(string token); // получение id пользователя по токену
        bool ValidateToken(string token); // проверка токена
    }
}
