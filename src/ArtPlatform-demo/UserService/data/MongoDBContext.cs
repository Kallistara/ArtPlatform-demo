using MongoDB.Driver;
using UserService.Models;

namespace UserService.data
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
        /// Доступ к коллекции профилей пользователей
        /// </summary>
        public IMongoCollection<User> Profiles => _database.GetCollection<User>("Profiles");

        /// <summary>
        /// Создание индексов для коллекции пользователей
        /// </summary>
        private void CreateIndexes()
        {
            var collection = Profiles;

            // Уникальный индекс для UserName (логин)
            var userNameIndex = Builders<User>.IndexKeys.Ascending(u => u.UserName);
            var userNameIndexOptions = new CreateIndexOptions { Unique = true };

            collection.Indexes.CreateOne(
                new CreateIndexModel<User>(userNameIndex, userNameIndexOptions)
            );

            // Индекс для поиска по UserId
            var userIdIndex = Builders<User>.IndexKeys.Ascending(u => u.UserId);
            collection.Indexes.CreateOne(new CreateIndexModel<User>(userIdIndex));

            // Текстовый индекс для поиска
            var textIndexKeys = Builders<User>.IndexKeys
                .Text(u => u.UserName)
                .Text(u => u.DisplayName)
                .Text(u => u.Bio);
            collection.Indexes.CreateOne(new CreateIndexModel<User>(textIndexKeys));
        }
    }
}
