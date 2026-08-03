using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class SubmissionConfiguration : IEntityTypeConfiguration<Submission>
{
    public void Configure(EntityTypeBuilder<Submission> builder)
    {
        builder.ToTable("Submissions");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(s => s.FileUrl)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(s => s.Notes)
            .HasMaxLength(1000);

        builder.Property(s => s.Score);

        builder.Property(s => s.Feedback)
            .HasMaxLength(2000);

        builder.Property(s => s.SubmittedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(s => s.GradedAt);

        builder.Property(s => s.AssignmentId)
            .IsRequired();

        builder.Property(s => s.StudentId)
            .IsRequired();

        builder.HasOne(s => s.Student)
            .WithMany()
            .HasForeignKey(s => s.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(s => s.AssignmentId);
        builder.HasIndex(s => s.StudentId);
        builder.HasIndex(s => new { s.AssignmentId, s.StudentId }).IsUnique();
    }
}
