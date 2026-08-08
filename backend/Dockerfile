FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files for layer caching
COPY ["StudentCenter.Api/StudentCenter.Api.csproj", "StudentCenter.Api/"]
COPY ["StudentCenter.Application/StudentCenter.Application.csproj", "StudentCenter.Application/"]
COPY ["StudentCenter.Domain/StudentCenter.Domain.csproj", "StudentCenter.Domain/"]
COPY ["StudentCenter.Infrastructure/StudentCenter.Infrastructure.csproj", "StudentCenter.Infrastructure/"]

RUN dotnet restore "StudentCenter.Api/StudentCenter.Api.csproj"

COPY . .
WORKDIR "/src/StudentCenter.Api"
RUN dotnet publish "StudentCenter.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Explicitly install curl for reliable container HEALTHCHECK
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Ensure default upload directory exists
RUN mkdir -p /app/wwwroot/uploads

ENV ASPNETCORE_URLS=http://+:5051
EXPOSE 5051
EXPOSE 10000

COPY --from=build /app/publish .

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:${PORT:-5051}/health || exit 1

ENTRYPOINT ["dotnet", "StudentCenter.Api.dll"]
