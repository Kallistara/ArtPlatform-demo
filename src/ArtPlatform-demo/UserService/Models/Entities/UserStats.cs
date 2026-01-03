namespace UserService.Models.Entities
{
    /// <summary>
    /// Статистика авторизованного пользователя (заказчик/покупатель)
    /// </summary>
    public class UserStats
    {
        // Количество опубликованных заказов
        public int PublishedOrdersCount { get; set; } = 0;

        // Количество купленных товаров
        public int PurchasedProductsCount { get; set; } = 0;

        // Количество активных заказов
        public int ActiveOrdersCount { get; set; } = 0; 
    }
}
