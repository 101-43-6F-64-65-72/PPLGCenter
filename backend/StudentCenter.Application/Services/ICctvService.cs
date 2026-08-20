using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Application.Services;

public interface ICctvService
{
    Task<List<CctvCameraResponse>> GetCamerasAsync(Guid currentUserId);
    Task<CctvCameraResponse?> GetCameraByIdAsync(Guid id, Guid currentUserId);
    Task<CctvCameraResponse> CreateCameraAsync(CreateCctvCameraRequest request, Guid currentUserId);
    Task<bool> ToggleCameraStatusAsync(Guid id, bool isEnabled, Guid currentUserId);
    Task<bool> DeleteCameraAsync(Guid id, Guid currentUserId);
    Task<List<DiscoveredCameraResponse>> DiscoverCamerasAsync(Guid currentUserId);

    // Machine Authentication & Edge Gateway telemetry methods
    Task<bool> ProcessGatewayHeartbeatAsync(string authenticatedGatewayId, EdgeGatewayHeartbeatRequest request);
    Task<List<CctvCameraResponse>> IngestGatewayDiscoveryAsync(string authenticatedGatewayId, EdgeGatewayDiscoveryRequest request);
    Task<bool> UpdateCameraStatusAsync(Guid cameraId, string authenticatedGatewayId, CctvCameraStatus newStatus, Guid currentUserId);
}
