using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class AssessmentConfiguration : IEntityTypeConfiguration<Assessment>
{
    public void Configure(EntityTypeBuilder<Assessment> builder)
    {
        builder.ToTable("Assessments");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(a => a.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(a => a.Description)
            .HasMaxLength(1000);

        builder.Property(a => a.AssessmentType)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(a => a.MaxScore)
            .HasColumnType("numeric(5,2)")
            .HasDefaultValue(100.0m);

        builder.Property(a => a.WeightOverride)
            .HasColumnType("numeric(5,2)");

        builder.Property(a => a.IsPublished)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(a => a.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(a => a.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.HasOne(a => a.ClassSubject)
            .WithMany()
            .HasForeignKey(a => a.ClassSubjectId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.GradeCategory)
            .WithMany(gc => gc.Assessments)
            .HasForeignKey(a => a.GradeCategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Teacher)
            .WithMany()
            .HasForeignKey(a => a.TeacherId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Assignment)
            .WithMany()
            .HasForeignKey(a => a.AssignmentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(a => a.ClassSubjectId);
        builder.HasIndex(a => a.GradeCategoryId);
        builder.HasIndex(a => a.TeacherId);
        builder.HasIndex(a => a.AssignmentId);
        builder.HasIndex(a => a.IsPublished);
    }
}
