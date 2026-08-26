using System;
using System.Threading.Tasks;
using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IFeedbackService
{
    Task<FeedbackResponse> CreateFeedbackAsync(CreateFeedbackRequest request, Guid? userId, string? userName, string? userRole, string? userIdentifier);
    Task<PagedFeedbackResult> GetFeedbacksAsync(string? category, int? rating, string? status, string? search, int page, int pageSize);
    Task<PagedFeedbackResult> GetMyFeedbacksAsync(Guid userId, int page, int pageSize);
    Task<FeedbackSummaryResponse> GetFeedbackSummaryAsync();
    Task<FeedbackResponse?> UpdateFeedbackStatusAsync(Guid id, UpdateFeedbackStatusRequest request);
    Task<FeedbackResponse?> ReplyFeedbackAsync(Guid id, ReplyFeedbackRequest request, Guid adminId, string adminName);
    Task<bool> DeleteFeedbackAsync(Guid id);
}
