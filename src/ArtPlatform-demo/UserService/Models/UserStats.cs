namespace UserService.Models
{
    /// <summary>
    /// Статистика авторизованного пользователя (заказчик/покупатель)
    /// </summary>
    public class UserStats
    {
        public int PublishedOrdersCount { get; set; } = 0; // Количество опубликованных заказов

        public int PurchasedProductsCount { get; set; } = 0; // Количество купленных товаров

        public int ActiveOrdersCount { get; set; } = 0; // Количество активных заказов
    }
}
