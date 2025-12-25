using Confluent.Kafka;
using Confluent.Kafka.Admin;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using UserService.data;
using UserService.Services;
using UserService.Services.Kafka;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseKestrel();
builder.WebHost.UseUrls("http://0.0.0.0:5002");

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
            ClockSkew = TimeSpan.Zero
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
builder.Services.AddScoped<IUserService, UserProfileService>();

// Регистрация кафки 
builder.Services.AddHostedService<KafkaConsumerService>();
builder.Services.AddSingleton<KafkaProducerService>();

var app = builder.Build();

// Настройка пайплайна обработки запросов
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Регистрация контроллеров
app.UseAuthentication(); 
app.UseAuthorization();  
app.MapControllers();

app.Run();
