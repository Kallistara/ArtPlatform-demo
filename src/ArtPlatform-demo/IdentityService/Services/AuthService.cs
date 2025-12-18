using IdentityService.data;
using IdentityService.Models;
using Microsoft.AspNetCore.Identity.Data;
using MongoDB.Driver;

namespace IdentityService.Services
{
    /// <summary>
    /// Сервис аутентификации.
    /// </summary>
    public class AuthService:IAuthService
    {
        private readonly IMongoCollection<User> _users;
        private readonly ITokenService _tokenService;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        /// <summary>
        /// Конструктор с внедрением зависимостей
        /// </summary>
        /// <param name="context">Контекст MongoDB</param>
        /// <param name="tokenService">Сервис работы с JWT токенами</param>
        /// <param name="httpClient">HTTP клиент для вызова UserService</param>
        /// <param name="configuration">Конфигурация приложения</param>
        public AuthService(MongoDBContext context, ITokenService tokenService, HttpClient httpClient, IConfiguration configuration)
        {
            _users = context.Users;
            _tokenService = tokenService;
            _httpClient = httpClient;
            _configuration = configuration;
        }

        /// <summary>
        /// Регистрация нового пользователя
        /// </summary>
        /// <param name="request">данные для регистрации</param>
        /// <returns>id созданного пользователя</returns>
        public async Task<string> RegisterAsync(Models.RegisterRequest request)
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

            try
            {
                await CreateUserProfileAsync(userId, request.Username); // Создание профиля в User Service
            }
            catch
            {
                await _users.DeleteOneAsync(u => u.UserId == userId); // откат
                throw;
            }
            return userId;
        }

        /// <summary>
        /// Аутентификация пользователя
        /// </summary>
        /// <param name="request">данные для аутенфикации</param>
        /// <returns>объект AuthResponse с id и токеном</returns>
        public async Task<AuthResponse?> LoginAsync(Models.LoginRequest request)
        {
            // Поиск пользователя
            var user = await _users.Find(u => u.Username == request.Username).FirstOrDefaultAsync();
            if (user == null) return null;

            // Проверка пароля
            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash)) return null;

            // Генерация токена
            var token = _tokenService.GenerateToken(user.UserId, user.Username);

            return new AuthResponse
            {
                UserId = user.UserId,
                AccessToken = token
            };
        }

        /// <summary>
        /// Внутренний метод для создания профиля пользователя в UserService.
        /// Вызывается после успешной регистрации в IdentityService.
        /// </summary>
        /// <param name="userId">id пользователя для создания профиля</param>
        /// <param name="username">имя пользователя</param>
        private async Task CreateUserProfileAsync(string userId, string username)
        {
            var userServiceUrl = _configuration["UserService:BaseUrl"] ?? "http://user-profile-service:5002";

            // DTO для создания профиля
            var request = new
            {
                UserId = userId,
                UserName = username,
                DisplayName = username,
                Bio = ""
            };

            // Синхронный POST запрос к UserService
            var response = await _httpClient.PostAsJsonAsync($"{userServiceUrl}/api/profile", request);

            // Проверка успешности запроса  
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Не удалось создать профиль: {error}");
            }
        }

        /// <summary>
        /// Получение информации о пользователе по UserId
        /// </summary>
        /// <param name="userId">Идентификатор пользователя</param>
        /// <returns>Информация о пользователе</returns>
        public async Task<UserInfoResponse?> GetUserByIdAsync(string userId)
        {
            var user = await _users
                .Find(u => u.UserId == userId)
                .FirstOrDefaultAsync();

            if (user == null)
                return null;

            return new UserInfoResponse
            {
                UserId = user.UserId,
                Username = user.Username,
                CreatedAt = user.CreatedAt
            };
        }

        /// <summary>
        /// Сброс старого пароля и установка нового
        /// </summary>
        /// <param name="request">данные для смены пароля</param>
        /// <returns>1 - если изменен, 0 - если не изменен</returns>
        public async Task<bool> ResetPasswordAsync(Models.LoginRequest request)
        {
            var user = await _users.Find(u => u.Username == request.Username).FirstOrDefaultAsync();

            if (user == null)
                throw new Exception("Пользователь не найден");

            // Хэш нового пароля
            var newPasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var filter = Builders<User>.Filter.Eq(u => u.UserId, user.UserId);
            var update = Builders<User>.Update
                .Set(u => u.PasswordHash, newPasswordHash);

            var result = await _users.UpdateOneAsync(filter, update);

            return result.ModifiedCount > 0;
        }
    }
}
