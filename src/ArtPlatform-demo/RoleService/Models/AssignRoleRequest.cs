namespace RoleService.Models
{
    /// <summary>
    /// DTO для назначения роли
    /// </summary>
    public class AssignRoleRequest
    {
        // Роль
        public string Role { get; set; } = string.Empty;

        // Кем назначена
        public string? AssignedBy { get; set; }
    }
}
