namespace UserService.Models
{
    /// <summary>
    /// Класс для передачи информации об изменении имени пользователя
    /// </summary>
    public class ChangeUsernameResult
    {
        // Успех операции
        public bool Success { get; set; } 

        // Пользователь
        public User? User { get; set; }

        // Сообщение для клиента
        public string? Message { get; set; }

        // Текст ошибки
        public string? Error { get; set; }

        // Тип ошибки 
        public string? ErrorType { get; set; } 
    }
}
