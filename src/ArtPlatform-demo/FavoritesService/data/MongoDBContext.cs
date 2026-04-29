using FavoritesService.Models.Entities;
using MongoDB.Driver;

namespace FavoritesService.data
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
        /// Доступ к коллекции избранных картин
        /// </summary>
        public IMongoCollection<FavoriteItem> Favorites => _database.GetCollection<FavoriteItem>("Favorites");

        /// <summary>
        /// Создание индексов для коллекции картин
        /// </summary>
        private void CreateIndexes()
        {
            var collection = Favorites;

            // Идентификатор пользователя
            var userIndex = Builders<FavoriteItem>.IndexKeys.Ascending(x => x.UserId);
            collection.Indexes.CreateOne(new CreateIndexModel<FavoriteItem>(userIndex));

            // Идентификатор художника - автора картины
            var artworkIndex = Builders<FavoriteItem>.IndexKeys.Ascending(x => x.ArtworkId);
            collection.Indexes.CreateOne(new CreateIndexModel<FavoriteItem>(artworkIndex));

            // Индекс для проверки не добавляется ли одна и та же картина одним и тем же пользователем
            var uniqueIndex = Builders<FavoriteItem>.IndexKeys
                .Ascending(x => x.UserId)
                .Ascending(x => x.ArtworkId);

            collection.Indexes.CreateOne(
                new CreateIndexModel<FavoriteItem>(
                    uniqueIndex,
                    new CreateIndexOptions { Unique = true }
                ));
        }
    }
}
