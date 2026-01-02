namespace UserService.Models
{
    /// <summary>
    /// Социальная статистика
    /// </summary>
    public class SocialStats
    {
        // Количество подписчиков
        public int FollowersCount { get; set; } = 0;

        // Количество подписок
        public int FollowingCount { get; set; } = 0; 
    }
}
