using RoleService.Models;

namespace RoleService.Services
{
    /// <summary>
    /// Интерфейс сервиса управления ролями пользователей
    /// </summary>
    public interface IRolesService
    {
        // Получить роль пользователя по UserId
        Task<UserRoleEntry?> GetByUserIdAsync(string userId);

        // Создать или обновить роль пользователя
        Task<UserRoleEntry> UpsertRoleAsync(string userId, UserRole role, string? assignedBy = null);

        // Удалить роль пользователя
        Task<bool> RemoveRoleAsync(string userId, string? removedBy = null);

        // Получить всех пользователей с указанной ролью
        Task<IEnumerable<UserRoleEntry>> GetByRoleAsync(UserRole role);
    }
}
