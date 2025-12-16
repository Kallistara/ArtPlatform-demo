namespace UserService.Models
{
    /// <summary>
    /// Статистика контент-креатора
    /// </summary>
    public class ContentCreatorStats
    {
        public int ProductsCount { get; set; } = 0; // Количество товаров

        public int ProductsSoldCount { get; set; } = 0; // Количество проданных товаров

        public int ProjectsCount { get; set; } = 0; // Количество проектов

        public int OrdersCompletedCount { get; set; } = 0; // Количество выполненных заказов

        public double AverageRating { get; set; } = 0; // Средний рейтинг

        public DateTime? BecameCreatorDate { get; set; } // Дата получение роли креатора

        //public List<string> Specializations { get; set; } = new();
    }
}
