using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// Добавляем ocelot.json в конфигурацию
builder.Configuration.AddJsonFile("ocelot.json", optional: false, reloadOnChange: true);
builder.Configuration.AddJsonFile("appsettings.json", optional: true, reloadOnChange: true);

// Конфигурация JWT 
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

// Добавляем Ocelot
builder.Services.AddOcelot(builder.Configuration);

var app = builder.Build();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

await app.UseOcelot();

app.Run();
