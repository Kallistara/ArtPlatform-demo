using System.ComponentModel.DataAnnotations;

namespace UserService.Models.DTO
{
    /// <summary>
    /// DTO для создания нового профиля
    /// </summary>
    public class CreatedProfileRequest
    {
        // Внешний id пользователя, связывает микросервисы
        [Required(ErrorMessage = "UserId обязателен")]
        [StringLength(36, MinimumLength = 1)]
        public string UserId { get; set; } = string.Empty;

        // Уникальое имя пользователя (логин)
        [Required]
        [MinLength(3, ErrorMessage = "Минимум 3 символа")]
        [MaxLength(50, ErrorMessage = "Максимум 50 символов")]
        [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Только буквы, цифры и подчеркивание")]
        public string UserName { get; set; } = string.Empty;

        // Отображаемое имя (может отличаться от UserName)
        [Required]
        [MinLength(3, ErrorMessage = "Минимум 3 символа")]
        [MaxLength(50, ErrorMessage = "Максимум 50 символов")]
        [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Только буквы, цифры и подчеркивание")]
        public string DisplayName { get; set; } = string.Empty;

        // Описание профиля
        [MaxLength(500)]
        public string Bio { get; set; } = string.Empty;
    }
}
