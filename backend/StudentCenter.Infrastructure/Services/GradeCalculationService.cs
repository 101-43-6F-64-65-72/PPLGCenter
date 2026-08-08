using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class GradeCalculationService : IGradeCalculationService
{
    private readonly AppDbContext _context;

    public GradeCalculationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<(string LetterGrade, string Predicate)> GetGradeScaleAsync(decimal score)
    {
        var activeScales = await _context.GradeScales
            .AsNoTracking()
            .Where(s => s.IsActive)
            .OrderByDescending(s => s.Minimum)
            .ToListAsync();

        return MatchGradeScale(score, activeScales);
    }

    public (string LetterGrade, string Predicate) MatchGradeScale(decimal score, IEnumerable<GradeScale> scales)
    {
        var roundedScore = Math.Round(score, 2);
        var scaleList = scales.Where(s => s.IsActive).OrderByDescending(s => s.Minimum).ToList();

        if (!scaleList.Any())
        {
            // Default fallback scale if DB table is empty
            if (roundedScore >= 90.0m) return ("A", "Sangat Baik");
            if (roundedScore >= 80.0m) return ("B", "Baik");
            if (roundedScore >= 70.0m) return ("C", "Cukup");
            if (roundedScore >= 60.0m) return ("D", "Kurang");
            return ("E", "Sangat Kurang");
        }

        foreach (var s in scaleList)
        {
            if (roundedScore >= s.Minimum && roundedScore <= s.Maximum)
            {
                return (s.Letter, s.Predicate);
            }
        }

        // If score exceeds max or is below min
        var highest = scaleList.First();
        var lowest = scaleList.Last();

        if (roundedScore > highest.Maximum) return (highest.Letter, highest.Predicate);
        return (lowest.Letter, lowest.Predicate);
    }

    public decimal CalculateWeightedSubjectScore(
        IEnumerable<StudentGrade> studentGrades, 
        IEnumerable<Assessment> assessments, 
        IEnumerable<GradeCategory> categories)
    {
        var gradeList = studentGrades.Where(g => g.IsPublished || true).ToList();
        var assessmentMap = assessments.ToDictionary(a => a.Id);
        var categoryMap = categories.ToDictionary(c => c.Id);

        if (!gradeList.Any())
            return 0.0m;

        // Group student grades by GradeCategory
        var categoryScores = new List<(decimal Weight, decimal CategoryAverage)>();
        var gradesByCategory = gradeList
            .Where(g => assessmentMap.ContainsKey(g.AssessmentId))
            .GroupBy(g => assessmentMap[g.AssessmentId].GradeCategoryId);

        decimal totalAssignedWeight = 0.0m;

        foreach (var group in gradesByCategory)
        {
            var categoryId = group.Key;
            if (!categoryMap.TryGetValue(categoryId, out var cat))
                continue;

            // Calculate assessment scores in this category
            var assessmentScores = new List<decimal>();
            foreach (var g in group)
            {
                var ass = assessmentMap[g.AssessmentId];
                // Percentage score normalized to 100
                decimal normalizedScore = ass.MaxScore > 0 
                    ? (g.RawScore / ass.MaxScore) * 100.0m 
                    : g.RawScore;
                
                assessmentScores.Add(normalizedScore);
            }

            if (assessmentScores.Any())
            {
                decimal catAvg = assessmentScores.Average();
                decimal catWeight = cat.Weight;
                categoryScores.Add((catWeight, catAvg));
                totalAssignedWeight += catWeight;
            }
        }

        if (!categoryScores.Any() || totalAssignedWeight <= 0)
            return 0.0m;

        // Weighted sum
        decimal weightedSum = categoryScores.Sum(cs => cs.CategoryAverage * (cs.Weight / totalAssignedWeight));
        return Math.Round(weightedSum, 2);
    }

    public List<GradebookStudentRow> CalculateClassRankings(List<GradebookStudentRow> studentRows)
    {
        if (!studentRows.Any()) return studentRows;

        var sorted = studentRows
            .OrderByDescending(r => r.FinalSubjectScore)
            .ThenBy(r => r.StudentName)
            .ToList();

        int currentRank = 1;
        for (int i = 0; i < sorted.Count; i++)
        {
            if (i > 0 && Math.Abs(sorted[i].FinalSubjectScore - sorted[i - 1].FinalSubjectScore) > 0.01m)
            {
                currentRank = i + 1;
            }
            sorted[i].ClassRank = currentRank;
        }

        return sorted;
    }

    public bool DeterminePassStatus(decimal score, decimal passingThreshold = 60.0m)
    {
        return Math.Round(score, 2) >= passingThreshold;
    }

    public decimal CalculateGpa(decimal averageScore)
    {
        // 4.0 GPA scale conversion
        if (averageScore >= 90.0m) return 4.0m;
        if (averageScore >= 85.0m) return 3.75m;
        if (averageScore >= 80.0m) return 3.5m;
        if (averageScore >= 75.0m) return 3.0m;
        if (averageScore >= 70.0m) return 2.75m;
        if (averageScore >= 65.0m) return 2.5m;
        if (averageScore >= 60.0m) return 2.0m;
        if (averageScore >= 50.0m) return 1.0m;
        return 0.0m;
    }
}
