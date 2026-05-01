# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Копирование только файла проекта 
COPY ["CartService.csproj", "./"] 
RUN dotnet restore "CartService.csproj"

# Копрование исходного кода и сборка
COPY . .
RUN dotnet build "CartService.csproj" -c Release -o /app/build

# Этап публикации - создание готового к запуску приложения
FROM build AS publish
RUN dotnet publish "CartService.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Expose port
ENV ASPNETCORE_URLS=http://+:5006
EXPOSE 5006

# Set entrypoint
ENTRYPOINT ["dotnet", "CartService.dll"]



