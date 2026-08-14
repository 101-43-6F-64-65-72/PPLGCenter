using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IPasswordResetService
{
    Task<CreatePasswordResetResponse> CreateResetRequestAsync(CreatePasswordResetRequest request);
    Task<PasswordResetRequestResponse?> GetRequestStatusAsync(Guid requestId);
    Task<PasswordResetRequestResponse?> GetRequestStatusByIdentifierAsync(string identifier);
    Task<List<PasswordResetRequestResponse>> GetPendingRequestsAsync();
    Task<bool> ReviewResetRequestAsync(Guid requestId, ReviewPasswordResetRequest request, Guid adminUserId);
    Task<bool> ConfirmResetPasswordAsync(ConfirmResetPasswordRequest request);
}
