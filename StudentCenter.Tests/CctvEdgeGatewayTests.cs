using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class CctvEdgeGatewayTests
{
    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options);
        return context;
    }

    [Fact]
    public async Task ProcessGatewayHeartbeat_ValidTimestamp_UpdatesLastSeenAt()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var service = new CctvService(context);

        var camera = new CctvCamera
        {
            Id = Guid.NewGuid(),
            GatewayId = "gateway-school-main",
            Name = "Lab Cam 1",
            Host = "192.168.10.101",
            Status = CctvCameraStatus.Offline,
            IsEnabled = true
        };
        context.CctvCameras.Add(camera);
        await context.SaveChangesAsync();

        var request = new EdgeGatewayHeartbeatRequest
        {
            Timestamp = DateTime.UtcNow,
            TailscaleIp = "100.64.1.50",
            OnlineCameraCount = 1
        };

        // Act
        var result = await service.ProcessGatewayHeartbeatAsync("gateway-school-main", request);

        // Assert
        Assert.True(result);
        var updated = await context.CctvCameras.FirstAsync(c => c.Id == camera.Id);
        Assert.Equal(CctvCameraStatus.Online, updated.Status);
        Assert.NotNull(updated.LastSeenAt);
    }

    [Fact]
    public async Task ProcessGatewayHeartbeat_StaleTimestamp_ThrowsInvalidOperationException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var service = new CctvService(context);

        var request = new EdgeGatewayHeartbeatRequest
        {
            Timestamp = DateTime.UtcNow.AddMinutes(-15), // Stale > 5 mins
            TailscaleIp = "100.64.1.50"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.ProcessGatewayHeartbeatAsync("gateway-school-main", request));
        Assert.Contains("Replay protection", ex.Message);
    }

    [Fact]
    public async Task UpdateCameraStatus_GatewayOwnershipMismatch_ThrowsUnauthorizedAccessException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var service = new CctvService(context);
        var adminUser = new User { Id = Guid.NewGuid(), FullName = "Admin", Role = UserRole.Admin };
        context.Users.Add(adminUser);

        var camera = new CctvCamera
        {
            Id = Guid.NewGuid(),
            GatewayId = "gateway-school-A",
            Name = "Lab Cam Gateway A",
            Host = "192.168.10.101",
            Status = CctvCameraStatus.PendingVerification
        };
        context.CctvCameras.Add(camera);
        await context.SaveChangesAsync();

        // Act & Assert - Gateway B attempts to modify Gateway A's camera
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.UpdateCameraStatusAsync(camera.Id, "gateway-school-B", CctvCameraStatus.Online, adminUser.Id));
        Assert.Contains("Gateway tidak memiliki hak akses", ex.Message);
    }

    [Fact]
    public async Task UpdateCameraStatus_InvalidStateTransition_ThrowsInvalidOperationException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var service = new CctvService(context);
        var adminUser = new User { Id = Guid.NewGuid(), FullName = "Admin", Role = UserRole.Admin };
        context.Users.Add(adminUser);

        var camera = new CctvCamera
        {
            Id = Guid.NewGuid(),
            GatewayId = "gateway-school-main",
            Name = "Lab Cam Status Test",
            Host = "192.168.10.101",
            Status = CctvCameraStatus.Discovered
        };
        context.CctvCameras.Add(camera);
        await context.SaveChangesAsync();

        // Act & Assert - Invalid direct transition Discovered -> Online (must pass PendingVerification first)
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpdateCameraStatusAsync(camera.Id, "gateway-school-main", CctvCameraStatus.Online, adminUser.Id));
        Assert.Contains("dilarang oleh state machine backend", ex.Message);
    }

    [Fact]
    public async Task IngestGatewayDiscovery_SsrfHostRejection_ThrowsInvalidOperationException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var service = new CctvService(context);

        var request = new EdgeGatewayDiscoveryRequest
        {
            Timestamp = DateTime.UtcNow,
            DiscoveredDevices = new List<DiscoveredCameraResponse>
            {
                new() { DeviceName = "Malicious Cam", IpAddress = "127.0.0.1", Port = 554 }
            }
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.IngestGatewayDiscoveryAsync("gateway-school-main", request));
        Assert.Contains("SSRF", ex.Message);
    }

    [Fact]
    public async Task IngestGatewayDiscovery_ValidDevice_CreatesCameraWithDiscoveredStatus()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var service = new CctvService(context);

        var request = new EdgeGatewayDiscoveryRequest
        {
            Timestamp = DateTime.UtcNow,
            DiscoveredDevices = new List<DiscoveredCameraResponse>
            {
                new()
                {
                    DeviceName = "Hikvision Discovered Cam",
                    Manufacturer = "Hikvision",
                    Model = "DS-2CD2143G0",
                    IpAddress = "192.168.10.105",
                    Port = 554
                }
            }
        };

        // Act
        var result = await service.IngestGatewayDiscoveryAsync("gateway-school-main", request);

        // Assert
        Assert.Single(result);
        Assert.Equal("192.168.10.105", result[0].Host);
        Assert.Equal(CctvCameraStatus.Discovered, result[0].Status);
    }
}
