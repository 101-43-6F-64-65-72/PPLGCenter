using System.ComponentModel.DataAnnotations;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Application.DTOs;

public class CctvCameraResponse
{
    public Guid Id { get; set; }
    public string GatewayId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsEnabled { get; set; }
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; }
    public string PlaybackUrl { get; set; } = string.Empty;
    public CctvCameraStatus Status { get; set; }
    public DateTime? LastSeenAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateCctvCameraRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Location { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    public string Host { get; set; } = string.Empty;

    public int Port { get; set; } = 554;

    public string StreamPath { get; set; } = "/h264/ch1/main/av_stream";

    public string Username { get; set; } = "admin";

    public string Password { get; set; } = string.Empty;
}

public class DiscoveredCameraResponse
{
    public string DeviceName { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public int Port { get; set; } = 554;
    public string OnvifEndpoint { get; set; } = string.Empty;
}

public class EdgeGatewayHeartbeatRequest
{
    [Required]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string TailscaleIp { get; set; } = string.Empty;
    public int OnlineCameraCount { get; set; }
    public string SystemStatus { get; set; } = "HEALTHY";
}

public class EdgeGatewayDiscoveryRequest
{
    [Required]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public List<DiscoveredCameraResponse> DiscoveredDevices { get; set; } = new();
}
