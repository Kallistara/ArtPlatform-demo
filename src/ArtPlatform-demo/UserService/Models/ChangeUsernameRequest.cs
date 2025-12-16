using System.ComponentModel.DataAnnotations;

namespace UserService.Models
{
    /// <summary>
    /// DTO для изменения имени пользователя
    /// </summary>
    public class ChangeUsernameRequest
    {
        [Required(ErrorMessage = "Такое имя пользователя уже существует")]
        [MinLength(3, ErrorMessage = "Минимум 3 символа")]
        [MaxLength(50, ErrorMessage = "Максимум 50 символов")]
        [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Только буквы, цифры и подчеркивание")]
        public string NewUsername { get; set; } = string.Empty;
    }
}
