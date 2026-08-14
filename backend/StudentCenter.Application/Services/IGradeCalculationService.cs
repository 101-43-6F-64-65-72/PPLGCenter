using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Application.Services;

public interface IGradeCalculationService
{
    Task<(string LetterGrade, string Predicate)> GetGradeScaleAsync(decimal score);
    (string LetterGrade, string Predicate) MatchGradeScale(decimal score, IEnumerable<GradeScale> scales);
    
    decimal CalculateWeightedSubjectScore(
        IEnumerable<StudentGrade> studentGrades, 
        IEnumerable<Assessment> assessments, 
        IEnumerable<GradeCategory> categories);

    List<GradebookStudentRow> CalculateClassRankings(List<GradebookStudentRow> studentRows);

    bool DeterminePassStatus(decimal score, decimal passingThreshold = 60.0m);

    decimal CalculateGpa(decimal averageScore);
}
