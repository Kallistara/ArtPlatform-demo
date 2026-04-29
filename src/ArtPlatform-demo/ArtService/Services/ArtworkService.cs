using ArtService.data;
using ArtService.Models.DTO;
using ArtService.Models.Entities;
using ArtService.Models.Kafka;
using ArtService.Services.Kafka;
using Microsoft.AspNetCore.Mvc.Rendering;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Diagnostics.Eventing.Reader;
using System.Reflection.Metadata.Ecma335;

namespace ArtService.Services
{
    /// <summary>
    /// Реализация интерфейса IArtworkService бизнес-логики работы с картинами 
    /// </summary>
    public class ArtworkService : IArtworkService
    {
        // Коллекция Mongo
        public readonly IMongoCollection<Artwork> _artworks;
        public readonly KafkaProducerService _producer;
        private readonly ILogger<ArtworkService> _logger;

        // Интерфейс для взаимодействия с окружением
        private readonly IWebHostEnvironment _env;

        /// <summary>
        /// Конструктор 
        /// </summary>
        /// <param name="context">БД</param>
        /// <param name="producer">продьюсер для отправки сообщений</param>
        /// <param name="logger">логирование</param>
        /// <param name="env">переменные окружения</param>
        public ArtworkService(MongoDBContext context, KafkaProducerService producer, ILogger<ArtworkService> logger,
            IWebHostEnvironment env)
        {
            _artworks = context.Artworks;
            _producer = producer;
            _logger = logger;
            _env = env;

            EnsureUploadDirectory();
        }

        /// <summary>
        /// Получение всех картин
        /// </summary>
        /// <returns>список отсортированных по дате (убывание) картин</returns>
        public async Task<List<Artwork>> GetAsync()
        {
            return await _artworks.Find(_ => true)
                .SortByDescending(x => x.CreatedAt)
                .ToListAsync();
        }

        /// <summary>
        /// Получение картины по идентификатору
        /// </summary>
        /// <param name="artworkId">идентификатор картины</param>
        /// <returns>одна картина или null</returns>
        public async Task<Artwork?> GetByIdAsync(string artworkId)
        {
            return await _artworks.Find(x => x.Id == artworkId).FirstOrDefaultAsync();
        }

        /// <summary>
        /// Получение всех картин художника
        /// </summary>
        /// <param name="artistId">идентификатор художника</param>
        /// <returns>список отсортированных по дате создания картин</returns>
        public async Task<List<Artwork>> GetByArtistIdAsync(string artistId)
        {
            return await _artworks.Find(x => x.ArtistId == artistId)
                .SortByDescending(x => x.CreatedAt)
                .ToListAsync();
        }     

        /// <summary>
        /// Получение похожих картин
        /// </summary>
        /// <param name="artworkId">идентификатор картины для поиска похожих</param>
        /// <param name="limit">лимит поиска</param>
        /// <returns>список отсортированных по дате создания картин или пустой список</returns>
        public async Task<List<Artwork>> GetSimilarAsync(string artworkId, int limit = 6)
        {
            var current = await GetByIdAsync(artworkId);

            if (current == null)
                return new List<Artwork>();

            var candidates = await _artworks.Find(x =>
                x.Id != artworkId &&
                (
                    x.Category == current.Category ||
                    x.Style == current.Style ||
                    x.Material == current.Material
                ))
                .ToListAsync();

            var ranked = candidates
                .Select(x =>
                {
                    var score = 0;

                    if (!string.IsNullOrWhiteSpace(current.Category) && x.Category == current.Category)
                        score += 3;

                    if (!string.IsNullOrWhiteSpace(current.Style) && x.Style == current.Style)
                        score += 2;

                    if (!string.IsNullOrWhiteSpace(current.Material) && x.Material == current.Material)
                        score += 1;

                    return new
                    {
                        Artwork = x,
                        Score = score
                    };
                })
                .Where(x => x.Score > 0)
                .OrderByDescending(x => x.Score)
                .ThenByDescending(x => x.Artwork.CreatedAt)
                .Take(limit)
                .Select(x => x.Artwork)
                .ToList();

            return ranked;

            //return await _artworks.Find(x =>
            //    x.Category == current.Category && x.Id != current.Id)
            //    .SortByDescending(x => x.CreatedAt)
            //    .ToListAsync();
        }

