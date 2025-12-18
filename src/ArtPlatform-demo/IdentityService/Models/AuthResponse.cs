namespace IdentityService.Models
{
    public class AuthResponse
    {
        /// <summary>
        /// DTO ответа с токеном
        /// </summary>
        public string UserId { get; set; } = string.Empty;
        public string AccessToken { get; set; } = string.Empty;
        public string TokenType { get; set; } = "Bearer";
    }
}
