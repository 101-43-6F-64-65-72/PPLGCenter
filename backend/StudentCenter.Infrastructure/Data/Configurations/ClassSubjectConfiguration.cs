using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class ClassSubjectConfiguration : IEntityTypeConfiguration<ClassSubject>
{
    public void Configure(EntityTypeBuilder<ClassSubject> builder)
    {
        builder.HasKey(cs => cs.Id);

        builder.HasIndex(cs => new { cs.ClassId, cs.TeacherSubjectId })
            .IsUnique();

        builder.HasOne(cs => cs.Class)
            .WithMany()
            .HasForeignKey(cs => cs.ClassId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(cs => cs.TeacherSubject)
            .WithMany(ts => ts.ClassSubjects)
            .HasForeignKey(cs => cs.TeacherSubjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
