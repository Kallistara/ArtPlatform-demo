using FavoritesService.data;
using FavoritesService.Models.DTO;
using FavoritesService.Models.Entities;
using MongoDB.Driver;

namespace FavoritesService.Services
{
    /// <summary>
    /// Реализация интерфейса IFavoritesArtService бизнес-логики работы с избранными картинами 
    /// </summary>
    public class FavoritesArtService : IFavoritesArtService
    {
        // Коллекция Mongo
        private readonly IMongoCollection<FavoriteItem> _favorites;

        // Экземпляр клиента 
        private readonly IHttpClientFactory _httpClientFactory;
        private  readonly ILogger _logger;

        /// <summary>
        /// Конструктор
        /// </summary>
        /// <param name="context">БД</param>
        /// <param name="httpClientFactory">Экземпляр клиента</param>
        /// <param name="logger">Логирование</param>
        public FavoritesArtService(MongoDBContext context, IHttpClientFactory httpClientFactory, 
            ILogger<FavoritesArtService> logger)
        {
            _favorites = context.Favorites;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        /// <summary>
        /// Добавление картины в избранное.
        /// </summary>
        /// <param name="userId">Идентификатор пользоваеля, добавляющего картину в избранное</param>
        /// <param name="artworkId">Идентификатор картины</param>
        /// <returns>Созданный объек избранного или null</returns>
        public async Task<FavoriteItem?> AddToFavoritesAsync(string userId, string artworkId)
        {
            // Проверяем существование
            var existing = await _favorites.Find(x => x.UserId == userId && x.ArtworkId == artworkId).FirstOrDefaultAsync();

            if (existing != null)
                return existing;

            var artwork = await FetchArtworkAsync(artworkId);

            if (artwork == null)
                return null;

            var item = new FavoriteItem
            {
                UserId = userId,
                ArtworkId = artworkId,
                ArtworkTitle = artwork.Title,
                ArtistId = artwork.ArtistId,
                ArtistName = artwork.ArtistName,
                Category = artwork.Category,
                Price = artwork.Price,
                MainImageUrl = artwork.MainImageUrl,
                AddedAt = DateTime.UtcNow
            };

            await _favorites.InsertOneAsync(item);

            return item;
        }

        /// <summary>
        /// Получение всего избранного.
        /// </summary>
        /// <param name="userId">Идентификатор пользователя, запрашивающего свое избранное</param>
        /// <returns>Список записей избранного</returns>
        public async Task<List<FavoriteItem>> GetFavoritesAsync(string userId)
        {
            return await _favorites.Find(x => x.UserId == userId)
                .SortByDescending(x => x.AddedAt)
                .ToListAsync();
        }

        /// <summary>
        /// Проверка относится ли картина к избранному
        /// </summary>
        /// <param name="userId">Идентификатор пользователя</param>
        /// <param name="artworkId">Идентификатор картины</param>
        /// <returns>1 - если относится, 0 - в обратном</returns>
        public async Task<bool> IsFavoriteAsync(string userId, string artworkId)
        {
            return await _favorites.Find(x => x.UserId == userId && x.ArtworkId == artworkId).AnyAsync();
        }

        /// <summary>
        /// Удаление записей избранного с заданным идентификатором картины
        /// </summary>
        /// <param name="artworkId">Идентификатор картины</param>
        /// <returns>Количество удаленных записей</returns>
        public async Task<int> RemoveByArtworkIdAsync(string artworkId)
        {
            // Удаление всех записей, где ArtworkId==artworkId (для всех пользователей)
            var result = await _favorites.DeleteManyAsync(x => x.ArtworkId == artworkId);

            return (int)result.DeletedCount;
        }

        /// <summary>
        /// Удаление всего избранного для пользователя с заданным идентификатором
        /// </summary>
        /// <param name="userId">Идентификатор пользователя</param>
        /// <returns>Количество удаленных записей</returns>
        public async Task<int> RemoveByUserIdAsync(string userId)
        {
            // Удаление всех избранных записей пользователя userId
            var result = await _favorites.DeleteManyAsync(x => x.UserId == userId);

            return (int)result.DeletedCount;
        }

        /// <summary>
        /// Удаление 1 записи избранного для заданного идентификтор картины у заданного пользователя
        /// </summary>
        /// <param name="userId">Идентификатор пользователя</param>
        /// <param name="artworkId">Идентификатор картины</param>
        /// <returns>1 - если удалена, 0 - в обратном</returns>
        public async Task<bool> RemoveFromFavoritesAsync(string userId, string artworkId)
        {
            var result = await _favorites.DeleteOneAsync(x => x.UserId == userId && x.ArtworkId == artworkId);
            return result.DeletedCount > 0;
        }

        /// <summary>
        /// Метод получения полной информации о записи картины из микросервиса ArtService
        /// </summary>
        /// <param name="artworkId">Идентификатор картины для поиска</param>
        /// <returns>Объект DTO с заполненными полями или null</returns>
        private async Task<ArtworkDto?> FetchArtworkAsync (string artworkId)
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