        /// <summary>
        /// Поиск картины по запросу
        /// </summary>
        /// <param name="query">запро для поиска</param>
        /// <returns>список картин, подходящих под запрос</returns>
        public async Task<List<Artwork>> SearchAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
                return new List<Artwork>();
            
            // Задаем фильтры без учета регистра
            var filter = Builders<Artwork>.Filter.Or(
                Builders<Artwork>.Filter.Regex(x => x.Title,
                    new MongoDB.Bson.BsonRegularExpression(query, "i")),
                Builders<Artwork>.Filter.Regex(x => x.Description,
                    new MongoDB.Bson.BsonRegularExpression(query, "i")),
                Builders<Artwork>.Filter.Regex(x => x.ArtistName,
                    new MongoDB.Bson.BsonRegularExpression(query, "i"))
            );

            return await _artworks.Find(filter)
                .SortByDescending(x => x.CreatedAt)
                .Limit(30)
                .ToListAsync();
        }

        /// <summary>
        /// Фильтрация картин
        /// </summary>
        /// <param name="request">DTO для фильтрации</param>
        /// <returns>список картин подходящих под заданные фильтры</returns>
        public async Task<List<Artwork>> FilterAsync(ArtworkFilterRequest request)
        {
            var filter = new List<FilterDefinition<Artwork>>();

            // Имя художника без учета регистра
            if (!string.IsNullOrWhiteSpace(request.ArtistName))
                filter.Add(Builders<Artwork>.Filter.Regex(x => x.ArtistName,
                    new MongoDB.Bson.BsonRegularExpression(request.ArtistName, "i")));

            if (!string.IsNullOrWhiteSpace(request.Category))
                filter.Add(Builders<Artwork>.Filter.Eq(x => x.Category, request.Category));

            if (!string.IsNullOrWhiteSpace(request.Style))
                filter.Add(Builders<Artwork>.Filter.Eq(x => x.Style, request.Style));

            if (!string.IsNullOrWhiteSpace(request.Material))
                filter.Add(Builders<Artwork>.Filter.Eq(x => x.Material, request.Material));

            // Больше или равно минимальной цене
            if (request.MinPrice.HasValue)
                filter.Add(Builders<Artwork>.Filter.Gte(x=>x.Price, request.MinPrice.Value));

            // Меньше или равно максимальной цене
            if (request.MaxPrice.HasValue)
                filter.Add(Builders<Artwork>.Filter.Lte(x => x.Price, request.MaxPrice.Value));

            if (request.MinWidth.HasValue)
                filter.Add(Builders<Artwork>.Filter.Gte(x => x.Width, request.MinWidth.Value));

            if (request.MaxWidth.HasValue)
                filter.Add(Builders<Artwork>.Filter.Lte(x => x.Width, request.MaxWidth.Value));

            if (request.MinHeight.HasValue)
                filter.Add(Builders<Artwork>.Filter.Gte(x => x.Height, request.MinHeight.Value));

            if (request.MaxHeight.HasValue)
                filter.Add(Builders<Artwork>.Filter.Lte(x => x.Height, request.MaxHeight.Value));

            if (request.isAvailable.HasValue)
            {
                // Если количество больше 0
                if (request.isAvailable.Value)
                    filter.Add(Builders<Artwork>.Filter.Gt(x => x.Quantity, 0));
                else
                    filter.Add(Builders<Artwork>.Filter.Eq(x => x.Quantity, 0));
            }

            var finalFilter = filter.Count == 0
                ? Builders<Artwork>.Filter.Empty
                : Builders<Artwork>.Filter.And(filter);

            return await _artworks.Find(finalFilter)
                .SortByDescending(x => x.CreatedAt)
                .ToListAsync();
        }

