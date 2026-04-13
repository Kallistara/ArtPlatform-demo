using RoleService.Models.Entities;

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
        Task<bool> DeleteRoleAsync(string userId);

        // Получить всех пользователей с указанной ролью
        Task<IEnumerable<UserRoleEntry>> GetByRoleAsync(UserRole role);
    }
}
