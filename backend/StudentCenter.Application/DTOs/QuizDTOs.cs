using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class ProposeTopicRequest
{
    [Required(ErrorMessage = "Tanggal pelaksanaan wajib diisi")]
    public DateOnly TargetDate { get; set; }

    [Required(ErrorMessage = "Nama tema wajib diisi")]
    [MaxLength(200, ErrorMessage = "Nama tema maksimal 200 karakter")]
    public string TopicName { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Deskripsi maksimal 1000 karakter")]
    public string? Description { get; set; }
}

public class TopicResponse
{
    public Guid Id { get; set; }
    public DateOnly TargetDate { get; set; }
    public string TopicName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? ProposedByUserId { get; set; }
    public string ProposedByUserName { get; set; } = "Guru RPL";
    public int VotesCount { get; set; }
    public string Status { get; set; } = "Draft"; // Draft, Voting, Selected, Fallback
    public bool HasVotedByMe { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TodayQuizInfoResponse
{
    public DateOnly TargetDate { get; set; }
    public string Topic { get; set; } = string.Empty;
    public string TopicDescription { get; set; } = string.Empty;
    public int TotalParticipantsToday { get; set; }
    public int AvailableQuestionsCount { get; set; }
    public bool HasActiveSession { get; set; }
    public bool HasCompletedToday { get; set; }
    public QuizSessionSummaryResponse? ActiveSession { get; set; }
    public UserQuizProfileResponse? UserProfile { get; set; }
}

public class StartQuizResponse
{
    public Guid SessionId { get; set; }
    public DateOnly TargetDate { get; set; }
    public string Topic { get; set; } = string.Empty;
    public int LivesRemaining { get; set; } = 3;
    public int Score { get; set; } = 0;
    public int CurrentQuestionNumber { get; set; } = 1;
    public ClientQuestionResponse? FirstQuestion { get; set; }
}

public class ClientQuestionResponse
{
    public Guid Id { get; set; }
    public int QuestionNumber { get; set; }
    public string Difficulty { get; set; } = "easy"; // easy, medium, hard, expert
    public string QuestionText { get; set; } = string.Empty;
    public string? CodeSnippet { get; set; }
    public List<string> Options { get; set; } = new();
    public int TimeLimitSeconds { get; set; } = 30;
}

public class SubmitAnswerRequest
{
    [Range(1, 1000)]
    public int QuestionNumber { get; set; }

    [Range(0, 3, ErrorMessage = "Pilihan jawaban harus indeks 0 sampai 3")]
    public int SelectedOptionIndex { get; set; }

    public int TimeTakenSeconds { get; set; } = 10;
}

public class SubmitAnswerResponse
{
    public bool IsCorrect { get; set; }
    public int CorrectOptionIndex { get; set; }
    public string Explanation { get; set; } = string.Empty;
    public int PointsAwarded { get; set; }
    public int ComboMultiplier { get; set; } = 1;
    public int NewScore { get; set; }
    public int LivesRemaining { get; set; }
    public bool IsGameOver { get; set; }
    public int HighestQuestionReached { get; set; }
    public ClientQuestionResponse? NextQuestion { get; set; }
}

public class QuizSessionSummaryResponse
{
    public Guid SessionId { get; set; }
    public DateOnly TargetDate { get; set; }
    public int Score { get; set; }
    public int LivesRemaining { get; set; }
    public int CurrentQuestionNumber { get; set; }
    public int TotalCorrect { get; set; }
    public int TotalWrong { get; set; }
    public string Status { get; set; } = "Active"; // Active, Completed, GameOver
    public DateTime StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
}

public class QuizLeaderboardItemResponse
{
    public int Rank { get; set; }
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? UserIdentifier { get; set; } // NISN / NIP
    public string? PhotoUrl { get; set; }
    public string? ClassName { get; set; }
    public int Score { get; set; }
    public int HighestQuestionReached { get; set; }
    public int MaxStreak { get; set; }
    public DateTime FinishedAt { get; set; }
}

public class UserQuizProfileResponse
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public int TotalScore { get; set; }
    public int CurrentStreak { get; set; }
    public int HighestStreak { get; set; }
    public int TotalQuizzesPlayed { get; set; }
    public int TotalCorrectAnswers { get; set; }
    public int TotalWrongAnswers { get; set; }
    public double AccuracyPercentage { get; set; }
    public DateOnly? LastPlayedDate { get; set; }
}

public class GeneratedQuestionJsonItem
{
    public string topic { get; set; } = string.Empty;
    public string difficulty { get; set; } = "easy";
    public string question { get; set; } = string.Empty;
    public string? code_snippet { get; set; }
    public List<string> options { get; set; } = new();
    public int correct_answer_index { get; set; }
    public string explanation { get; set; } = string.Empty;
}

public class GeneratedQuestionsBatchEnvelope
{
    public List<GeneratedQuestionJsonItem> questions { get; set; } = new();
}
