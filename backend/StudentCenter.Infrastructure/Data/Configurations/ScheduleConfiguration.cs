using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class ScheduleConfiguration : IEntityTypeConfiguration<Schedule>
{
    public void Configure(EntityTypeBuilder<Schedule> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Room)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(s => s.Color)
            .HasMaxLength(20);

        builder.HasOne(s => s.ClassSubject)
            .WithMany(cs => cs.Schedules)
            .HasForeignKey(s => s.ClassSubjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.Semester)
            .WithMany()
            .HasForeignKey(s => s.SemesterId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
