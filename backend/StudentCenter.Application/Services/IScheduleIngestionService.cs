using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IScheduleIngestionService
{
    Task<ImportSummaryResponse> ImportWeeklyAgendaCsvAsync(string csvContent);
    Task<ImportSummaryResponse> ImportDailyTimetableCsvAsync(string csvContent);
}
