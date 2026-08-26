using System;

namespace StudentCenter.Domain.Entities;

public class DailyQuizQuestion
{
    public Guid Id { get; set; }
    public DateOnly TargetDate { get; set; }
    public string Topic { get; set; } = string.Empty;
    public int QuestionNumber { get; set; } // 1, 2, 3, ...
    public string Difficulty { get; set; } = "easy"; // easy, medium, hard, expert
    public string QuestionText { get; set; } = string.Empty;
    public string? CodeSnippet { get; set; }
    public string OptionsJson { get; set; } = "[]"; // JSON array of 4 options
    public int CorrectAnswerIndex { get; set; } // 0, 1, 2, 3
    public string Explanation { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
