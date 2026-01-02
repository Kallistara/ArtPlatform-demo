using Amazon.Runtime.Internal;
using IdentityService.Models;
using IdentityService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;

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
        public async Task<IActionResult> Register([FromBody] Models.RegisterRequest request)
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
        /// POST /api/auth/login
        /// </summary>
        /// <param name="request">Учетные данные</param>
        /// <returns>JWT токен для доступа или ошибка</returns>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] Models.LoginRequest request)
        {
            var result = await _authService.LoginAsync(request);

            if (result == null)
                return Unauthorized(new { Error = "Неверный email или пароль" }); // 401

            return Ok(result); // 200
        }

        /// <summary>
        /// Сброс и смена пароля
        /// POST /api/auth/reset-password
        /// </summary>
        /// <param name="request">данные для смены пароля</param>
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] Models.LoginRequest request)
        {
            try
            {
                var result = await _authService.ResetPasswordAsync(request);

                if (result)
                    return Ok(new { Message = "Пароль успешно изменён" });

                return BadRequest(new { Error = "Не удалось изменить пароль" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
}
