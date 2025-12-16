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
        }

        /// <summary>
        /// Доступ к коллекции профилей пользователей
        /// </summary>
        public IMongoCollection<User> Profiles => _database.GetCollection<User>("Profiles");
    }
}
