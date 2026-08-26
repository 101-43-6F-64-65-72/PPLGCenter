using System;

namespace StudentCenter.Domain.Entities;

public class QuizSession
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public DateOnly TargetDate { get; set; }
    public int CurrentQuestionNumber { get; set; } = 1;
    public int LivesRemaining { get; set; } = 3;
    public int Score { get; set; } = 0;
    public int StreakCount { get; set; } = 0;
    public int MaxStreakInSession { get; set; } = 0;
    public int TotalCorrect { get; set; } = 0;
    public int TotalWrong { get; set; } = 0;
    public string Status { get; set; } = "Active"; // Active, Completed, GameOver
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? FinishedAt { get; set; }

    // Navigation
    public virtual User? User { get; set; }
}
