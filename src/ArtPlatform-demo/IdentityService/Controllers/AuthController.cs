using Amazon.Runtime.Internal;
using IdentityService.Models.DTO;
using IdentityService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace IdentityService.Controllers
{
    /// <summary>
    /// Контроллер аутентификации и авторизации.
    /// Базовый маршрут: /api/auth
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        /// <summary>
        /// Конструктор с внедрением зависимости IAuthService
        /// </summary>
        /// <param name="authService"> Сервис аутентификации</param>
        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        /// <summary>
        /// Регистрация нового пользователя.
        /// POST /api/auth/register
        /// </summary>
        /// <param name="request">Данные для регистрации</param>
        /// <returns>UserId нового пользователя или ошибку</returns>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] Models.DTO.RegisterRequest request)
        {
            try
            {
                var userId = await _authService.RegisterAsync(request);
                return Ok(new { UserId = userId, Message = "Регистрация успешна" }); // 200
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message }); // 400
            }
        }

        /// <summary>
        /// Вход существующего пользователя.
        /// POST /api/auth/login
        /// </summary>
        /// <param name="request">Учетные данные</param>
        /// <returns>JWT токен для доступа или ошибка</returns>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] Models.DTO.LoginRequest request)
        {
            var result = await _authService.LoginAsync(request);

            if (result == null)
                return Unauthorized(new { Error = "Неверный логин или пароль" }); // 401

            return Ok(result); // 200
        }

        /// <summary>
        /// Смена пароля, доступна после авторизации.
        /// POST /api/auth/change-password
        /// </summary>
        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.CurrentPassword) || string.IsNullOrWhiteSpace(req.NewPassword))
                return BadRequest(new { Error = "CurrentPassword and NewPassword are required" });

            // Читаем sub для получения userid
            var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue("sub")
                ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { Error = "User not found in token" });

            try
            {
                var ok = await _authService.ChangePasswordAsync(userId, req.CurrentPassword, req.NewPassword);
                if (ok) return Ok(new { Message = "Password changed" });
                return BadRequest(new { Error = "Password not changed" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
}