        /// <summary>
        /// Создание новой картины
        /// </summary>
        /// <param name="artistId">идентификатор художника</param>
        /// <param name="artistName">имя художника</param>
        /// <param name="request">DTO для создания новой картины</param>
        /// <returns>Объект Artwork (картины)</returns>
        public async Task<Artwork> CreateAsync(string artistId, string artistName, CreateArtworkRequest request)
        {
            // Проверка корректности полей
            ValidateCreateRequest(request);

            // Сохраняем главное изображение
            var mainImageUrl = await SaveFileAsync(request.MainImage!);

            var additionalImageUrls = new List<string>();

            if (request.AdditionalImages != null)
            {
                foreach (var image in request.AdditionalImages)
                {
                    // Сохраняем доп изображения
                    if (image != null && image.Length > 0)
                        additionalImageUrls.Add(await SaveFileAsync(image));
                }
            }

            var artwork = new Artwork
            {
                ArtistId = artistId,
                ArtistName = artistName,
                Title = request.Title,
                Description = request.Description,
                Category = request.Category,
                Style = request.Style,
                Material = request.Material,
                Price = request.Price,
                Quantity = request.Quantity,
                Width = request.Width,
                Height = request.Height,
                MainImageUrl = mainImageUrl,
                AdditionaImageUrls = additionalImageUrls,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _artworks.InsertOneAsync(artwork);

            return artwork;
        }

        /// <summary>
        /// Обновление существующего объекта Artwork
        /// </summary>
        /// <param name="artworkId">идентификатор картины</param>
        /// <param name="callerUserId">идентификатор художника, обновляющего картину</param>
        /// <param name="isAdmin">флаг Админа</param>
        /// <param name="request">DTO для обновления объекта картины</param>
        /// <returns>обновленный объект или текущий</returns>
        /// <exception cref="Exception"></exception>
        public async Task<Artwork?> UpdateAsync(string artworkId, string callerUserId, bool isAdmin, 
            UpdateArtworkRequest request)
        {
            // Получает текущий объект
            var current = await GetByIdAsync(artworkId);

            if (current == null)
                return null;

            // Если не админ и id создателя отличается от id вызвавшего
            if (!isAdmin && current.ArtistId != callerUserId)
                return null;

            var updates = new List<UpdateDefinition<Artwork>>();
            var updateBuilder = Builders<Artwork>.Update;
            var hasChanges = false;

            // Название
            if (!string.IsNullOrWhiteSpace(request.Title) && request.Title != current.Title)
            {
                updates.Add(updateBuilder.Set(x => x.Title, request.Title));
                hasChanges = true;
            }
            // Описание
            if (!string.IsNullOrWhiteSpace(request.Description) && request.Description != current.Description)
            {
                updates.Add(updateBuilder.Set(x => x.Description, request.Description));
                hasChanges = true;
            }
            // Категория
            if (!string.IsNullOrWhiteSpace(request.Category) && request.Category != current.Category)
            {
                updates.Add(updateBuilder.Set(x => x.Category, request.Category));
                hasChanges = true;
            }
            // Стиль
            if (!string.IsNullOrWhiteSpace(request.Style) && request.Style != current.Style)
            {
                updates.Add(updateBuilder.Set(x => x.Style, request.Style));
                hasChanges = true;
            }
            // Материал
            if (!string.IsNullOrWhiteSpace(request.Material) && request.Material != current.Material)
            {
                updates.Add(updateBuilder.Set(x => x.Material, request.Material));
                hasChanges = true;
            }
            // Цена
            if (request.Price.HasValue && request.Price.Value != current.Price)
            {
                if (request.Price.Value < 0)
                    throw new Exception("Price must be non-negative");

                updates.Add(updateBuilder.Set(x => x.Price, request.Price.Value));
                hasChanges = true;
            }
            // Количество
            if (request.Quantity.HasValue && request.Quantity.Value != current.Quantity)
            {
                if (request.Quantity.Value < 0)
                    throw new Exception("Quantity must be non-negative");

                updates.Add(updateBuilder.Set(x => x.Quantity, request.Quantity.Value));
                hasChanges = true;
            }
            // Ширина
            if (request.Width.HasValue && request.Width.Value != current.Width)
            {
                if (request.Width.Value <= 0)
                    throw new Exception("Width must be greater than zero");

                updates.Add(updateBuilder.Set(x => x.Width, request.Width.Value));
                hasChanges = true;
            }
            // Высота
            if (request.Height.HasValue && request.Height.Value != current.Height)
            {
                if (request.Height.Value <= 0)
                    throw new Exception("Height must be greater than zero");

                updates.Add(updateBuilder.Set(x => x.Height, request.Height.Value));
                hasChanges = true;
            }
            // Главное изображение
            if (request.MainImage != null && request.MainImage.Length > 0)
            {
                DeleteFileByUrl(current.MainImageUrl);

                var newMainImageUrl = await SaveFileAsync(request.MainImage);
                updates.Add(updateBuilder.Set(x => x.MainImageUrl, newMainImageUrl));
                hasChanges = true;
            }
            // Доп изображения
            if (request.AdditionalImages != null && request.AdditionalImages.Count > 0)
            {
                var newUrls = new List<string>(current.AdditionaImageUrls);

                foreach(var image in request.AdditionalImages)
                {
                    if(image!=null &&  image.Length > 0)
                        newUrls.Add(await SaveFileAsync(image));
                }
                updates.Add(updateBuilder.Set(x => x.AdditionaImageUrls, newUrls));
                hasChanges = true;
            }

            if (!hasChanges)
                return current;

            updates.Add(updateBuilder.Set(x => x.UpdatedAt, DateTime.UtcNow));

            var combinedUpdate = updateBuilder.Combine(updates);

            var options = new FindOneAndUpdateOptions<Artwork>
            {
                ReturnDocument = ReturnDocument.After
            };

            return await _artworks.FindOneAndUpdateAsync(x => x.Id == artworkId, combinedUpdate, options);
        }

        /// <summary>
        /// Удаление объекта Artwork
        /// </summary>
        /// <param name="artworkId">идентификатор картины</param>
        /// <param name="callerUserId">идентификатор художника, удаляющего картину</param>
        /// <param name="isAdmin">флаг Админа</param>
        /// <returns>1 - если удален, 0 - если не удален</returns>
        public async Task<bool> DeleteAsync(string artworkId, string callerUserId, bool isAdmin)
        {
            var current = await GetByIdAsync(artworkId);

            if (current == null)
                return false;

            if (!isAdmin && current.ArtistId != callerUserId)
                return false; 

            return await DeleteArtworkInternalAsync(current, deletedBy: callerUserId);
        }

        /// <summary>
        /// Удаление всех картин художника
        /// </summary>
        /// <param name="artistId">идентифифктаор художника</param>
        /// <returns>количество удаленных картин</returns>
        public async Task<int> DeleteByArtistIdAsync(string artistId)
        {
            var artworks = await GetByArtistIdAsync(artistId);

            var count = 0;

            foreach (var artwork in artworks)
            {
                var deleted = await DeleteArtworkInternalAsync(artwork, deletedBy: "system: user-deleted");

                if (deleted)
                    count++;
            }

            return count;
        }

        /// <summary>
        /// Вспомогательный метод удаления заданного объъекта Artwork
        /// </summary>
        /// <param name="artwork">объект для удаления</param>
        /// <param name="deletedBy">кем удалено</param>
        /// <returns>1 - если удалено, 0 - иначе</returns>
        private async Task<bool> DeleteArtworkInternalAsync(Artwork artwork, string deletedBy)
        {
            var result = await _artworks.DeleteOneAsync(x => x.Id == artwork.Id);

            if (result.DeletedCount <= 0)
                return false;

            // Удаление главного изображения
            DeleteFileByUrl(artwork.MainImageUrl);

            // Удаление доп изображений
            if (artwork.AdditionaImageUrls != null)
            {
                foreach (var url in artwork.AdditionaImageUrls)
                    DeleteFileByUrl(url);
            }

            try
            {
                // Создаем и отправляем событие об удалении картины
                var evt = new ArtDeletedEvent
                {
                    ArtworkId = artwork.Id
                };

                await _producer.ProduceAsync("art-deleted", evt);
            }

            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to produce art-deleted event for ArtworkId {ArtworkId}", artwork.Id);
            }

            return true;
        }

