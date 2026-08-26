using System;

namespace StudentCenter.Domain.Entities;

public class UserQuizStat
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public int TotalScore { get; set; } = 0;
    public int TotalQuizzesPlayed { get; set; } = 0;
    public int CurrentStreak { get; set; } = 0;
    public int HighestStreak { get; set; } = 0;
    public DateOnly? LastPlayedDate { get; set; }
    public int TotalCorrectAnswers { get; set; } = 0;
    public int TotalWrongAnswers { get; set; } = 0;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public virtual User? User { get; set; }
}
