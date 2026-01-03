using System.ComponentModel.DataAnnotations;

namespace IdentityService.Models.DTO
{
    /// <summary>
    /// DTO для регистрации с валидацией
    /// </summary>
    public class RegisterRequest
    {
        [Required]
        [MinLength(3, ErrorMessage = "Имя пользователя должно содержать минимум 3 символа")]
        [MaxLength(30, ErrorMessage = "Имя пользователя не должно превышать 30 символов")]
        [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Только буквы, цифры и подчеркивание")]
        public string Username { get; set; } = string.Empty;

        [Required]
        [MinLength(6, ErrorMessage = "Пароль должен содержать минимум 6 символов")]
        public string Password { get; set; } = string.Empty;

        [Required]  
        [Compare("Password", ErrorMessage = "Пароли не совпадают")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