        /// <summary>
        /// Проверка корректности заполнения полей
        /// </summary>
        /// <param name="request">DTO создания объекта</param>
        /// <exception cref="Exception"></exception>
        private void ValidateCreateRequest (CreateArtworkRequest request)
        {
            // Название
            if (string.IsNullOrWhiteSpace(request.Title))
                throw new Exception("Title is required");

            // Описание
            if (string.IsNullOrWhiteSpace(request.Description))
                throw new Exception("Description is required");

            // Категория
            if (string.IsNullOrWhiteSpace(request.Category))
                throw new Exception("Category is required");

            // Стиль
            if (string.IsNullOrWhiteSpace(request.Style))
                throw new Exception("Style is required");

            // Материал
            if (string.IsNullOrWhiteSpace(request.Material))
                throw new Exception("Material is required");

            // Цена
            if (request.Price < 0)
                throw new Exception("Price must be non-negative");

            // Количество
            if (request.Quantity < 0)
                throw new Exception("Quantity must be non-negative");

            // Ширина
            if (request.Width <= 0)
                throw new Exception("Width must be greater than zero");

            // Высота
            if (request.Height <= 0)
                throw new Exception("Height must be greater than zero");

            // Главное изображение
            if (request.MainImage == null || request.MainImage.Length == 0)
                throw new Exception("Main image is required");
        }

