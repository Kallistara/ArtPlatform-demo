using IdentityService.Models.Entites;
using MongoDB.Driver;

namespace IdentityService.data
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
        /// Доступ к коллекции пользователей
        /// </summary>
        public IMongoCollection<User> Users => _database.GetCollection<User>("Users");

        /// <summary>
        /// Создание индексов для коллекции пользователей
        /// </summary>
        private void CreateIndexes()
        {
            var users = Users;

            var usernameIndex = Builders<User>.IndexKeys.Ascending(u => u.Username);
            var usernameIndexOptions = new CreateIndexOptions { Unique = true };
            users.Indexes.CreateOne(new CreateIndexModel<User>(usernameIndex, usernameIndexOptions));

            var userIdIndex = Builders<User>.IndexKeys.Ascending(u => u.UserId);
            users.Indexes.CreateOne(new CreateIndexModel<User>(userIdIndex));
        }
    }
}
