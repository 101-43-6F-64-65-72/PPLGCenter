using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class ExtracurricularConfiguration : IEntityTypeConfiguration<Extracurricular>
{
    public void Configure(EntityTypeBuilder<Extracurricular> builder)
    {
        builder.ToTable("Extracurriculars");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.Description)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(e => e.ImageUrl)
            .HasMaxLength(500);

        builder.Property(e => e.Category)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.MaxMembers)
            .IsRequired();

        builder.Property(e => e.ScheduleDay)
            .HasMaxLength(50);

        builder.Property(e => e.ScheduleTime)
            .HasMaxLength(100);

        builder.Property(e => e.Location)
            .HasMaxLength(200);

        builder.Property(e => e.AdvisorName)
            .HasMaxLength(200);

        builder.Property(e => e.AdvisorWhatsapp)
            .HasMaxLength(50);

        builder.Property(e => e.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(e => e.ManagedByUserId)
            .IsRequired();

        builder.Property(e => e.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(e => e.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.HasOne(e => e.ManagedByUser)
            .WithMany()
            .HasForeignKey(e => e.ManagedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.SupervisorTeacher)
            .WithMany()
            .HasForeignKey(e => e.SupervisorTeacherId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(e => e.Members)
            .WithOne(m => m.Extracurricular)
            .HasForeignKey(m => m.ExtracurricularId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.Name);
        builder.HasIndex(e => e.Category);
        builder.HasIndex(e => e.IsActive);
        builder.HasIndex(e => e.ManagedByUserId);
        builder.HasIndex(e => e.SupervisorTeacherId);
        builder.HasIndex(e => e.CreatedAt);
    }
}
