namespace RoleService.Models
{
    /// <summary>
    /// Перечисление всех ролей
    /// </summary>
    public enum UserRole
    {
        Unauthorized = 0,
        User = 1,
        ContentCreator = 2,
        Admin = 3
    }
}
