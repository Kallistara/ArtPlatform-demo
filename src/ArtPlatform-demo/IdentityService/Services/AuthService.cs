using IdentityService.data;
using IdentityService.Models.DTO;
using IdentityService.Models.Entites;
using IdentityService.Services.Kafka;
using Microsoft.AspNetCore.Identity.Data;
using MongoDB.Driver;

namespace IdentityService.Services
{
    /// <summary>
    /// Сервис аутентификации.
    /// </summary>
    public class AuthService:IAuthService
    {
        private readonly IMongoCollection<User> _users; // коллекция пользователей
        private readonly ITokenService _tokenService; // бизнес-сервис работы с токенами
        private readonly KafkaProducerService _kafkaProducer; // продьюсер

        /// <summary>
        /// Конструктор с внедрением зависимостей
        /// </summary>
        /// <param name="context">Контекст MongoDB</param>
        /// <param name="tokenService">Сервис работы с JWT токенами</param>
        /// <param name="kafkaProducer"></param>
        /// <param name="logger"></param>
        public AuthService(MongoDBContext context, ITokenService tokenService, 
            KafkaProducerService kafkaProducer)
        {
            _users = context.Users;
            _tokenService = tokenService;
            _kafkaProducer = kafkaProducer;
        }

        /// <summary>
        /// Регистрация нового пользователя
        /// </summary>
        /// <param name="request">данные для регистрации</param>
        /// <returns>id созданного пользователя</returns>
        public async Task<string> RegisterAsync(Models.DTO.RegisterRequest request)
        {
            var existing = await _users.Find(u => u.Username == request.Username).AnyAsync();

            if (existing) throw new Exception("Username уже используется");

            // Генерация UserId
            var userId = Guid.NewGuid().ToString();

            // Хэширование пароля
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            // Сохранение в MongoDB
            var user = new User
            {
                UserId = userId,
                Username = request.Username,
                PasswordHash = passwordHash,
                CreatedAt = DateTime.UtcNow
            };
            await _users.InsertOneAsync(user);

            // Создаем объект сообщения для кафки и отправляем его
            var evt = new Models.Kafka.UserRegisteredEvent
            {
                UserId = userId,
                Username = request.Username,
                CreatedAt = user.CreatedAt
            };
            await _kafkaProducer.ProduceAsync("user-registered", evt);

            return userId;
        }

        /// <summary>
        /// Аутентификация пользователя
        /// </summary>
        /// <param name="request">данные для аутенфикации</param>
        /// <returns>объект AuthResponse с id и токеном</returns>
        public async Task<AuthResponse?> LoginAsync(Models.DTO.LoginRequest request)
        {
            // Поиск пользователя
            var user = await _users.Find(u => u.Username == request.Username).FirstOrDefaultAsync();
            if (user == null)
                return null;

            // Проверка пароля
            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return null;

            // Генерация токена
            var token = _tokenService.GenerateToken(user.UserId, user.Username, user.Role);

            return new AuthResponse
            {
                UserId = user.UserId,
                AccessToken = token
            };
        }

        /// <summary>
        /// Изменение пароля
        /// </summary>
        /// <param name="userId">идентификатор пользователя</param>
        /// <param name="currentPassword">текущий пароль</param>
        /// <param name="newPassword">новый пароль</param>
        /// <returns>1 - при изменении пароля, 0 - при ошибке изменения</returns>
        public async Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword)
        {
            // Находим пользователя в коллекции
            var user = await _users.Find(u => u.UserId == userId).FirstOrDefaultAsync();
            if (user == null) throw new Exception("User not found");

            // Проверяем текущий пароль
            if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
                throw new Exception("Current password is incorrect");

            var newHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            var filter = Builders<User>.Filter.Eq(u => u.UserId, userId);
            var update = Builders<User>.Update.Set(u => u.PasswordHash, newHash);

            // Изменяем пароль
            var result = await _users.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }
    }
}
