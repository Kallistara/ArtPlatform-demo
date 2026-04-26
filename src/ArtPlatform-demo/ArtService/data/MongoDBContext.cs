using ArtService.Models.Entities;
using MongoDB.Driver;

namespace ArtService.data
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
        /// Доступ к коллекции картин
        /// </summary>
        public IMongoCollection<Artwork> Artworks => _database.GetCollection<Artwork>("Artworks");

        /// <summary>
        /// Создание индексов для коллекции картин
        /// </summary>
        private void CreateIndexes()
        {
            var collection = Artworks;

            // Идентификаатор художника
            collection.Indexes.CreateOne(new CreateIndexModel<Artwork>(
                Builders<Artwork>.IndexKeys.Ascending(x => x.ArtistId)));

            // Имя художника (username)
            collection.Indexes.CreateOne(new CreateIndexModel<Artwork>(
                Builders<Artwork>.IndexKeys.Ascending(x => x.ArtistName)));

            // Категория
            collection.Indexes.CreateOne(new CreateIndexModel<Artwork>(
                Builders<Artwork>.IndexKeys.Ascending(x => x.Category)));

            // Стиль
            collection.Indexes.CreateOne(new CreateIndexModel<Artwork>(
                Builders<Artwork>.IndexKeys.Ascending(x => x.Style)));

            // Материал
            collection.Indexes.CreateOne(new CreateIndexModel<Artwork>(
                Builders<Artwork>.IndexKeys.Ascending(x => x.Material)));

            // Время создания
            collection.Indexes.CreateOne(new CreateIndexModel<Artwork>(
                Builders<Artwork>.IndexKeys.Ascending(x => x.CreatedAt)));

            // Цена
            collection.Indexes.CreateOne(new CreateIndexModel<Artwork>(
                Builders<Artwork>.IndexKeys.Ascending(x => x.Price)));

            // Ширина
            collection.Indexes.CreateOne(new CreateIndexModel<Artwork>(
                Builders<Artwork>.IndexKeys.Ascending(x => x.Width)));

            // Высота
            collection.Indexes.CreateOne(new CreateIndexModel<Artwork>(
                Builders<Artwork>.IndexKeys.Ascending(x => x.Height)));
        }
    }
}
