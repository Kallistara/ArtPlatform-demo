using CartService.Models.Entities;
using MongoDB.Driver;

namespace CartService.data
{
    /// <summary>
    /// Контекст подключения к MongoDB
    /// </summary>
    public class MongoDBContext
    {
        // Ссылка на базу данных MongoDB
        private readonly IMongoDatabase _database;

        /// <summary>
        /// Конструктор - инициализирует подключение к MongoDB на основе конфигурации
        /// </summary>
        /// <param name="configuration">Конфигурация приложения (appsettings.json)</param>
        public MongoDBContext(IConfiguration configuration)
        {
            var connectionString = configuration["MongoDB:ConnectionString"];
            var databaseName = configuration["MongoDB:DatabaseName"];

            // Создание клиента MongoDB
            var client = new MongoClient(connectionString);
            _database = client.GetDatabase(databaseName);

            // Создание индексов при инициализации
            CreateIndexes();
        }

        /// <summary>
        /// Доступ к коллекции картин в корзине
        /// </summary>
        public IMongoCollection<CartItem> Cart => _database.GetCollection<CartItem>("Cart");

        /// <summary>
        /// Создание индексов для коллекции картин в корзине
        /// </summary>
        private void CreateIndexes()
        {
            var collection = Cart;

            // Идентификатор пользователя
            var userIndex = Builders<CartItem>.IndexKeys.Ascending(x => x.UserId);
            collection.Indexes.CreateOne(new CreateIndexModel<CartItem>(userIndex));

            // Идентификатор художника - автора картины
            var artworkIndex = Builders<CartItem>.IndexKeys.Ascending(x => x.ArtworkId);
            collection.Indexes.CreateOne(new CreateIndexModel<CartItem>(artworkIndex));

            // Индекс для проверки не добавляется ли одна и та же картина одним и тем же пользователем
            var uniqueIndex = Builders<CartItem>.IndexKeys
                .Ascending(x => x.UserId)
                .Ascending(x => x.ArtworkId);

            collection.Indexes.CreateOne(
                new CreateIndexModel<CartItem>(
                    uniqueIndex,
                    new CreateIndexOptions { Unique = true }
                ));
        }
    }
}
