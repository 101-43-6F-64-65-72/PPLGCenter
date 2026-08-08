using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class StudentGradeConfiguration : IEntityTypeConfiguration<StudentGrade>
{
    public void Configure(EntityTypeBuilder<StudentGrade> builder)
    {
        builder.ToTable("StudentGrades");

        builder.HasKey(g => g.Id);
        builder.Property(g => g.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(g => g.RawScore)
            .HasColumnType("numeric(5,2)")
            .IsRequired();

        builder.Property(g => g.FinalScore)
            .HasColumnType("numeric(5,2)")
            .IsRequired();

        builder.Property(g => g.LetterGrade)
            .IsRequired()
            .HasMaxLength(10);

        builder.Property(g => g.Predicate)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(g => g.Remarks)
            .HasMaxLength(500);

        builder.Property(g => g.IsPublished)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(g => g.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(g => g.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.HasOne(g => g.Assessment)
            .WithMany(a => a.StudentGrades)
            .HasForeignKey(g => g.AssessmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(g => g.Student)
            .WithMany()
            .HasForeignKey(g => g.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(g => g.GradedByUser)
            .WithMany()
            .HasForeignKey(g => g.GradedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(g => new { g.AssessmentId, g.StudentId }).IsUnique();
        builder.HasIndex(g => g.StudentId);
        builder.HasIndex(g => g.IsPublished);
    }
}
