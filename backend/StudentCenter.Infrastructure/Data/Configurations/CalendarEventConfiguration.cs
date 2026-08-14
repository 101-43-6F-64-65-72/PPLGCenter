using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class CalendarEventConfiguration : IEntityTypeConfiguration<CalendarEvent>
{
    public void Configure(EntityTypeBuilder<CalendarEvent> builder)
    {
        builder.ToTable("CalendarEvents");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(c => c.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.Description)
            .HasMaxLength(2000);

        builder.Property(c => c.StartDate)
            .IsRequired();

        builder.Property(c => c.EndDate)
            .IsRequired();

        builder.Property(c => c.Location)
            .HasMaxLength(200);

        builder.Property(c => c.Category)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.IsAllDay)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(c => c.CreatedByUserId)
            .IsRequired();

        builder.Property(c => c.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(c => c.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.HasOne(c => c.CreatedByUser)
            .WithMany()
            .HasForeignKey(c => c.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(c => c.StartDate);
        builder.HasIndex(c => c.EndDate);
        builder.HasIndex(c => c.Category);
        builder.HasIndex(c => c.CreatedByUserId);

        // The following properties exist on the C# entity but do NOT exist in the
        // PPLG Center Supabase database schema. Explicitly ignored to prevent
        // DbUpdateException at startup. DO NOT create a migration for these.
        builder.Ignore(c => c.Color);
        builder.Ignore(c => c.Visibility);
        builder.Ignore(c => c.StartTime);
        builder.Ignore(c => c.EndTime);
        builder.Ignore(c => c.DeletedAt);
        // EventDate is a computed C# alias for StartDate — not a real DB column.
        builder.Ignore(c => c.EventDate);
    }
}
