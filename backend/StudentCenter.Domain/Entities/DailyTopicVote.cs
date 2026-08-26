using System;

namespace StudentCenter.Domain.Entities;

public class DailyTopicVote
{
    public Guid Id { get; set; }
    public Guid TopicId { get; set; }
    public Guid TeacherUserId { get; set; }
    public DateTime VotedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public virtual DailyQuizTopic? Topic { get; set; }
    public virtual User? TeacherUser { get; set; }
}
