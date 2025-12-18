using Microsoft.IdentityModel.Tokens;
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
        public string GenerateToken(string userId, string username)
        {
            var claims = new[]
            {
                new Claim("sub", userId),
                new Claim("username", username)
            };

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

        /// <summary>
        /// Извлечение userId из JWT токена без валидации
        /// </summary>
        /// <param name="token">токен</param>
        /// <returns>идентификатор или null</returns>
        public string? GetUserIdFromToken(string token)
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwt = handler.ReadJwtToken(token);
                return jwt.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
            }
            catch
            {
                return null;
            }
        }

        /// <summary>
        /// Полная валидация JWT токена
        /// Проверяет подпись, срок действия, издателя и аудиторию
        /// </summary>
        /// <param name="token">токен</param>
        /// <returns>true если токен валиден</returns>
        public bool ValidateToken(string token)
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var parameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = _configuration["Jwt:Issuer"],
                    ValidAudience = _configuration["Jwt:Audience"],
                    IssuerSigningKey = _key,
                    ClockSkew = TimeSpan.Zero
                };

                handler.ValidateToken(token, parameters, out _);
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}
