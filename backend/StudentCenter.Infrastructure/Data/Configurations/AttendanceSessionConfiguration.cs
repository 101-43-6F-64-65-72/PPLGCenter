using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class AttendanceSessionConfiguration : IEntityTypeConfiguration<AttendanceSession>
{
    public void Configure(EntityTypeBuilder<AttendanceSession> builder)
    {
        builder.HasKey(s => s.Id);

        builder.HasIndex(s => new { s.ScheduleId, s.Date })
            .IsUnique();

        builder.Property(s => s.Status)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasOne(s => s.Schedule)
            .WithMany()
            .HasForeignKey(s => s.ScheduleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.ClassSubject)
            .WithMany()
            .HasForeignKey(s => s.ClassSubjectId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.Teacher)
            .WithMany()
            .HasForeignKey(s => s.TeacherId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.Semester)
            .WithMany()
            .HasForeignKey(s => s.SemesterId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
