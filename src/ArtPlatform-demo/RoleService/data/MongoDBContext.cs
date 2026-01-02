using MongoDB.Driver;
using RoleService.Models;

namespace RoleService.data
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
        /// Доступ к коллекции ролей пользователей
        /// </summary>
        public IMongoCollection<UserRoleEntry> Roles => _database.GetCollection<UserRoleEntry>("Roles");

        /// <summary>
        /// Создание индексов для коллекции ролей пользователей
        /// </summary>
        private void CreateIndexes()
        {
            var roles = Roles;
            var userIdIndex = Builders<UserRoleEntry>.IndexKeys.Ascending(r => r.UserId);
            roles.Indexes.CreateOne(new CreateIndexModel<UserRoleEntry>(userIdIndex, new CreateIndexOptions { Unique = true }));
        }
    }
}
