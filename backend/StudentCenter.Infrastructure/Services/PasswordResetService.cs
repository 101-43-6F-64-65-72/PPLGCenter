using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class PasswordResetService : IPasswordResetService
{
    private readonly AppDbContext _context;
    private readonly PasswordHasher<User> _passwordHasher;

    public PasswordResetService(AppDbContext context)
    {
        _context = context;
        _passwordHasher = new PasswordHasher<User>();
    }

    public async Task<CreatePasswordResetResponse> CreateResetRequestAsync(CreatePasswordResetRequest request)
    {
        var identifier = request.Identifier.Trim().ToLower();

        var user = await _context.Users
            .FirstOrDefaultAsync(u =>
                (u.NIS != null && u.NIS.ToLower() == identifier) ||
                (u.NISN != null && u.NISN.ToLower() == identifier) ||
                (u.NIP != null && u.NIP.ToLower() == identifier) ||
                (u.Username != null && u.Username.ToLower() == identifier) ||
                u.Email.ToLower() == identifier);

        if (user is null)
        {
            throw new KeyNotFoundException("Pengguna dengan identitas tersebut tidak ditemukan.");
        }

        // Cancel any previous pending requests for this user
        var existingPending = await _context.PasswordResetRequests
            .Where(r => r.UserId == user.Id && r.Status == PasswordResetStatus.Pending)
            .ToListAsync();

        foreach (var req in existingPending)
        {
            req.Status = PasswordResetStatus.Expired;
            req.UpdatedAt = DateTime.UtcNow;
        }

        var randomToken = Convert.ToHexString(Guid.NewGuid().ToByteArray()) + Convert.ToHexString(Guid.NewGuid().ToByteArray());
        var tokenHash = HashToken(randomToken);
        var expiresAt = DateTime.UtcNow.AddHours(24);

        var newRequest = new PasswordResetRequest
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            ResetTokenHash = tokenHash,
            Status = PasswordResetStatus.Pending,
            Reason = request.Reason?.Trim(),
            ExpiresAt = expiresAt,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.PasswordResetRequests.Add(newRequest);
        await _context.SaveChangesAsync();

        return new CreatePasswordResetResponse
        {
            RequestId = newRequest.Id,
            ExpiresAt = expiresAt,
            Message = "Permohonan reset password berhasil diajukan. Silakan tunggu persetujuan Admin."
        };
    }

    public async Task<PasswordResetRequestResponse?> GetRequestStatusAsync(Guid requestId)
    {
        var request = await _context.PasswordResetRequests
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == requestId);

        if (request is null) return null;

        if (request.Status == PasswordResetStatus.Pending || request.Status == PasswordResetStatus.Approved)
        {
            if (request.ExpiresAt <= DateTime.UtcNow)
            {
                request.Status = PasswordResetStatus.Expired;
                request.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        var isValidForReset = request.Status == PasswordResetStatus.Approved && request.ExpiresAt > DateTime.UtcNow;

        return MapToResponse(request, isValidForReset);
    }

    public async Task<PasswordResetRequestResponse?> GetRequestStatusByIdentifierAsync(string identifier)
    {
        var idLower = identifier.Trim().ToLower();

        var user = await _context.Users
            .FirstOrDefaultAsync(u =>
                (u.NIS != null && u.NIS.ToLower() == idLower) ||
                (u.NISN != null && u.NISN.ToLower() == idLower) ||
                (u.NIP != null && u.NIP.ToLower() == idLower) ||
                (u.Username != null && u.Username.ToLower() == idLower) ||
                u.Email.ToLower() == idLower);

        if (user is null) return null;

        var request = await _context.PasswordResetRequests
            .Include(r => r.User)
            .Where(r => r.UserId == user.Id)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync();

        if (request is null) return null;

        if (request.Status == PasswordResetStatus.Pending || request.Status == PasswordResetStatus.Approved)
        {
            if (request.ExpiresAt <= DateTime.UtcNow)
            {
                request.Status = PasswordResetStatus.Expired;
                request.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        var isValidForReset = request.Status == PasswordResetStatus.Approved && request.ExpiresAt > DateTime.UtcNow;

        return MapToResponse(request, isValidForReset);
    }

    public async Task<List<PasswordResetRequestResponse>> GetPendingRequestsAsync()
    {
        var now = DateTime.UtcNow;

        var requests = await _context.PasswordResetRequests
            .Include(r => r.User)
            .Where(r => r.Status == PasswordResetStatus.Pending && r.ExpiresAt > now)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return requests.Select(r => MapToResponse(r, false)).ToList();
    }

    public async Task<bool> ReviewResetRequestAsync(Guid requestId, ReviewPasswordResetRequest request, Guid adminUserId)
    {
        var resetReq = await _context.PasswordResetRequests.FirstOrDefaultAsync(r => r.Id == requestId);
        if (resetReq is null) throw new KeyNotFoundException("Permohonan reset password tidak ditemukan.");

        if (resetReq.UserId == adminUserId)
        {
            throw new InvalidOperationException("Admin tidak dapat menyetujui permohonan reset password milik sendiri.");
        }

        if (resetReq.Status != PasswordResetStatus.Pending)
        {
            throw new InvalidOperationException("Permohonan ini sudah diproses atau tidak lagi dalam status Pending.");
        }

        if (resetReq.ExpiresAt <= DateTime.UtcNow)
        {
            resetReq.Status = PasswordResetStatus.Expired;
            resetReq.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            throw new InvalidOperationException("Permohonan ini telah kadaluwarsa.");
        }

        resetReq.Status = request.IsApproved ? PasswordResetStatus.Approved : PasswordResetStatus.Rejected;
        resetReq.AdminNotes = request.AdminNotes?.Trim();
        resetReq.ReviewedByUserId = adminUserId;
        resetReq.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ConfirmResetPasswordAsync(ConfirmResetPasswordRequest request)
    {
        PasswordResetRequest? resetReq = null;

        if (request.RequestId.HasValue)
        {
            resetReq = await _context.PasswordResetRequests
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == request.RequestId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(request.Identifier))
        {
            var idLower = request.Identifier.Trim().ToLower();
            var user = await _context.Users.FirstOrDefaultAsync(u =>
                (u.NIS != null && u.NIS.ToLower() == idLower) ||
                (u.NISN != null && u.NISN.ToLower() == idLower) ||
                (u.NIP != null && u.NIP.ToLower() == idLower) ||
                (u.Username != null && u.Username.ToLower() == idLower) ||
                u.Email.ToLower() == idLower);

            if (user != null)
            {
                resetReq = await _context.PasswordResetRequests
                    .Include(r => r.User)
                    .Where(r => r.UserId == user.Id && r.Status == PasswordResetStatus.Approved)
                    .OrderByDescending(r => r.CreatedAt)
                    .FirstOrDefaultAsync();
            }
        }

        if (resetReq is null)
        {
            throw new KeyNotFoundException("Permohonan reset password yang disetujui tidak ditemukan.");
        }

        if (resetReq.ExpiresAt <= DateTime.UtcNow)
        {
            resetReq.Status = PasswordResetStatus.Expired;
            resetReq.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            throw new InvalidOperationException("Permohonan reset password ini sudah kadaluwarsa.");
        }

        if (resetReq.Status != PasswordResetStatus.Approved)
        {
            throw new InvalidOperationException($"Permohonan ini tidak dalam status disetujui ({resetReq.Status}).");
        }

        if (resetReq.User is null)
        {
            throw new KeyNotFoundException("Pengguna tidak ditemukan.");
        }

        var newHash = _passwordHasher.HashPassword(resetReq.User, request.NewPassword);
        resetReq.User.PasswordHash = newHash;
        resetReq.User.UpdatedAt = DateTime.UtcNow;

        resetReq.Status = PasswordResetStatus.Consumed;
        resetReq.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    private static PasswordResetRequestResponse MapToResponse(PasswordResetRequest r, bool isValidForReset)
    {
        var identifier = r.User?.NIS ?? r.User?.NISN ?? r.User?.NIP ?? r.User?.Username ?? r.User?.Email ?? "-";

        return new PasswordResetRequestResponse
        {
            Id = r.Id,
            UserId = r.UserId,
            UserFullName = r.User?.FullName ?? "Pengguna",
            UserIdentifier = identifier,
            UserRole = r.User?.Role.ToString() ?? "Unknown",
            Status = r.Status,
            Reason = r.Reason,
            AdminNotes = r.AdminNotes,
            ExpiresAt = r.ExpiresAt,
            CreatedAt = r.CreatedAt,
            IsValidForReset = isValidForReset
        };
    }

    private static string HashToken(string token)
    {
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var bytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }
}
