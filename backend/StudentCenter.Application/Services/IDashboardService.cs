using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IDashboardService
{
    Task<DashboardSummaryResponse> GetSummaryAsync();
}
