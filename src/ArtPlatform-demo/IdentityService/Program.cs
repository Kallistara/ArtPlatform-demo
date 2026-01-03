using Confluent.Kafka;
using Confluent.Kafka.Admin;
using IdentityService.data;
using IdentityService.Services;
using IdentityService.Services.Kafka;
using IdentityService.Utils;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MongoDB.Driver;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Регистрация сервисов
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// MongoDB
builder.Services.AddSingleton<MongoDBContext>();

// HTTP клиент для вызова User Service
builder.Services.AddHttpClient();

// JWT конфигурация 
var jwtKey = builder.Configuration["Jwt:Key"] ?? "SUPER-SECRET-KEY-123-456-789-ABC-DEF-GHI";
var keyBytes = Encoding.UTF8.GetBytes(jwtKey); 

if (keyBytes.Length < 32)
{
    // Дополняем ключ до 32 байт
    var paddedKey = new byte[32];
    Array.Copy(keyBytes, paddedKey, Math.Min(keyBytes.Length, 32));
    keyBytes = paddedKey;
}
var key = new SymmetricSecurityKey(keyBytes);

// Регистрируем ключ 
builder.Services.AddSingleton(key);

// Настраиваем схему аутентификации Bearer (JWT)
builder.Services.AddAuthentication("Bearer")
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

// Регистрация сервисов
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();

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

// Регистрация кафки
builder.Services.AddSingleton<KafkaProducerService>();
builder.Services.AddHostedService<KafkaConsumerService>();

var app = builder.Build();

// Создание топиков 
var bootstrap = builder.Configuration["KAFKA_BOOTSTRAP_SERVERS"]
    ?? Environment.GetEnvironmentVariable("KAFKA_BOOTSTRAP_SERVERS") ?? "localhost:9092";

var topics = new[]
{
    new TopicSpecification { Name = "user-registered", NumPartitions = 1, ReplicationFactor = 1 },
    new TopicSpecification { Name = "profile-created", NumPartitions = 1, ReplicationFactor = 1 },
    new TopicSpecification { Name = "user-deleted", NumPartitions = 1, ReplicationFactor = 1 } 
};
await KafkaTopicHelper.EnsureTopicsCreatedAsync(bootstrap, topics);

// Создание дефолтного админа
var adminUserId = app.Configuration["INITIAL_ADMIN_USERID"]
    ?? Environment.GetEnvironmentVariable("INITIAL_ADMIN_USERID")
    ?? "00000000-0000-0000-0000-000000000000";

var adminUsername = app.Configuration["INITIAL_ADMIN_USERNAME"]
    ?? Environment.GetEnvironmentVariable("INITIAL_ADMIN_USERNAME")
    ?? "admin";

var adminPassword = app.Configuration["INITIAL_ADMIN_PASSWORD"]
    ?? Environment.GetEnvironmentVariable("INITIAL_ADMIN_PASSWORD")
    ?? "admin11";

await IdentityService.Utils.DefaultAdminCreator.EnsureAsync(app.Services, adminUserId, adminUsername, adminPassword);

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
