using System.ComponentModel.DataAnnotations.Schema;

namespace StudentCenter.Domain.Entities;

public enum CctvCameraStatus
{
    Online = 0,
    Offline = 1,
    Degraded = 2,
    AuthFailed = 3,
    StreamUnavailable = 4,
    Unknown = 5,
    Discovered = 6,
    PendingVerification = 7,
    Error = 8
}

public class CctvCamera
{
    public Guid Id { get; set; }

    [NotMapped]
    public string GatewayId { get; set; } = "gateway-school-main";

    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsEnabled { get; set; } = true;
    
    // RTSP Network Details (Validated against SSRF rules)
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 554;
    public string StreamPath { get; set; } = "/h264/ch1/main/av_stream";
    
    // Password Security (AES-256-GCM Encrypted at rest)
    public string EncryptedUsername { get; set; } = string.Empty;
    public string EncryptedPassword { get; set; } = string.Empty;
    public string EncryptionIV { get; set; } = string.Empty;
    
    public CctvCameraStatus Status { get; set; } = CctvCameraStatus.Unknown;
    public DateTime? LastSeenAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
