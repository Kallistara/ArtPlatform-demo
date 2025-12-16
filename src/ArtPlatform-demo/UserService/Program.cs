using UserService.data;
using UserService.Services;

var builder = WebApplication.CreateBuilder(args);

// Регистрация сервисов в DI контейнере

// контроллеры MVC
builder.Services.AddControllers();

// Документация Swagger 
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Контекст Mongo
builder.Services.AddSingleton<MongoDBContext>();

// Бизнес-сервис - новый экземпляр на каждый http
builder.Services.AddScoped<IUserService, UserProfileService>();

var app = builder.Build();

// Настройка пайплайна обработки запросов
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//app.UseHttpsRedirection();

app.UseAuthorization();

// Регистрация контроллеров
app.MapControllers();

app.Run();
