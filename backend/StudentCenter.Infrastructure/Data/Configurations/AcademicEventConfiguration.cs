using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class AcademicEventConfiguration : IEntityTypeConfiguration<AcademicEvent>
{
    public void Configure(EntityTypeBuilder<AcademicEvent> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.Description)
            .HasMaxLength(1000);

        builder.Property(e => e.Type)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(e => e.TargetType)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasOne(e => e.TargetClass)
            .WithMany()
            .HasForeignKey(e => e.TargetClassId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
