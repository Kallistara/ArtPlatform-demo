using System.ComponentModel.DataAnnotations;

namespace IdentityService.Models.DTO
{
    /// <summary>
    /// DTO для входа
    /// </summary>
    public class LoginRequest
    {
        [Required]
        public string Username { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }
}
