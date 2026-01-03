namespace IdentityService.Models.DTO
{
    /// <summary>
    /// DTO для смнены пароля.
    /// </summary>
    public class ChangePasswordRequest
    {
        // Текущий пароль
        public string CurrentPassword { get; set; } = string.Empty;

        // Новый пароль
        public string NewPassword { get; set; } = string.Empty;
    }
}
