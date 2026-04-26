using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RoleService.Models.DTO;
using RoleService.Models.Entities;
using RoleService.Models.Kafka;
using RoleService.Services;
using RoleService.Services.Kafka;

namespace RoleService.Controllers
{
    /// <summary>
    /// Контроллер для управления ролями пользователей.
    /// Базовый маршрут api/role/
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class RoleController : ControllerBase
    {
        private readonly IRolesService _roleService; // Сервис управления ролями

        /// <summary>
        /// Конструктор
        /// </summary>
        /// <param name="roleService">бизнес-сервис управления ролями</param>
        public RoleController(IRolesService roleService)
        {
            _roleService = roleService;
        }

        /// <summary>
        /// Получить роль пользователя по его идентификатору.
        /// GET /api/role/{userId}
        /// Доступен всем.
        /// </summary>
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetRole(string userId)
        {
            var r = await _roleService.GetByUserIdAsync(userId);

            if (r == null) return NotFound();
            return Ok(r); 
        }

        /// <summary>
        /// Назначить роль пользователю.
        /// POST /api/role/{userId}/assign
        /// Доступен только админу.
        /// </summary>
        [HttpPost("{userId}/assign")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AssignRole(string userId, [FromBody] AssignRoleRequest req)
        {
            // Валидация роли
            if (!Enum.TryParse<UserRole>(req.Role, true, out var parsed))
                return BadRequest(new { error = "Invalid role" });

            var updated = await _roleService.UpsertRoleAsync(userId, parsed, req.AssignedBy);

            return Ok(updated);
        }

        /// <summary>
        /// Получить всех пользователей с указанной ролью.
        /// GET /api/role/by-role/{role}
        /// Доступен только админу
        /// </summary>
        [HttpGet("by-role/{role}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetByRole(string role)
        {
            // Валидация роли
            if (!Enum.TryParse<UserRole>(role, true, out var parsed))
                return BadRequest(new { error = "Invalid role" });

            var list = await _roleService.GetByRoleAsync(parsed);
            return Ok(list);
        }
    }
}
