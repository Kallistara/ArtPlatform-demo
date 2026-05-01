namespace CartService.Models.Kafka
{
    /// <summary>
    /// Модель события удаления картины
    /// </summary>
    public class ArtDeletedEvent
    {
        // Идентификатор события
        public string EventId { get; set; } = Guid.NewGuid().ToString();

        // Идентификатор удаленной картины
        public string ArtworkId { get; set; } = string.Empty;
    }
}
