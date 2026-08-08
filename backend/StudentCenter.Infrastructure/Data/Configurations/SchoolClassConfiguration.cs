using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class SchoolClassConfiguration : IEntityTypeConfiguration<SchoolClass>
{
    public void Configure(EntityTypeBuilder<SchoolClass> builder)
    {
        builder.ToTable("SchoolClasses");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.Grade)
            .IsRequired()
            .HasMaxLength(10);

        builder.Property(c => c.Capacity)
            .IsRequired()
            .HasDefaultValue(36);

        builder.Property(c => c.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(c => c.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        // Unique: same class name cannot exist twice in the same academic year
        builder.HasIndex(c => new { c.AcademicYearId, c.Name }).IsUnique();

        // FK → Department
        builder.HasOne(c => c.Department)
            .WithMany(d => d.Classes)
            .HasForeignKey(c => c.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        // FK → AcademicYear
        builder.HasOne(c => c.AcademicYear)
            .WithMany(a => a.Classes)
            .HasForeignKey(c => c.AcademicYearId)
            .OnDelete(DeleteBehavior.Restrict);

        // FK → HomeroomTeacher (nullable)
        builder.HasOne(c => c.HomeroomTeacher)
            .WithMany()
            .HasForeignKey(c => c.HomeroomTeacherId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);
    }
}
