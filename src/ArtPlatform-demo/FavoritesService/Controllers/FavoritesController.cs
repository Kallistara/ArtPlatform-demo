using FavoritesService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace FavoritesService.Controllers
{
    /// <summary>
    /// API контроллер для управления картинами.
    /// Базовый маршрут: /api/favorites
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class FavoritesController : ControllerBase
    {
        // Dependency Injection бизнес-логики (сервиса)
        private readonly IFavoritesArtService _favoriteService;

        /// <summary>
        /// Конструктор с внедрением зависимости IFavoritesArtService.
        /// </summary>
        /// <param name="favoriteService">Сервис управления избранным</param>
        public FavoritesController (IFavoritesArtService favoriteService)
        {
            _favoriteService = favoriteService;
        }

        /// <summary>
        /// Получения списка избранного для текущего пользователя.
        /// GET /api/favorites/me
        /// Доступен авторизованным.
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMyFavorites()
        {
            var userId = GetCallerUserId();

            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { message = "User id not found in token" });

            var favorites = await _favoriteService.GetFavoritesAsync(userId);
            return Ok(favorites);
        }

        /// <summary>
        /// Добавление картины в избранное.
        /// GET /api/favorites/me/{artworkId}
        /// Доступен авторизованным.
        /// </summary>
        /// <param name="artworkId">Идентификатор картины для добавления</param>
        [HttpPost("me/{artworkId}")]
        [Authorize]
        public async Task<IActionResult> AddToFavorites (string artworkId)
        {
            var userId = GetCallerUserId();

            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { message = "User id not found in token" });

            if (string.IsNullOrWhiteSpace(artworkId))
                return BadRequest(new { message = "ArtworkId is required" });

            var favorite = await _favoriteService.AddToFavoritesAsync(userId, artworkId);

            if (favorite == null)
                return NotFound(new { message = "Artwork not found" });

            return Ok(new
            {
                message = "Artwork added to favorites",
                favorite
            });
        }

        /// <summary>
        /// Удаление картины из избранного.
        /// GET /api/favorites/me/{artworkId}
        /// Доступен авторизованным.
        /// </summary>
        /// <param name="artworkId">Идентификатор картины для удаления</param>
        [HttpDelete("me/{artworkId}")]
        [Authorize]
        public async Task<IActionResult> RemoveFromFavorites (string artworkId)
        {
            var userId = GetCallerUserId();

            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { message = "User id not found in token" });

            var removed = await _favoriteService.RemoveFromFavoritesAsync(userId, artworkId);

            if (!removed)
                return NotFound(new { message = "Favorite not found" });

            return NoContent();
        }

        /// <summary>
        /// Проверка находится ли картина в избранном.
        /// GET /api/favorites/me/{artworkId}/exists
        /// Доступен авторизованным.
        /// </summary>
        /// <param name="artworkId">Идентификатор картины для проверки</param>
        [HttpGet("me/{artworkId}/exists")]
        [Authorize]
        public async Task<IActionResult> IsFavorite(string artworkId)
        {
            var userId = GetCallerUserId();

            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { message = "User id not found in token" });

            var exists = await _favoriteService.IsFavoriteAsync(userId, artworkId);

            return Ok(new
            {
                artworkId,
                IsFavorite = exists
            });
        }

        /// <summary>
        /// Получение userId текущего пользователя (если доступен в токене), иначе null.
        /// </summary>
        /// <returns>Строка userId или null</returns>
        private string? GetCallerUserId()
        {
            return User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                ?? User.FindFirstValue("sub")
                ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        }
    }
}
