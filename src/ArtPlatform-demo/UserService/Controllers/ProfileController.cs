using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using UserService.Models.DTO;
using UserService.Models.Entities;
using UserService.Services;

namespace UserService.Controllers
{
    /// <summary>
    /// API контроллер для управления профилями пользователей.
    /// Базовый маршрут: /api/profile
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class ProfileController : ControllerBase
    {
        // Dependency Injection бизнес-логики (сервиса)
        private readonly IUserService _userService;

        /// <summary>
        /// Конструктор с внедрением зависимости IUserService.
        /// </summary>
        /// <param name="userService">Сервис управления профилями</param>
        public ProfileController(IUserService userService)
        {
            _userService = userService;
        }

        /// <summary>
        /// Получение списка всех профилей.
        /// GET /api/profile
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<List<User>> Get() => await _userService.GetAsync();

        /// <summary>
        /// Получение профиля по UserId.
        /// GET /api/profile/{userId}
        /// </summary>
        [HttpGet("{userId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProfile(string userId)
        {
            var profile = await _userService.GetProfileAsync(userId);

            if (profile == null)
            {
                return NotFound(new { message = "Profile not found" }); // 404
            }
            return Ok(profile); // 200
        }

        /// <summary>
        /// Обновление существующего профиля.
        /// PUT /api/profile/me
        /// </summary>
        [HttpPut("me")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdatedProfileRequest request)
        {
            var userId = GetCallerUserId();

            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { message = "User id not found in token" });

            // Хотя бы одно поле должно быть не null
            if (request.DisplayName == null && request.Bio == null && request.Contact == null)
            {
                return BadRequest(new { message = "At least one field (DisplayName, Bio, or Contact) must be provided" });
            }

            var profile = await _userService.UpdateProfileAsync(userId, request);

            if (profile == null)
                return NotFound(new { message = "Profile not found" }); // 404

            return Ok(new
            {
                profile = profile,
                message = profile.UpdatedAt > DateTime.UtcNow.AddSeconds(-1)
                    ? "Profile updated successfully"
                    : "No changes detected"
            });
        }

        /// <summary>
        /// Удаление профиля.
        /// DELETE /api/profile/me
        /// </summary>
        [HttpDelete("me")]
        [Authorize]
        public async Task<IActionResult> DeleteProfile()
        {
            var userId = GetCallerUserId();

            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { message = "User id not found in token" });

            var deleted = await _userService.DeleteProfileAsync(userId);

            if (!deleted)
                return NotFound(new { message = "Profile not found" }); // 404

            return NoContent(); // 204
        }

        /// <summary>
        /// Поиск профилей по текстовому запросу.
        /// GET /api/profile/search?query=...
        /// </summary>
        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<IActionResult> SearchProfiles([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return BadRequest(new { message = "Search query is required" }); // 400

            var profiles = await _userService.SearchProfileAsync(query);
            return Ok(profiles); // 200
        }

        /// <summary>
        /// Проверка доступности username.
        /// GET /api/profile/check-username/{username}
        /// </summary>
        [HttpGet("check-username/{username}")]
        [AllowAnonymous]
        public async Task<IActionResult> CheckUsernameAvailability(string username)
        {
            if (string.IsNullOrWhiteSpace(username) || username.Length < 3)
                return BadRequest(new { message = "Username must be at least 3 characters" }); // 400

            var exists = await _userService.UsernameExistsAsync(username);

            return Ok(new
            {
                username = username,
                available = !exists,
                message = exists ? "Username already taken" : "Username available"
            });
        }

        /// <summary>
        /// Обновление статистики контент-креатора.
        /// PATCH /api/profile/me/creator-stats
        /// </summary>
        [HttpPatch("me/creator-stats")]
        [Authorize(Roles = "ContentCreator")]
        public async Task<IActionResult> UpdateCreatorStats([FromBody] ContentCreatorStats stats)
        {
            var userId = GetCallerUserId();

            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { message = "User id not found in token" });

            var profile = await _userService.UpdateCreatorStatsAsync(userId, stats);

            if (profile == null)
                return NotFound(new { message = "Profile not found" });

            return Ok(new
            {
                profile = profile,
                message = "Creator stats updated"
            });
        }

        /// <summary>
        /// Обновление статистики пользователя (заказчика).
        /// PATCH /api/profile/me/user-stats
        /// </summary>
        [HttpPatch("me/user-stats")]
        [Authorize]
        public async Task<IActionResult> UpdateUserStats([FromBody] UserStats stats)
        {
            var userId = GetCallerUserId();

            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { message = "User id not found in token" });

            var profile = await _userService.UpdateUserStatsAsync(userId, stats);

            if (profile == null)
                return NotFound(new { message = "Profile not found" });

            return Ok(new
            {
                profile = profile,
                message = "User stats updated"
            });
        }

        /// <summary>
        /// Обновление социальной статистики.
        /// PATCH /api/profile/me/social-stats
        /// </summary>
        [HttpPatch("me/social-stats")]
        [Authorize]
        public async Task<IActionResult> UpdateSocialStats([FromBody] SocialStats stats)
        {
            var userId = GetCallerUserId();

            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { message = "User id not found in token" });

            var profile = await _userService.UpdateSocialStatsAsync(userId, stats);

            if (profile == null)
                return NotFound(new { message = "Profile not found" });

            return Ok(new
            {
                profile = profile,
                message = "Social stats updated"
            });
        }

        /// <summary>
        /// Получение userId из токена.
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMyProfile()
        {
            // Берем userid из claim токена
            var userId = GetCallerUserId();
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { message = "User id not found in token" });

            var profile = await _userService.GetProfileAsync(userId);
            if (profile == null) return NotFound(new { message = "Profile not found" });
            return Ok(profile);
        }

        /// <summary>
        /// Получение userId текущего пользователя (если доступен в токене), иначе null.
        /// </summary>
        private string? GetCallerUserId()
        {
            return User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                ?? User.FindFirstValue("sub")
                ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        }
    }
}
