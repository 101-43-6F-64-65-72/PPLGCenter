using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IEmailService
{
    Task<SendEmailResult> SendEmailAsync(
        string to,
        string subject,
        string body,
        bool isHtml = true,
        Guid? recipientUserId = null,
        Guid? createdByUserId = null);

    Task<PagedResult<EmailLogResponse>> GetEmailLogsAsync(int page = 1, int pageSize = 20, string? search = null);

    Task<EmailLogResponse?> GetEmailLogByIdAsync(Guid id);

    EmailConfigStatusResponse GetConfigStatus();
}
