using CartService.data;
using CartService.Services;
using CartService.Services.Kafka;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://0.0.0.0:5006");

// Конфигурация для подключения к ArtService
var artServiceBaseUrl = builder.Configuration["ArtService:BaseUrl"]
    ?? Environment.GetEnvironmentVariable("ART_SERVICE_BASE_URL")
    ?? "http://localhost:5004";

builder.Services.AddHttpClient("ArtService", client =>
{
    client.BaseAddress = new Uri(artServiceBaseUrl.TrimEnd('/') + "/");
});

// Добавляем аутентификацию JWT 
var jwtKey = builder.Configuration["Jwt:Key"] ?? "SUPER-SECRET-KEY-123-456-789-ABC-DEF-GHI";
var keyBytes = Encoding.UTF8.GetBytes(jwtKey);

if (keyBytes.Length < 32)
{
    var paddedKey = new byte[32];
    Array.Copy(keyBytes, paddedKey, Math.Min(keyBytes.Length, 32));
    keyBytes = paddedKey;
}
var key = new SymmetricSecurityKey(keyBytes);

// Добавляем аутентификацию
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "identity-service",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "art-platform",
            IssuerSigningKey = key,
            ClockSkew = TimeSpan.Zero,
            RoleClaimType = System.Security.Claims.ClaimTypes.Role // RoleClaimType для ролей
        };
    });
builder.Services.AddAuthorization();


// === Регистрация сервисов в DI контейнере ===

// контроллеры 
builder.Services.AddControllers();

// Документация Swagger 
builder.Services.AddEndpointsApiExplorer();

// Поддержка авторизации - ввода токенов
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter the JWT token in format: token"
    });
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Контекст Mongo
builder.Services.AddSingleton<MongoDBContext>();

// Регистрация бизнес-сервисов
builder.Services.AddScoped<IArtCartService, ArtCartService>();

// Регистрация кафки 
builder.Services.AddHostedService<KafkaConsumerService>();

var app = builder.Build();

// Настройка пайплайна обработки запросов
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
