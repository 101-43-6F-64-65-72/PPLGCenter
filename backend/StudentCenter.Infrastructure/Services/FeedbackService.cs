using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class FeedbackService : IFeedbackService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IEmailService _emailService;
    private readonly ILogger<FeedbackService> _logger;

    public FeedbackService(
        AppDbContext context,
        INotificationService notificationService,
        IEmailService emailService,
        ILogger<FeedbackService> logger)
    {
        _context = context;
        _notificationService = notificationService;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<FeedbackResponse> CreateFeedbackAsync(CreateFeedbackRequest request, Guid? userId, string? userName, string? userRole, string? userIdentifier)
    {
        var feedback = new Feedback
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            UserName = request.IsAnonymous ? "Anonim" : (userName ?? "Warga Sekolah"),
            UserIdentifier = request.IsAnonymous ? null : userIdentifier,
            UserRole = request.IsAnonymous ? "Anonim" : (userRole ?? "Student"),
            Category = string.IsNullOrWhiteSpace(request.Category) ? "Fitur" : request.Category.Trim(),
            Rating = Math.Clamp(request.Rating, 1, 5),
            Content = request.Content.Trim(),
            IsAnonymous = request.IsAnonymous,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.Feedbacks.Add(feedback);
        await _context.SaveChangesAsync();

        // 1. Send In-App Notification and Email to all Administrators
        try
        {
            var admins = await _context.Users
                .AsNoTracking()
                .Where(u => u.IsActive && u.Role == UserRole.Admin)
                .ToListAsync();

            var snippet = feedback.Content.Length > 80 ? feedback.Content[..80] + "..." : feedback.Content;
            var senderDisplay = feedback.IsAnonymous ? "Anonim (Disembunyikan)" : $"{feedback.UserName} ({feedback.UserRole})";

            foreach (var admin in admins)
            {
                // In-App Notification for Admin
                try
                {
                    await _notificationService.NotifyUserAsync(
                        admin.Id,
                        "Umpan Balik Baru Masuk",
                        $"Masukan baru [{feedback.Category} • {feedback.Rating}★] dari {senderDisplay}: \"{snippet}\"",
                        NotificationType.System,
                        NotificationPriority.Normal,
                        feedback.Id.ToString(),
                        NotificationReferenceType.None,
                        "/admin",
                        "MessageSquareHeart",
                        "#2C1EE8"
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Gagal mengirim in-app notifikasi ke admin {AdminId}", admin.Id);
                }

                // Email Notification for Admin
                try
                {
                    var targetAdminEmail = !string.IsNullOrWhiteSpace(admin.EmailNotif) ? admin.EmailNotif : admin.Email;
                    if (!string.IsNullOrWhiteSpace(targetAdminEmail))
                    {
                        var adminEmailHtml = $@"
                        <div style='font-family: ""Plus Jakarta Sans"", Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);'>
                            <div style='background: linear-gradient(135deg, #2c1ee8 0%, #1e10c4 100%); padding: 28px 24px; text-align: center; color: white;'>
                                <div style='display: inline-block; background-color: rgba(255,255,255,0.15); padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;'>PANEL ADMINISTRATOR</div>
                                <h2 style='margin: 0; font-size: 22px; font-weight: 800;'>Umpan Balik Baru Masuk</h2>
                                <p style='margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;'>PPLG Center - SMK Negeri 2 Surakarta</p>
                            </div>
                            <div style='padding: 28px 24px;'>
                                <p style='color: #0f172a; font-size: 15px; margin-top: 0;'>Halo <strong>{admin.FullName}</strong>,</p>
                                <p style='color: #475569; font-size: 14px; line-height: 1.6;'>Ada umpan balik / masukan baru yang masuk ke sistem dari warga sekolah:</p>
                                
                                <div style='background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2c1ee8; padding: 16px; margin: 18px 0; border-radius: 12px;'>
                                    <table style='width: 100%; border-collapse: collapse; font-size: 13px;'>
                                        <tr>
                                            <td style='padding: 4px 0; color: #64748b; font-weight: bold; width: 110px;'>Pengirim:</td>
                                            <td style='padding: 4px 0; color: #0f172a; font-weight: 600;'>{senderDisplay}</td>
                                        </tr>
                                        <tr>
                                            <td style='padding: 4px 0; color: #64748b; font-weight: bold;'>Kategori:</td>
                                            <td style='padding: 4px 0; color: #0f172a; font-weight: 600;'>{feedback.Category}</td>
                                        </tr>
                                        <tr>
                                            <td style='padding: 4px 0; color: #64748b; font-weight: bold;'>Rating:</td>
                                            <td style='padding: 4px 0; color: #d97706; font-weight: 800;'>{feedback.Rating} dari 5 Bintang ⭐</td>
                                        </tr>
                                    </table>
                                    <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 12px 0;' />
                                    <div style='font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase;'>Isi Umpan Balik:</div>
                                    <p style='margin: 6px 0 0 0; font-size: 14px; color: #1e293b; line-height: 1.6; font-style: italic;'>""{feedback.Content}""</p>
                                </div>

                                <div style='text-align: center; margin-top: 30px; margin-bottom: 10px;'>
                                    <a href='https://pplgcenter.sch.id/admin' style='display: inline-block; background-color: #2c1ee8; color: #ffffff; padding: 12px 28px; border-radius: 14px; text-decoration: none; font-weight: 800; font-size: 14px; box-shadow: 0 4px 12px rgba(44, 30, 232, 0.3);'>Buka Panel Admin & Beri Tanggapan</a>
                                </div>
                            </div>
                            <div style='background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8;'>
                                © {DateTime.UtcNow.Year} SMK Negeri 2 Surakarta • PPLG Center System
                            </div>
                        </div>";

                        await _emailService.SendEmailAsync(
                            targetAdminEmail,
                            $"[PPLG Center] Umpan Balik Baru ({feedback.Category} • {feedback.Rating}★) - SMK Negeri 2 Surakarta",
                            adminEmailHtml,
                            isHtml: true,
                            recipientUserId: admin.Id
                        );
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Gagal mengirim email notifikasi ke admin {AdminId}", admin.Id);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Gagal memproses broadcast notifikasi feedback ke Admin");
        }

        // 2. Send Confirmation In-App Notification and Email to Submitting User
        if (userId.HasValue)
        {
            try
            {
                await _notificationService.NotifyUserAsync(
                    userId.Value,
                    "Umpan Balik Berhasil Terkirim",
                    $"Masukan Anda kategori '{feedback.Category}' telah berhasil kami terima dan sedang dalam antrean peninjauan oleh tim Administrator.",
                    NotificationType.System,
                    NotificationPriority.Normal,
                    feedback.Id.ToString(),
                    NotificationReferenceType.None,
                    "/umpan-balik",
                    "CheckCircle2",
                    "#10B981"
                );
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Gagal mengirim in-app konfirmasi ke user {UserId}", userId.Value);
            }

            if (!feedback.IsAnonymous)
            {
                try
                {
                    var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId.Value);
                    var userEmail = !string.IsNullOrWhiteSpace(user?.EmailNotif) ? user.EmailNotif : user?.Email;
                    if (!string.IsNullOrWhiteSpace(userEmail))
                    {
                        var userEmailHtml = $@"
                        <div style='font-family: ""Plus Jakarta Sans"", Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);'>
                            <div style='background: linear-gradient(135deg, #2c1ee8 0%, #1e10c4 100%); padding: 28px 24px; text-align: center; color: white;'>
                                <div style='display: inline-block; background-color: rgba(255,255,255,0.15); padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;'>SMK NEGERI 2 SURAKARTA</div>
                                <h2 style='margin: 0; font-size: 22px; font-weight: 800;'>Umpan Balik Diterima</h2>
                                <p style='margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;'>PPLG Center Information & Feedback System</p>
                            </div>
                            <div style='padding: 28px 24px;'>
                                <p style='color: #0f172a; font-size: 15px; margin-top: 0;'>Halo <strong>{feedback.UserName}</strong>,</p>
                                <p style='color: #475569; font-size: 14px; line-height: 1.6;'>Terima kasih banyak atas partisipasimu! Masukanmu sangat berharga bagi kami untuk terus menyempurnakan fasilitas dan layanan PPLG Center.</p>
                                
                                <div style='background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #10b981; padding: 14px 16px; margin: 18px 0; border-radius: 12px;'>
                                    <div style='font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase;'>Ringkasan Masukan Anda ({feedback.Category} • {feedback.Rating}★):</div>
                                    <p style='margin: 6px 0 0 0; font-size: 13px; color: #334155; font-style: italic; line-height: 1.5;'>""{feedback.Content}""</p>
                                </div>

                                <p style='color: #64748b; font-size: 13px;'>Anda akan otomatis menerima notifikasi dan email begitu tim Administrator memberikan tanggapan resmi.</p>

                                <div style='text-align: center; margin-top: 26px; margin-bottom: 10px;'>
                                    <a href='https://pplgcenter.sch.id/umpan-balik' style='display: inline-block; background-color: #2c1ee8; color: #ffffff; padding: 12px 28px; border-radius: 14px; text-decoration: none; font-weight: 800; font-size: 14px;'>Lihat Riwayat Masukan</a>
                                </div>
                            </div>
                            <div style='background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8;'>
                                © {DateTime.UtcNow.Year} SMK Negeri 2 Surakarta • PPLG Center System
                            </div>
                        </div>";

                        await _emailService.SendEmailAsync(
                            userEmail,
                            "[PPLG Center] Konfirmasi Pengiriman Umpan Balik - SMK Negeri 2 Surakarta",
                            userEmailHtml,
                            isHtml: true,
                            recipientUserId: userId.Value
                        );
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Gagal mengirim email konfirmasi ke user {UserId}", userId.Value);
                }
            }
        }

        return MapToResponse(feedback);
    }

    public async Task<PagedFeedbackResult> GetFeedbacksAsync(string? category, int? rating, string? status, string? search, int page, int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.Feedbacks.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(category) && category != "All" && category != "Semua")
        {
            query = query.Where(f => f.Category.ToLower() == category.ToLower());
        }

        if (rating.HasValue && rating.Value > 0)
        {
            query = query.Where(f => f.Rating == rating.Value);
        }

        if (!string.IsNullOrWhiteSpace(status) && status != "All" && status != "Semua")
        {
            query = query.Where(f => f.Status.ToLower() == status.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower().Trim();
            query = query.Where(f => f.Content.ToLower().Contains(s) ||
                                     (f.UserName != null && f.UserName.ToLower().Contains(s)) ||
                                     (f.UserIdentifier != null && f.UserIdentifier.ToLower().Contains(s)) ||
                                     (f.Category != null && f.Category.ToLower().Contains(s)));
        }

        var totalItems = await query.CountAsync();
        var items = await query
            .OrderByDescending(f => f.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedFeedbackResult
        {
            Items = items.Select(f =>
            {
                var resp = MapToResponse(f);
                if (f.IsAnonymous)
                {
                    resp.UserId = null;
                    resp.UserName = "Anonim";
                    resp.UserIdentifier = null;
                    resp.UserRole = "Anonim";
                }
                return resp;
            }).ToList(),
            TotalItems = totalItems,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
        };
    }

    public async Task<PagedFeedbackResult> GetMyFeedbacksAsync(Guid userId, int page, int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = _context.Feedbacks
            .AsNoTracking()
            .Where(f => f.UserId == userId);

        var totalItems = await query.CountAsync();
        var items = await query
            .OrderByDescending(f => f.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedFeedbackResult
        {
            Items = items.Select(MapToResponse).ToList(),
            TotalItems = totalItems,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
        };
    }

    public async Task<FeedbackSummaryResponse> GetFeedbackSummaryAsync()
    {
        var feedbacks = await _context.Feedbacks.AsNoTracking().ToListAsync();

        var totalCount = feedbacks.Count;
        var averageRating = totalCount > 0 ? Math.Round(feedbacks.Average(f => f.Rating), 1) : 5.0;
        var pendingCount = feedbacks.Count(f => f.Status.Equals("Pending", StringComparison.OrdinalIgnoreCase));
        var reviewedCount = feedbacks.Count(f => f.Status.Equals("Reviewed", StringComparison.OrdinalIgnoreCase));
        var resolvedCount = feedbacks.Count(f => f.Status.Equals("Resolved", StringComparison.OrdinalIgnoreCase));

        var categoryBreakdown = feedbacks
            .GroupBy(f => f.Category ?? "Lainnya")
            .ToDictionary(g => g.Key, g => g.Count());

        var ratingBreakdown = feedbacks
            .GroupBy(f => f.Rating)
            .ToDictionary(g => g.Key, g => g.Count());

        return new FeedbackSummaryResponse
        {
            TotalCount = totalCount,
            AverageRating = averageRating,
            PendingCount = pendingCount,
            ReviewedCount = reviewedCount,
            ResolvedCount = resolvedCount,
            CategoryBreakdown = categoryBreakdown,
            RatingBreakdown = ratingBreakdown
        };
    }

    public async Task<FeedbackResponse?> UpdateFeedbackStatusAsync(Guid id, UpdateFeedbackStatusRequest request)
    {
        var feedback = await _context.Feedbacks.FindAsync(id);
        if (feedback == null) return null;

        feedback.Status = request.Status.Trim();
        if (request.AdminNotes != null)
        {
            feedback.AdminNotes = request.AdminNotes.Trim();
        }
        feedback.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToResponse(feedback);
    }

    public async Task<FeedbackResponse?> ReplyFeedbackAsync(Guid id, ReplyFeedbackRequest request, Guid adminId, string adminName)
    {
        var feedback = await _context.Feedbacks.FindAsync(id);
        if (feedback == null) return null;

        feedback.AdminReply = request.AdminReply.Trim();
        feedback.RepliedAt = DateTime.UtcNow;
        feedback.RepliedByAdminName = string.IsNullOrWhiteSpace(adminName) ? "Administrator" : adminName;
        feedback.Status = string.IsNullOrWhiteSpace(request.Status) ? "Resolved" : request.Status.Trim();
        feedback.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // 1. Dispatch In-App Notification if user is linked (Works for both regular & anonymous!)
        if (feedback.UserId.HasValue)
        {
            try
            {
                var snippet = request.AdminReply.Length > 80 ? request.AdminReply[..80] + "..." : request.AdminReply;
                await _notificationService.NotifyUserAsync(
                    feedback.UserId.Value,
                    "Umpan Balik Anda Telah Ditanggapi",
                    $"Admin telah membalas masukan{(feedback.IsAnonymous ? " anonim" : "")} kategori '{feedback.Category}': \"{snippet}\"",
                    NotificationType.System,
                    NotificationPriority.Normal,
                    feedback.Id.ToString(),
                    NotificationReferenceType.None,
                    "/umpan-balik",
                    "MessageSquareHeart",
                    "#2C1EE8"
                );
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Gagal mengirim in-app notifikasi untuk balasan feedback {FeedbackId}", id);
            }

            // 2. Dispatch Email Notification if requested and user has email
            if (request.SendEmailNotification)
            {
                try
                {
                    var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == feedback.UserId.Value);
                    var targetEmail = !string.IsNullOrWhiteSpace(user?.EmailNotif) ? user.EmailNotif : user?.Email;
                    if (!string.IsNullOrWhiteSpace(targetEmail))
                    {
                        var greetingName = feedback.IsAnonymous ? "Warga SMKN 2 Surakarta" : feedback.UserName;
                        var htmlBody = $@"
                        <div style='font-family: ""Plus Jakarta Sans"", Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);'>
                            <div style='background: linear-gradient(135deg, #2c1ee8 0%, #1e10c4 100%); padding: 28px 24px; text-align: center; color: white;'>
                                <div style='display: inline-block; background-color: rgba(255,255,255,0.15); padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;'>SMK NEGERI 2 SURAKARTA</div>
                                <h2 style='margin: 0; font-size: 22px; font-weight: 800;'>Tanggapan Umpan Balik</h2>
                                <p style='margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;'>PPLG Center Information & Feedback System</p>
                            </div>
                            <div style='padding: 28px 24px;'>
                                <p style='color: #0f172a; font-size: 15px; margin-top: 0;'>Halo <strong>{greetingName}</strong>,</p>
                                <p style='color: #475569; font-size: 14px; line-height: 1.6;'>Terima kasih telah meluangkan waktu untuk menyampaikan masukan kepada kami. Berikut adalah tanggapan resmi dari tim Administrator atas masukan{(feedback.IsAnonymous ? " (Kirim Anonim)" : "")} yang Anda kirimkan:</p>
                                
                                <div style='background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #94a3b8; padding: 14px 16px; margin: 18px 0; border-radius: 12px;'>
                                    <div style='font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase;'>Masukan Anda ({feedback.Category} • {feedback.Rating}★{(feedback.IsAnonymous ? " • Anonim" : "")}):</div>
                                    <p style='margin: 6px 0 0 0; font-size: 13px; color: #334155; font-style: italic; line-height: 1.5;'>""{feedback.Content}""</p>
                                </div>

                                <div style='background-color: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #2c1ee8; padding: 16px; margin: 18px 0; border-radius: 12px;'>
                                    <div style='font-size: 11px; color: #1d4ed8; font-weight: 800; text-transform: uppercase;'>Balasan Administrator ({feedback.RepliedByAdminName}):</div>
                                    <p style='margin: 8px 0 0 0; font-size: 14px; color: #1e293b; line-height: 1.6; font-weight: 500;'>{request.AdminReply}</p>
                                </div>

                                <div style='text-align: center; margin-top: 30px; margin-bottom: 10px;'>
                                    <a href='https://pplgcenter.sch.id/umpan-balik' style='display: inline-block; background-color: #2c1ee8; color: #ffffff; padding: 12px 28px; border-radius: 14px; text-decoration: none; font-weight: 800; font-size: 14px; box-shadow: 0 4px 12px rgba(44, 30, 232, 0.3);'>Buka Kotak Umpan Balik</a>
                                </div>
                            </div>
                            <div style='background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8;'>
                                © {DateTime.UtcNow.Year} SMK Negeri 2 Surakarta • PPLG Center System
                            </div>
                        </div>";

                        await _emailService.SendEmailAsync(
                            targetEmail,
                            "[PPLG Center] Tanggapan atas Umpan Balik Anda - SMK Negeri 2 Surakarta",
                            htmlBody,
                            isHtml: true,
                            recipientUserId: feedback.UserId.Value,
                            createdByUserId: adminId
                        );
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Gagal mengirim email notifikasi untuk balasan feedback {FeedbackId}", id);
                }
            }
        }

        return MapToResponse(feedback);
    }

    public async Task<bool> DeleteFeedbackAsync(Guid id)
    {
        var feedback = await _context.Feedbacks.FindAsync(id);
        if (feedback == null) return false;

        _context.Feedbacks.Remove(feedback);
        await _context.SaveChangesAsync();
        return true;
    }

    private static FeedbackResponse MapToResponse(Feedback f)
    {
        return new FeedbackResponse
        {
            Id = f.Id,
            UserId = f.UserId,
            UserName = f.IsAnonymous ? "Anonim" : (f.UserName ?? "Warga Sekolah"),
            UserIdentifier = f.IsAnonymous ? null : f.UserIdentifier,
            UserRole = f.UserRole ?? "Student",
            Category = f.Category,
            Rating = f.Rating,
            Content = f.Content,
            IsAnonymous = f.IsAnonymous,
            Status = f.Status,
            AdminNotes = f.AdminNotes,
            AdminReply = f.AdminReply,
            RepliedAt = f.RepliedAt,
            RepliedByAdminName = f.RepliedByAdminName,
            CreatedAt = f.CreatedAt,
            UpdatedAt = f.UpdatedAt
        };
    }
}
