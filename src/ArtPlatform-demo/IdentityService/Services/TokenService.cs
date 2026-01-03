using Microsoft.IdentityModel.Tokens;
using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace IdentityService.Services
{
    /// <summary>
    /// Сервис для работы с JWT токенами
    /// </summary>
    public class TokenService:ITokenService
    {
        private readonly IConfiguration _configuration;
        private readonly SymmetricSecurityKey _key;

        /// <summary>
        /// Конструктор с внедрением зависимостей
        /// </summary>
        /// <param name="configuration">Конфигурация приложения</param>
        /// <param name="key">ключ</param>
        public TokenService(IConfiguration configuration, SymmetricSecurityKey key)
        {
            _configuration = configuration;
            _key = key; 
        }

        /// <summary>
        /// Генерация JWT токена для пользователя.
        /// Токен содержит claims и подписывается симметричным ключом.
        /// </summary>
        /// <param name="userId">Идентификатор пользователя</param>
        /// <param name="username">Имя пользователя</param>
        /// <returns>Строка с JWT токеном</returns>
        public string GenerateToken(string userId, string username, string? role = null)
        {
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, userId),
                new Claim("username", username),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            if (!string.IsNullOrWhiteSpace(role))
            { 
              claims.Add(new Claim(ClaimTypes.Role, role)); 
            }

            var credentials = new SigningCredentials(_key, SecurityAlgorithms.HmacSha256);

            // Создание JWT токена
            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(2),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
