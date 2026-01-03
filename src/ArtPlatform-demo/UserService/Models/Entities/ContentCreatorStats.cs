namespace UserService.Models.Entities
{
    /// <summary>
    /// Статистика контент-креатора
    /// </summary>
    public class ContentCreatorStats
    {
        // Количество товаров
        public int ProductsCount { get; set; } = 0;

        // Количество проданных товаров
        public int ProductsSoldCount { get; set; } = 0;

        // Количество проектов
        public int ProjectsCount { get; set; } = 0;

        // Количество выполненных заказов
        public int OrdersCompletedCount { get; set; } = 0;

        // Средний рейтинг
        public double AverageRating { get; set; } = 0;

        // Дата получение роли креатора
        public DateTime? BecameCreatorDate { get; set; } 

        //public List<string> Specializations { get; set; } = new();
    }
}
