namespace IdentityService.Models
{
    /// <summary>
    /// Ответ с информацией о пользователе
    /// </summary>
    public class UserInfoResponse
    {
        public string UserId { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
