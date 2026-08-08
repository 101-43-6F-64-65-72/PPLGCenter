using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IReportCardService
{
    Task<ReportCardSummaryResponse> GetStudentReportCardSummaryAsync(Guid studentId, Guid? semesterId = null);
}
