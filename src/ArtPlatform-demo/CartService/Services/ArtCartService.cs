using Amazon.Runtime.Internal.Auth;
using CartService.data;
using CartService.Models.DTO;
using CartService.Models.Entities;
using MongoDB.Driver;

namespace CartService.Services
{
    /// <summary>
    /// Реализация интерфейса IArtCartService бизнес-логики работы с картинами в корзине
    /// </summary>
    public class ArtCartService : IArtCartService
    {
        // Коллекция Mongo
        private readonly IMongoCollection<CartItem> _carts;

        // Экземпляр клиента 
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<CartItem> _logger;

        /// <summary>
        /// Конструктор 
        /// </summary>
        /// <param name="context">БД</param>
        /// <param name="httpClientFactory">Экземпляр клиента</param>
        /// <param name="logger">Логирование</param>
        public ArtCartService(MongoDBContext context, IHttpClientFactory httpClientFactory, 
            ILogger<CartItem> logger)
        {
            _carts = context.Cart;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        /// <summary>
        /// Добавление картины в корзину.
        /// </summary>
        /// <param name="userId">Идентификатор пользователя, добавляющего картину</param>
        /// <param name="artworkId">Идентификтор картины</param>
        /// <returns>Экземпляр добавленной картины или null</returns>
        public async Task<CartItem?> AddToCartAsync(string userId, string artworkId)
        {
            var artwork = await FetchArtworkAsync(artworkId);

            if (artwork == null)
                return null;

            // Если в наличии картины нет
            if (artwork.Quantity <= 0)
                throw new Exception("Artwork is out of stock");

            // Проверяем существование записи корзины для такого пользователя с такой картиной
            var existing = await _carts.Find(x => x.UserId == userId && x.ArtworkId == artworkId).FirstOrDefaultAsync();

            // Текущее количество экземпляров картины в корзине
            var currentQuantityInCart = existing?.Quantity ?? 0;

            // Проверка есть ли в наличии еще экземпляр
            if (currentQuantityInCart + 1 > artwork.Quantity)
                throw new Exception($"Not enough artwork quantity available. Available {artwork.Quantity}, " +
                    $"requested in cart {currentQuantityInCart + 1}");

            // Если такая картина уже есть в корзине - добавляем еще
            if (existing != null)
            {
                var newQuantity = existing.Quantity + 1;

                var update = Builders<CartItem>.Update
                    .Set(x => x.Quantity, newQuantity)
                    .Set(x => x.AddedAt, DateTime.UtcNow);

                var updated = await _carts.FindOneAndUpdateAsync(
                    x => x.UserId == userId && x.ArtworkId == artworkId,
                    update,
                    new FindOneAndUpdateOptions<CartItem> { ReturnDocument = ReturnDocument.After });

                return updated;
            }
                
            // Если нет в корзине - создаем
            var item = new CartItem
            {
                UserId = userId,
                ArtworkId = artworkId,
                ArtistId = artwork.ArtistId,
                ArtistName = artwork.ArtistName,
                ArtworkTitle = artwork.Title,
                Category = artwork.Category,
                Price = artwork.Price,
                MainImageUrl = artwork.MainImageUrl,
                Quantity = 1,
                AddedAt = DateTime.UtcNow
            };

            await _carts.InsertOneAsync(item);
            return item;
        }

        /// <summary>
        /// Получение всей корзины.
        /// </summary>
        /// <param name="userId">Идентифкатор пользователя, данные о корзине которого нужно получить</param>
        /// <returns>Список из объектов картин в корзине</returns>
        public Task<List<CartItem>> GetCartAsync(string userId)
        {
            return _carts.Find(x => x.UserId == userId)
               .SortByDescending(x => x.AddedAt)
               .ToListAsync();
        }

        /// <summary>
        /// Удаление одного экземпляра конкретной картины у конкретного пользователя.
        /// </summary>
        /// <param name="userId">Идентифкатор пользователя, у которого удаляется картина из корзины</param>
        /// <param name="artworkId">Идентификтор картины</param>
        /// <returns>1 - если удалена, 0 - в обратном</returns>
        public async Task<bool> RemoveOneFromCartAsync(string userId, string artworkId)
        {
            // Проверяем существование
            var existing = await _carts.Find(x => x.UserId == userId && x.ArtworkId == artworkId).FirstOrDefaultAsync();

            if (existing == null)
                return false;

            // Если количество картин в корзине больше 1
            if (existing.Quantity > 1)
            {
                var update = Builders<CartItem>.Update
                    .Set(x => x.Quantity, existing.Quantity - 1);

                var result = await _carts.UpdateOneAsync(
                    x => x.UserId == userId && x.ArtworkId == artworkId,
                    update);

                return result.ModifiedCount > 0;
            }

            var deleteResult = await _carts.DeleteOneAsync(x => x.UserId == userId && x.ArtworkId == artworkId);
            return deleteResult.DeletedCount > 0;
        }

        /// <summary>
        /// Удаление всех экземпляров конкретной картины у конкретного пользователя.
        /// </summary>
        /// <param name="userId">Идентифкатор пользователя, у которого удаляется картина из корзины</param>
        /// <param name="artworkId">Идентификтор картины</param>
        /// <returns>1 - если удалена, 0 - в обратном</returns>
        public async Task<bool> RemoveAllFromCartAsync(string userId, string artworkId)
        {
            var result = await _carts.DeleteOneAsync(x => x.UserId == userId && x.ArtworkId == artworkId);
            return result.DeletedCount > 0;
        }

        /// <summary>
        /// Удаление всех записей из корзины.
        /// </summary>
        /// <param name="userId">Идентификатор пользователя, у которого очищается корзина</param>
        /// <returns>Количество удаленных объектов</returns>
        public async Task<int> ClearCartAsync(string userId)
        {
            var result = await _carts.DeleteManyAsync(x => x.UserId == userId);
            return (int)result.DeletedCount;
        }

        /// <summary>
        /// Проверка находится ли запись в корзине.
        /// </summary>
        /// <param name="userId">Идентификатор пользователя, для которого проверяется наличие картины в корзине</param>
        /// <param name="artworkId">Идентификатор картины</param>
        /// <returns>1 - если есть, 0 - в обратном</returns>
        public async Task<bool> IsInCartAsync(string userId, string artworkId)
        {
            return await _carts.Find(x => x.UserId == userId && x.ArtworkId == artworkId).AnyAsync();
        }

        /// <summary>
        /// Удаление всех записей картины.
        /// </summary>
        /// <param name="artworkId">Идентификатор картины записи о которой необходимо удалить</param>
        /// <returns>Колличество удаленных записей</returns>
        public async Task<int> RemoveByArtworkIdAsync(string artworkId)
        {
            var result = await _carts.DeleteManyAsync(x => x.ArtworkId == artworkId);
            return (int)result.DeletedCount;
        }

        /// <summary>
        /// Метод получения полной информации о записи картины из микросервиса ArtService
        /// </summary>
        /// <param name="artworkId">Идентификатор картины для поиска</param>
        /// <returns>Объект DTO с заполненными полями или null</returns>
        private async Task<ArtworkDto?> FetchArtworkAsync(string artworkId)
        {
            // Создаем клиента
            var client = _httpClientFactory.CreateClient("ArtService");

            try
            {
                // Обращаемся к эндпойнту для получения информации о картине
                var responce = await client.GetAsync($"api/artworks/{artworkId}");

                if (responce.StatusCode == System.Net.HttpStatusCode.NotFound)
                    return null;

                responce.EnsureSuccessStatusCode();

                // Сериализуем
                var artwork = await responce.Content.ReadFromJsonAsync<ArtworkDto>(
                    new System.Text.Json.JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    }
                );
                return artwork;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch artwork from ArtService. ArtworkId = {ArtworkId}", artworkId);
                return null;
            }
        }
    }
}
