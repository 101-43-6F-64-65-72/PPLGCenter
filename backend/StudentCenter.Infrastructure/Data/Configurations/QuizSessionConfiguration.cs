using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class QuizSessionConfiguration : IEntityTypeConfiguration<QuizSession>
{
    public void Configure(EntityTypeBuilder<QuizSession> builder)
    {
        builder.ToTable("QuizSessions");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Status)
            .IsRequired()
            .HasMaxLength(30)
            .HasDefaultValue("Active");

        builder.HasOne(s => s.User)
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(s => new { s.UserId, s.TargetDate });
        builder.HasIndex(s => s.Score);
    }
}
