# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Копирование только файла проекта 
COPY ["RoleService.csproj", "./"] 
RUN dotnet restore "RoleService.csproj"

# Копрование исходного кода и сборка
COPY . .
RUN dotnet build "RoleService.csproj" -c Release -o /app/build

# Этап публикации - создание готового к запуску приложения
FROM build AS publish
RUN dotnet publish "RoleService.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Expose port
ENV ASPNETCORE_URLS=http://+:5003
EXPOSE 5003

# Set entrypoint
ENTRYPOINT ["dotnet", "RoleService.dll"]
