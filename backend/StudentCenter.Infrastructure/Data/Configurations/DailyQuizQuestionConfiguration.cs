using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class DailyQuizQuestionConfiguration : IEntityTypeConfiguration<DailyQuizQuestion>
{
    public void Configure(EntityTypeBuilder<DailyQuizQuestion> builder)
    {
        builder.ToTable("DailyQuizQuestions");

        builder.HasKey(q => q.Id);

        builder.Property(q => q.Topic)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(q => q.Difficulty)
            .IsRequired()
            .HasMaxLength(30)
            .HasDefaultValue("easy");

        builder.Property(q => q.QuestionText)
            .IsRequired();

        builder.Property(q => q.OptionsJson)
            .IsRequired();

        builder.Property(q => q.Explanation)
            .IsRequired();

        builder.HasIndex(q => new { q.TargetDate, q.QuestionNumber }).IsUnique();
        builder.HasIndex(q => q.TargetDate);
    }
}
