using System.Net;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class CctvService : ICctvService
{
    private readonly AppDbContext _context;
    private static readonly byte[] AesMasterKey = Encoding.UTF8.GetBytes("PPLGCenterCctvMasterEncryptKey32"); // Exactly 32 bytes (256-bit AES Key)
    private static readonly TimeSpan ClockSkewTolerance = TimeSpan.FromMinutes(5);

    public CctvService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<CctvCameraResponse>> GetCamerasAsync(Guid currentUserId)
    {
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == currentUserId);
        if (user is null || user.Role == UserRole.Student)
        {
            throw new UnauthorizedAccessException("Siswa tidak memiliki akses ke sistem CCTV sekolah.");
        }

        var cameras = await _context.CctvCameras
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .ToListAsync();

        return cameras.Select(MapResponse).ToList();
    }

    public async Task<CctvCameraResponse?> GetCameraByIdAsync(Guid id, Guid currentUserId)
    {
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == currentUserId);
        if (user is null || user.Role == UserRole.Student)
        {
            throw new UnauthorizedAccessException("Siswa tidak memiliki akses ke sistem CCTV sekolah.");
        }

        var camera = await _context.CctvCameras
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);

        return camera is null ? null : MapResponse(camera);
    }

    public async Task<CctvCameraResponse> CreateCameraAsync(CreateCctvCameraRequest request, Guid currentUserId)
    {
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == currentUserId);
        if (user is null || user.Role != UserRole.Admin)
        {
            throw new UnauthorizedAccessException("Hanya Administrator yang dapat menambahkan kamera CCTV.");
        }

        ValidateSsrfHost(request.Host);

        var (encryptedUsername, usernameIv) = EncryptString(request.Username);
        var (encryptedPassword, passwordIv) = EncryptString(request.Password);

        var camera = new CctvCamera
        {
            Id = Guid.NewGuid(),
            GatewayId = "gateway-school-main",
            Name = request.Name,
            Location = request.Location,
            Description = request.Description,
            Host = request.Host,
            Port = request.Port > 0 ? request.Port : 554,
            StreamPath = string.IsNullOrWhiteSpace(request.StreamPath) ? "/h264/ch1/main/av_stream" : request.StreamPath,
            EncryptedUsername = encryptedUsername,
            EncryptedPassword = encryptedPassword,
            EncryptionIV = passwordIv,
            IsEnabled = true,
            Status = CctvCameraStatus.PendingVerification,
            LastSeenAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.CctvCameras.Add(camera);
        await _context.SaveChangesAsync();

        return MapResponse(camera);
    }

    public async Task<bool> ToggleCameraStatusAsync(Guid id, bool isEnabled, Guid currentUserId)
    {
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == currentUserId);
        if (user is null || user.Role != UserRole.Admin)
        {
            throw new UnauthorizedAccessException("Hanya Administrator yang dapat merubah status aktif kamera CCTV.");
        }

        var camera = await _context.CctvCameras.FirstOrDefaultAsync(c => c.Id == id);
        if (camera is null) return false;

        camera.IsEnabled = isEnabled;
        camera.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteCameraAsync(Guid id, Guid currentUserId)
    {
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == currentUserId);
        if (user is null || user.Role != UserRole.Admin)
        {
            throw new UnauthorizedAccessException("Hanya Administrator yang dapat menghapus kamera CCTV.");
        }

        var camera = await _context.CctvCameras.FirstOrDefaultAsync(c => c.Id == id);
        if (camera is null) return false;

        _context.CctvCameras.Remove(camera);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<DiscoveredCameraResponse>> DiscoverCamerasAsync(Guid currentUserId)
    {
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == currentUserId);
        if (user is null || user.Role != UserRole.Admin)
        {
            throw new UnauthorizedAccessException("Hanya Administrator yang dapat menjalankan pemindaian penemuan kamera.");
        }

        // Return simulated discovered ONVIF cameras on lab LAN
        return new List<DiscoveredCameraResponse>
        {
            new()
            {
                DeviceName = "Hikvision Lab PPLG 1 (IP Cam Main)",
                Manufacturer = "Hikvision Digital Technology",
                Model = "DS-2CD2143G0-I",
                IpAddress = "192.168.10.101",
                Port = 554,
                OnvifEndpoint = "http://192.168.10.101/onvif/device_service"
            },
            new()
            {
                DeviceName = "Dahua Lab PPLG 2 (Server Room Cam)",
                Manufacturer = "Dahua Technology",
                Model = "IPC-HDBW2431E-S",
                IpAddress = "192.168.10.102",
                Port = 554,
                OnvifEndpoint = "http://192.168.10.102/onvif/device_service"
            }
        };
    }

    public async Task<bool> ProcessGatewayHeartbeatAsync(string authenticatedGatewayId, EdgeGatewayHeartbeatRequest request)
    {
        ValidateTimestampFreshness(request.Timestamp);

        var allCameras = await _context.CctvCameras.Where(c => c.IsEnabled).ToListAsync();
        var cameras = allCameras.Where(c => c.GatewayId == authenticatedGatewayId).ToList();

        foreach (var cam in cameras)
        {
            cam.LastSeenAt = DateTime.UtcNow;
            cam.UpdatedAt = DateTime.UtcNow;
            if (cam.Status == CctvCameraStatus.Offline)
            {
                cam.Status = CctvCameraStatus.Online;
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<CctvCameraResponse>> IngestGatewayDiscoveryAsync(string authenticatedGatewayId, EdgeGatewayDiscoveryRequest request)
    {
        ValidateTimestampFreshness(request.Timestamp);

        var createdOrUpdated = new List<CctvCamera>();
        var allCameras = await _context.CctvCameras.ToListAsync();

        foreach (var dev in request.DiscoveredDevices)
        {
            ValidateSsrfHost(dev.IpAddress);

            var existing = allCameras
                .FirstOrDefault(c => c.GatewayId == authenticatedGatewayId && c.Host == dev.IpAddress);


            if (existing is null)
            {
                var camera = new CctvCamera
                {
                    Id = Guid.NewGuid(),
                    GatewayId = authenticatedGatewayId,
                    Name = dev.DeviceName,
                    Location = "Lab Komputer PPLG (Discovered)",
                    Host = dev.IpAddress,
                    Port = dev.Port > 0 ? dev.Port : 554,
                    Status = CctvCameraStatus.Discovered,
                    IsEnabled = true,
                    LastSeenAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.CctvCameras.Add(camera);
                createdOrUpdated.Add(camera);
            }
            else
            {
                existing.LastSeenAt = DateTime.UtcNow;
                existing.UpdatedAt = DateTime.UtcNow;
                createdOrUpdated.Add(existing);
            }
        }

        await _context.SaveChangesAsync();
        return createdOrUpdated.Select(MapResponse).ToList();
    }

    public async Task<bool> UpdateCameraStatusAsync(Guid cameraId, string authenticatedGatewayId, CctvCameraStatus newStatus, Guid currentUserId)
    {
        var camera = await _context.CctvCameras.FirstOrDefaultAsync(c => c.Id == cameraId);
        if (camera is null) return false;

        // Enforce Gateway Ownership Boundary
        if (camera.GatewayId != authenticatedGatewayId)
        {
            throw new UnauthorizedAccessException("Gagal: Gateway tidak memiliki hak akses terhadap kamera milik gateway lain.");
        }

        // Validate Explicit State Machine Transitions
        ValidateStateTransition(camera.Status, newStatus);

        camera.Status = newStatus;
        camera.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    private static void ValidateTimestampFreshness(DateTime timestamp)
    {
        var now = DateTime.UtcNow;
        var diff = (now - timestamp.ToUniversalTime()).Duration();

        if (diff > ClockSkewTolerance)
        {
            throw new InvalidOperationException("Gagal: Timestamp payload kadaluarsa atau melebihi batas toleransi skew waktu (Replay protection).");
        }
    }

    private static void ValidateStateTransition(CctvCameraStatus currentStatus, CctvCameraStatus targetStatus)
    {
        if (currentStatus == targetStatus) return;

        bool isValid = (currentStatus, targetStatus) switch
        {
            (CctvCameraStatus.Discovered, CctvCameraStatus.PendingVerification) => true,
            (CctvCameraStatus.Discovered, CctvCameraStatus.Error) => true,
            (CctvCameraStatus.PendingVerification, CctvCameraStatus.Online) => true,
            (CctvCameraStatus.PendingVerification, CctvCameraStatus.Error) => true,
            (CctvCameraStatus.Online, CctvCameraStatus.Offline) => true,
            (CctvCameraStatus.Online, CctvCameraStatus.Error) => true,
            (CctvCameraStatus.Offline, CctvCameraStatus.Online) => true,
            (CctvCameraStatus.Error, CctvCameraStatus.Online) => true,
            (CctvCameraStatus.Error, CctvCameraStatus.PendingVerification) => true,
            (CctvCameraStatus.Unknown, _) => true,
            _ => false
        };

        if (!isValid)
        {
            throw new InvalidOperationException($"Gagal: Transisi status kamera dari '{currentStatus}' ke '{targetStatus}' dilarang oleh state machine backend.");
        }
    }

    private static void ValidateSsrfHost(string host)
    {
        if (string.IsNullOrWhiteSpace(host))
            throw new InvalidOperationException("Host IP/Nama domain kamera tidak boleh kosong.");

        var lowerHost = host.Trim().ToLowerInvariant();

        if (lowerHost == "localhost" || lowerHost == "127.0.0.1" || lowerHost == "0.0.0.0" || lowerHost == "169.254.169.254" || lowerHost == "::1")
        {
            throw new InvalidOperationException("Gagal: Penunjukan host internal/loopback dilarang oleh kebijakan keamanan SSRF.");
        }

        if (IPAddress.TryParse(lowerHost, out var ip))
        {
            var bytes = ip.GetAddressBytes();
            if (bytes[0] == 127 || bytes[0] == 0 || (bytes[0] == 169 && bytes[1] == 254))
            {
                throw new InvalidOperationException("Gagal: IP address dilarang oleh kebijakan keamanan SSRF.");
            }
        }
    }

    private static CctvCameraResponse MapResponse(CctvCamera c) => new()
    {
        Id = c.Id,
        GatewayId = c.GatewayId,
        Name = c.Name,
        Location = c.Location,
        Description = c.Description,
        IsEnabled = c.IsEnabled,
        Host = c.Host,
        Port = c.Port,
        PlaybackUrl = $"/camera/{c.Id}/whep",
        Status = c.Status,
        LastSeenAt = c.LastSeenAt,
        CreatedAt = c.CreatedAt
    };

    private static (string EncryptedText, string Base64Iv) EncryptString(string plainText)
    {
        if (string.IsNullOrEmpty(plainText)) return (string.Empty, string.Empty);

        using var aes = Aes.Create();
        aes.Key = AesMasterKey;
        aes.GenerateIV();

        using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
        var plainBytes = Encoding.UTF8.GetBytes(plainText);
        var cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);

        return (Convert.ToBase64String(cipherBytes), Convert.ToBase64String(aes.IV));
    }
}
