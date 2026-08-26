using System;
using System.Collections.Generic;

namespace StudentCenter.Domain.Entities;

public class DailyQuizTopic
{
    public Guid Id { get; set; }
    public DateOnly TargetDate { get; set; }
    public string TopicName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? ProposedByUserId { get; set; }
    public string? ProposedByUserName { get; set; }
    public int VotesCount { get; set; } = 0;
    public string Status { get; set; } = "Draft"; // Draft, Voting, Selected, Fallback
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public virtual User? ProposedByUser { get; set; }
    public virtual ICollection<DailyTopicVote> Votes { get; set; } = new List<DailyTopicVote>();
}
