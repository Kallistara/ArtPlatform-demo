using System.ComponentModel.DataAnnotations;
using UserService.Models.Entities;

namespace UserService.Models.DTO
{
    /// <summary>
    /// DTO для обновления профиля
    /// </summary>
    public class UpdatedProfileRequest
    {
        // Отображаемое имя (может отличаться от UserName)
        [MinLength(3, ErrorMessage = "Минимум 3 символа")]
        [MaxLength(50, ErrorMessage = "Максимум 50 символов")]
        [RegularExpression(@"^[a-zA-Z0-9_]+$", ErrorMessage = "Только буквы, цифры и подчеркивание")]
        public string? DisplayName { get; set; } = string.Empty;

        // Описание профиля
        [MaxLength(500)]
        public string? Bio { get; set; } = string.Empty;

        // Контактная информация
        public ContactInfo? Contact { get; set; }
    }
}
