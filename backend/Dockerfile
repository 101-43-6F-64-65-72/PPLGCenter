FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["StudentCenter.Api/StudentCenter.Api.csproj", "StudentCenter.Api/"]
COPY ["StudentCenter.Application/StudentCenter.Application.csproj", "StudentCenter.Application/"]
COPY ["StudentCenter.Domain/StudentCenter.Domain.csproj", "StudentCenter.Domain/"]
COPY ["StudentCenter.Infrastructure/StudentCenter.Infrastructure.csproj", "StudentCenter.Infrastructure/"]

RUN dotnet restore "StudentCenter.Api/StudentCenter.Api.csproj"

COPY . .
WORKDIR "/src/StudentCenter.Api"
RUN dotnet build "StudentCenter.Api.csproj" -c Release -o /app/build
RUN dotnet publish "StudentCenter.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Non-root user for security hardening
RUN groupadd --system --gid 1001 appgroup && \
    useradd --system --uid 1001 --gid appgroup appuser

EXPOSE 5051
ENV ASPNETCORE_URLS=http://+:5051

COPY --from=build /app/publish .

# Set ownership to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:5051/health || exit 1

ENTRYPOINT ["dotnet", "StudentCenter.Api.dll"]
