using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class ClassLeadershipConfiguration : IEntityTypeConfiguration<ClassLeadership>
{
    public void Configure(EntityTypeBuilder<ClassLeadership> builder)
    {
        builder.HasKey(cl => cl.Id);

        // One active leadership per class per academic year (Filtered Unique Index)
        builder.HasIndex(cl => new { cl.SchoolClassId, cl.AcademicYearId })
               .HasFilter("\"IsActive\" = true")
               .IsUnique();

        builder.HasOne(cl => cl.SchoolClass)
               .WithMany()
               .HasForeignKey(cl => cl.SchoolClassId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(cl => cl.HomeroomTeacher)
               .WithMany()
               .HasForeignKey(cl => cl.HomeroomTeacherId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(cl => cl.ClassLeaderStudent)
               .WithMany()
               .HasForeignKey(cl => cl.ClassLeaderStudentId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(cl => cl.AcademicYear)
               .WithMany()
               .HasForeignKey(cl => cl.AcademicYearId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
