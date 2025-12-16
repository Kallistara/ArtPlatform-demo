using System.ComponentModel.DataAnnotations;

namespace UserService.Models
{
    /// <summary>
    /// DTO для обновления профиля
    /// </summary>
    public class UpdatedProfileRequest
    {
        // Отображаемое имя - ник (может отличаться от UserName)
        [Required]
        [MinLength(3, ErrorMessage = "Минимум 3 символа")]
        [MaxLength(50, ErrorMessage = "Максимум 50 символов")]
        [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Только буквы, цифры и подчеркивание")]
        public string? DisplayName { get; set; } = string.Empty;

        // Описание профиля
        [MaxLength(500)]
        public string? Bio { get; set; } = string.Empty;

        // Ссылка на аватар
        [Url(ErrorMessage = "Некорректный URL")]
        public string? AvatarUrl { get; set; } = string.Empty;
    }
}
