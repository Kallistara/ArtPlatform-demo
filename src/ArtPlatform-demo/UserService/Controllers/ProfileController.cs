using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using UserService.Models;
using UserService.Services;

namespace UserService.Controllers
{
    /// <summary>
    /// API контроллер для управления профилями пользователей
    /// Базовый маршрут: /api/profile
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class ProfileController : ControllerBase
    {
        // Dependency Injection бизнес-логики (сервиса)
        private readonly IUserService _userService;

        public ProfileController(IUserService userService)
        {
            _userService = userService;
        }

        /// <summary>
        /// Получение всех профилей
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Authorize]
        public async Task<List<User>> Get() => await _userService.GetAsync();

        /// <summary>
        /// Получение профиля по UserId
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
        /// Обновление существующего профиля
        /// PUT /api/profile/{userId}
        /// </summary>
        [HttpPut("{userId}")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile(string userId, [FromBody] UpdatedProfileRequest request)
        {
            // Проверка: хотя бы одно поле должно быть передано для обновления
            if (request.DisplayName == null && request.Bio == null && request.Contact == null)
            {
                return BadRequest(new
                {
                    message = "At least one field (DisplayName, Bio, or AvatarUrl) must be provided"
                });
            }

            var profile = await _userService.UpdateProfileAsync(userId, request);

            if (profile == null)
                return NotFound(new { message = "Profile not found" }); // 404

            return Ok(new
            {
                profile = profile,
                message = profile.UpdatedAT > DateTime.UtcNow.AddSeconds(-1)
                ? "Profile updated successfully"
                : "No changes detected"
            });
        }

        /// <summary>
        /// Удаление профиля
        /// DELETE /api/profile/{userId}
        /// </summary>
        [HttpDelete("{userId}")]
        [Authorize]
        public async Task<IActionResult> DeleteProfile(string userId)
        {
            var deleted = await _userService.DeleteProfileAsync(userId);

            if (!deleted)
                return NotFound(new { message = "Profile not found" }); // 404

            return NoContent(); // 204
        }

        /// <summary>
        /// Поиск профилей по текстовому запросу
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
        /// Проверка доступности username
        /// </summary>
        /// <param name="username">для котрого проверяется доступность</param>
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
        /// Получение профиля по username
        /// </summary>
        /// <param name="username">для которого необходимо найти профиль</param>
        [HttpGet("by-username/{username}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetProfileByUsername(string username)
        {
            if (string.IsNullOrWhiteSpace(username))
                return BadRequest(new { message = "Username is required" }); // 400

            var profile = await _userService.GetProfileByUsernameAsync(username);

            if (profile == null)
                return NotFound(new { message = "Profile not found" }); // 404

            return Ok(profile);
        }

        /// <summary>
        /// Изменение  username пользователя, с проверкой доступности
        /// PATCH /api/profile/{userId}/username
        /// </summary>
        /// <param name="userId">id пользователя, для которого будет изменено имя</param>
        /// <param name="request">dto для изменения имени</param>
        [HttpPatch("{userId}/username")]
        [Authorize]
        public async Task<IActionResult> ChangeUsername(string userId, [FromBody] ChangeUsernameRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _userService.ChangeUsernameAsync(userId, request.NewUsername);

            if (result.Success)
            {
                return Ok(new
                {
                    profile = result.User,
                    message = result.Message
                });
            }
            else
            {
                return result.ErrorType switch
                {
                    "NOT_FOUND" => NotFound(new { message = result.Error }),
                    "USERNAME_TAKEN" => Conflict(new { message = result.Error }),
                    _ => BadRequest(new { message = result.Error })
                };
            }
        }

        /// <summary>
        /// Обновление статистики контент-креатора
        /// PATCH /api/profile/{userId}/creator-stats
        /// </summary>
        [HttpPatch("{userId}/creator-stats")]
        [Authorize]
        public async Task<IActionResult> UpdateCreatorStats(string userId, [FromBody] ContentCreatorStats stats)
        {
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
        /// Обновление статистики пользователя (заказчика)
        /// PATCH /api/profile/{userId}/user-stats
        /// </summary>
        [HttpPatch("{userId}/user-stats")]
        [Authorize]
        public async Task<IActionResult> UpdateUserStats(string userId, [FromBody] UserStats stats)
        {
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
        /// Обновление социальной статистики
        /// PATCH /api/profile/{userId}/social-stats
        /// </summary>
        [HttpPatch("{userId}/social-stats")]
        [Authorize]
        public async Task<IActionResult> UpdateSocialStats(string userId, [FromBody] SocialStats stats)
        {
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
        /// Назначение пользователя контент-креатором
        /// POST /api/profile/{userId}/make-creator
        /// </summary>
        [HttpPost("{userId}/make-creator")]
        [Authorize]
        public async Task<IActionResult> MakeUserCreator(string userId)
        {
            var profile = await _userService.SetUserAsCreatorAsync(userId);
            if (profile == null)
                return NotFound(new { message = "Profile not found" });

            return Ok(new
            {
                profile = profile,
                message = "User is now a content creator"
            });
        }


        /// <summary>
        /// Получение userId из заголовка
        /// </summary>
        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile([FromHeader(Name = "X-User-Id")] string userId)
        {
            var profile = await _userService.GetProfileAsync(userId);
            return Ok(profile);
        }
    }
}
