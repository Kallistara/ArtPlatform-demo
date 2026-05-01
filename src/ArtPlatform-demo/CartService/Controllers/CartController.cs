using CartService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Runtime.InteropServices;
using System.Security.Claims;

namespace CartService.Controllers
{
    /// <summary>
    /// API контроллер для управления картинами.
    /// Базовый маршрут: /api/cart
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class CartController : ControllerBase
    {
        // Dependency Injection бизнес-логики (сервиса)
        private readonly IArtCartService _cartService;

        /// <summary>
        /// Конструктор с внедрением зависимости IFavoritesArtService.
        /// </summary>
        /// <param name="cartService">Сервис управления корзиной</param>
        public CartController(IArtCartService cartService)
        {
            _cartService = cartService;
        }

        /// <summary>
        /// Получение всей корзины для текущего пользователя.
        /// GET /api/cart/me
        /// Доступне атворизованным.
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMyCart()
        {
            var userId = GetCallerUserId();

            if(string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { message = "User id not found in token" });

            var result = await _cartService.GetCartAsync(userId);
            return Ok(result);
        }

        /// <summary>
        /// Добавление картины в корзину текущего пользователя.
        /// POST /api/cart/me/{artworkId}
        /// Доступне атворизованным.
        /// </summary>
        /// <param name="artworkId">Идентификатор картины</param>
        [HttpPost("me/{artworkId}")]
        [Authorize]
        public async Task<IActionResult> AddToCart(string artworkId)
        {
            var userId = GetCallerUserId();

            // Валидация
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { message = "User id not found in token" });

            if (string.IsNullOrWhiteSpace(artworkId))
                return BadRequest(new { message = "Artwork is required" });

            try
            {
                var result = await _cartService.AddToCartAsync(userId, artworkId);

                if (result == null)
                    return NotFound(new { message = "Artwork not found" });

                return Ok(new
                {
                    message = "Artwork added to cart",
                    result
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Уменьшение количества экземпляров одной картины в корзине на 1.
        /// POST /api/cart/me/{artworkId}/decrease
        /// Доступно авторизованным.
        /// </summary>
        /// <param name="artworkId">Идентификтаор картины</param>
        [HttpPatch("me/{artworkId}/decrease")]
        [Authorize]
        public async Task<IActionResult> RemoveOneFromCart (string artworkId)
        {
            var userId = GetCallerUserId();

            // Валидация
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { message = "User id not found in token" });

            var removed = await _cartService.RemoveOneFromCartAsync(userId, artworkId);

            if (!removed)
                return NotFound(new { message = "Cart item not found" });

            return NoContent();
        }

        /// <summary>
        /// Удаление одной картины из корзины текущего пользователя.
        /// DELETE /api/cart/me/{artworkId}
        /// Доступно авторизованным.
        /// </summary>
        /// <param name="artworkId">Идентификтр картины</param>
        [HttpDelete("me/{artworkId}")]
        [Authorize]
        public async Task<IActionResult> RemoveFromCart (string artworkId)
        {
            var userId = GetCallerUserId();

            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { message = "User id not found in token" });

            var removed = await _cartService.RemoveAllFromCartAsync(userId, artworkId);

            if (!removed)
                return NotFound(new { message = "Cart item not found" });

            return NoContent();
        }

        /// <summary>
        /// Удаление всех записей из корзины текущего пользователя.
        /// DELETE /api/cart/me
        /// Доступно авторизованным.
        /// </summary>
        [HttpDelete("me")]
        [Authorize]
        public async Task<IActionResult> ClearCart()
        {
            var userId = GetCallerUserId();

            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { message = "User id not found in token" });

            var result = await _cartService.ClearCartAsync(userId);

            return Ok(new
            {
                message = "Cart cleared",
                result
            });
        }

        /// <summary>
        /// Проверка наличия картины в корзине текущего пользователя.
        /// GET /api/cart/me/{artworkId}/exists
        /// Доступно авторизованным.
        /// </summary>
        /// <param name="artworkId"></param>
        /// <returns></returns>
        [HttpGet("me/{artworkId}/exists")]
        [Authorize]
        public async Task<IActionResult> IsInCart (string artworkId)
        {
            var userId = GetCallerUserId();

            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized(new { message = "User id not found in token" });

            var exists = await _cartService.IsInCartAsync(userId, artworkId);

            return Ok(new
            {
                artworkId,
                isInCart = exists
            });
        }

        /// <summary>
        /// Метод, определяющий userid из токена. 
        /// </summary>
        /// <returns>Строка, содержащая userid</returns>
        private string? GetCallerUserId()
        {
            return User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                ?? User.FindFirstValue("sub")
                ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        }
    }
}
