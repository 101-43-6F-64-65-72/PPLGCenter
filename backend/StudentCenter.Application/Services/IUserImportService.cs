using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IUserImportService
{
    Task<ImportSummaryResponse> ImportStudentsCsvAsync(string csvContent);
    Task<ImportSummaryResponse> ImportTeachersCsvAsync(string csvContent);
    Task<byte[]> ExportStudentsCsvAsync(Guid? classId = null, Guid? departmentId = null);
}
