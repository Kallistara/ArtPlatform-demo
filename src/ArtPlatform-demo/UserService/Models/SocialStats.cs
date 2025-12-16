namespace UserService.Models
{
    /// <summary>
    /// Социальная статистика
    /// </summary>
    public class SocialStats
    {
        public int FollowersCount { get; set; } = 0; // Количество подписчиков

        public int FollowingCount { get; set; } = 0; // Количество подписок
    }
}
