using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class AttendanceConfiguration : IEntityTypeConfiguration<Attendance>
{
    public void Configure(EntityTypeBuilder<Attendance> builder)
    {
        builder.ToTable("Attendances");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(a => a.StudentId)
            .IsRequired();

        builder.Property(a => a.AttendanceDate)
            .IsRequired();

        builder.Property(a => a.Status)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(a => a.Notes)
            .HasMaxLength(1000);

        builder.Property(a => a.RecordedByUserId)
            .IsRequired(false);

        builder.HasOne(a => a.AttendanceSession)
            .WithMany(s => s.Attendances)
            .HasForeignKey(a => a.AttendanceSessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Student)
            .WithMany()
            .HasForeignKey(a => a.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.RecordedByUser)
            .WithMany()
            .HasForeignKey(a => a.RecordedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(a => a.StudentId);
        builder.HasIndex(a => a.AttendanceDate);
        builder.HasIndex(a => a.Status);
        builder.HasIndex(a => new { a.AttendanceSessionId, a.StudentId }).IsUnique();
    }
}
