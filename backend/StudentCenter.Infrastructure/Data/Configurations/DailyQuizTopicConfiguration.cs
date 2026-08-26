using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class DailyQuizTopicConfiguration : IEntityTypeConfiguration<DailyQuizTopic>
{
    public void Configure(EntityTypeBuilder<DailyQuizTopic> builder)
    {
        builder.ToTable("DailyQuizTopics");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.TopicName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(t => t.Description)
            .HasMaxLength(1000);

        builder.Property(t => t.Status)
            .IsRequired()
            .HasMaxLength(30)
            .HasDefaultValue("Draft");

        builder.HasOne(t => t.ProposedByUser)
            .WithMany()
            .HasForeignKey(t => t.ProposedByUserId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(t => t.Votes)
            .WithOne(v => v.Topic)
            .HasForeignKey(v => v.TopicId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(t => t.TargetDate);
        builder.HasIndex(t => t.Status);
    }
}
