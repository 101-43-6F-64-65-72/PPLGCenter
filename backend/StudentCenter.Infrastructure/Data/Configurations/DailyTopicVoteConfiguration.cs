using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class DailyTopicVoteConfiguration : IEntityTypeConfiguration<DailyTopicVote>
{
    public void Configure(EntityTypeBuilder<DailyTopicVote> builder)
    {
        builder.ToTable("DailyTopicVotes");

        builder.HasKey(v => v.Id);

        builder.HasOne(v => v.Topic)
            .WithMany(t => t.Votes)
            .HasForeignKey(v => v.TopicId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(v => v.TeacherUser)
            .WithMany()
            .HasForeignKey(v => v.TeacherUserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(v => new { v.TopicId, v.TeacherUserId }).IsUnique();
    }
}
