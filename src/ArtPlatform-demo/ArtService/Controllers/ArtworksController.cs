using ArtService.Models.DTO;
using ArtService.Models.Entities;
using ArtService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualBasic;
using MongoDB.Driver.Core.Authentication;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace ArtService.Controllers
{
    /// <summary>
    /// API контроллер для управления картинами.
    /// Базовый маршрут: /api/artworks
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class ArtworksController : ControllerBase
    {
        // Dependency Injection бизнес-логики (сервиса)
        private readonly IArtworkService _artworkService;

        /// <summary>
        /// Конструктор с внедрением зависимости IArtworkService.
        /// </summary>
        /// <param name="artworkService">Сервис управления картинами</param>
        public ArtworksController(IArtworkService artworkService)
        {
            _artworkService = artworkService;
        }

        /// <summary>
        /// Получение списка всех картин.
        /// GET /api/artworks
        /// Доступен всем
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        public async Task<List<Artwork>> Get() => await _artworkService.GetAsync();

        /// <summary>
        /// Получение картины по идентификатору.
        /// GET /api/artworks/{id}
        /// Доступен всем.
        /// </summary>
        /// <param name="artworkId">Идентификатор картины</param>
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById ([FromRoute(Name = "id")] string artworkId)
        {
            var artwork = await _artworkService.GetByIdAsync(artworkId);

            if (artwork == null)
                return NotFound(new { message = "Artwork not found " }); //404

            return Ok(artwork);
        }

        /// <summary>
        /// Получение списка картин художника.
        /// GET /api/artworks/artist/{artistId}
        /// Доступен всем.
        /// </summary>
        /// <param name="artistId">Идентификатор художника</param>
        [HttpGet("artist/{artistId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetByArtistId (string artistId)
        {
            var artworks = await _artworkService.GetByArtistIdAsync(artistId);
            return Ok(artworks);
        }

        /// <summary>
        /// Получение списка похожих картин.
        /// GET /api/artworks/{id}/similar
        /// Доступен всем.
        /// </summary>
        /// <param name="artworkId">Идентификатор картины</param>
        /// <param name="limit">Ограничение размера возвращаемого списка картин</param>
        [HttpGet("{id}/similar")]
        [AllowAnonymous]
        public async Task<IActionResult> GetSimmilar ([FromRoute(Name = "id")] string artworkId, [FromQuery] int limit = 6)
        {
            var artworks = await _artworkService.GetSimilarAsync(artworkId, limit);
            return Ok(artworks);
        }

        /// <summary>
        /// Получение списка картин, подходящих под строку запроса (Поиск).
        /// GET /api/artworks/search
        /// Доступен всем.
        /// </summary>
        /// <param name="query">Строка поискового запроса</param>
        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<IActionResult> Search ([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return BadRequest(new { message = "Search query is required" }); //400

            var artworks = await _artworkService.SearchAsync(query);
            return Ok(artworks);
        }

        /// <summary>
        /// Получение списка картин, подходящихих под заданные фильтры
        /// GET /api/artworks/filter
        /// Доступен всем.
        /// </summary>
        /// <param name="request">DTO для установления заданных фильтров</param>
        [HttpGet("filter")]
        [AllowAnonymous]
        public async Task<IActionResult> Filter([FromQuery] ArtworkFilterRequest request)
        {
            var artworks = await _artworkService.FilterAsync(request);
            return Ok(artworks);
        }

        /// <summary>
        /// Создание новой картины.
        /// POST /api/artworks
        /// Доступен только художникам.
        /// </summary>
        /// <param name="request">DTO для создания картины</param>
        [HttpPost]
        [Authorize(Roles = "Artist")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Create([FromForm] CreateArtworkRequest request)
        {
            var artistId = GetCallerUserId();
            var artistName = GetCallerUsername();

            if (string.IsNullOrWhiteSpace(artistId))
                return Unauthorized(new { message = "User id not found in token" });

            // Пытаемся создать новый объект Artwork
            try
            {
                var artwork = await _artworkService.CreateAsync(
                    artistId,
                    artistName ?? artistId,
                    request
                );

                return Ok(new
                {
                    message = "Artwork created successfully",
                    artwork
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message }); //400
            }
        }

        /// <summary>
        /// Изменение существующей картины.
        /// PUT /api/artworks/{id}
        /// Доступен только художникам и админам.
        /// </summary>
        /// <param name="artworkId">Идентификатор картины для изменения</param>
        /// <param name="request">DTO для изменения картины</param>
        [HttpPut("{id}")]
        [Authorize(Roles = "Artist,Admin")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Update ([FromRoute(Name = "id")] string artworkId, [FromForm] UpdateArtworkRequest request)
        {
            var callerUserId = GetCallerUserId();
            var isAdmin = User.IsInRole("Admin");

            if (string.IsNullOrWhiteSpace(callerUserId))
                return Unauthorized(new { message = "User id nod found in token" });

            try
            {
                var artwork = await _artworkService.UpdateAsync(artworkId, callerUserId, isAdmin, request);

                if (artwork == null)
                    return NotFound(new { message = "Artwork not found on access denied" });

                return Ok(new
                {
                    message = "Artwork updates successfully",
                    artwork
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message }); //400
            }
        }

        /// <summary>
        /// Удаление картины.
        /// DELETE /api/artworks/{id}
        /// Доступен только художникам и админам.
        /// </summary>
        /// <param name="artworkId">Идентификатор картины для удаления</param>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Artist,Admin")]
        public async Task<IActionResult> Delete ([FromRoute(Name = "id")] string artworkId)
        {
            var callerUserId = GetCallerUserId();
            var isAdmin = User.IsInRole("Admin");

            if (string.IsNullOrWhiteSpace(callerUserId))
                return Unauthorized(new { message = "User id nod found in token" });

            var deleted = await _artworkService.DeleteAsync(artworkId, callerUserId, isAdmin);

            if (!deleted)
                return NotFound(new { message = "Artwork not found on access denied" }); //404

            return NoContent(); //204
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

        /// <summary>
        /// Получение userName текущего пользователя (если доступен в токене.
        /// </summary>
        /// <returns>Строка userName или null</returns>
        private string? GetCallerUsername()
        {
            return User.FindFirstValue("username");
        }
    }
}