        /// <summary>
        /// Сохранение файла изображения
        /// </summary>
        /// <param name="file">файл для сохранения</param>
        /// <returns>URL путь до сохраненного файла</returns>
        private async Task<string> SaveFileAsync (IFormFile file)
        {
            EnsureUploadDirectory();

            // Расширение указанной строки пути, включая точку
            var extension = Path.GetExtension(file.FileName);

            // Формируем название файла
            var fileName = $"{Guid.NewGuid():N}{extension}";

            // Формируем путь до файла - путь до файла + файл
            var filePath = Path.Combine(GetUploadDirectory(), fileName);

            // Создаем путь и сохраняем файл 
            await using var stream = File.Create(filePath);
            await file.CopyToAsync(stream);

            return $"/uploads/artwork/{fileName}";
        }

        /// <summary>
        /// Удаление файла с заданным путем
        /// </summary>
        /// <param name="url">URL путь до файла</param>
        private void DeleteFileByUrl (string? url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return;

            try
            {
                // Разбиваем URL
                var relativePath = url.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);

                // Формируем полный путь
                var fullPath = Path.Combine(GetWebRootPath(), relativePath);

                if (File.Exists(fullPath))
                    File.Delete(fullPath);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete image file for url {Url}", url);
            }   
        }

        /// <summary>
        /// Формирование пути к папке хранящей изображения
        /// </summary>
        /// <returns></returns>
        private string GetWebRootPath()
        {
            return _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        }

        /// <summary>
        /// Формирование полного пути до директории для изображений
        /// </summary>
        /// <returns>строку пути до директории</returns>
        private string GetUploadDirectory()
        {
            return Path.Combine(GetWebRootPath(), "uploads", "artworks");
        }

        /// <summary>
        /// Создание директории для хранения изображений
        /// </summary>
        private void EnsureUploadDirectory()
        {
            Directory.CreateDirectory(GetUploadDirectory());
        }
    }
}
