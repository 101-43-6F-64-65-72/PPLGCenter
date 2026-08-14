using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(u => u.FullName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(256);

        builder.HasIndex(u => u.Email)
            .IsUnique();

        builder.Property(u => u.Username)
            .HasMaxLength(100);

        builder.HasIndex(u => u.Username)
            .IsUnique()
            .HasFilter("\"Username\" IS NOT NULL");

        builder.Property(u => u.NIS)
            .HasMaxLength(50);

        builder.HasIndex(u => u.NIS);

        builder.Property(u => u.NISN)
            .HasMaxLength(50);

        builder.HasIndex(u => u.NISN);

        builder.Property(u => u.NIP)
            .HasMaxLength(50);

        builder.HasIndex(u => u.NIP);

        builder.Property(u => u.PhoneNumber)
            .HasMaxLength(50);

        builder.Property(u => u.PhotoUrl)
            .HasMaxLength(500);

        builder.Property(u => u.PasswordHash)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(u => u.Role)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(u => u.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        // ── Student-specific columns ─────────────────────────────────────────
        builder.Property(u => u.StudentNumber)
            .IsRequired(false);

        builder.Property(u => u.Gender)
            .HasMaxLength(10)
            .IsRequired(false);

        builder.Property(u => u.BirthDate)
            .IsRequired(false);

        builder.Property(u => u.Address)
            .HasMaxLength(500)
            .IsRequired(false);

        // ── Teacher-specific columns ─────────────────────────────────────────
        builder.Property(u => u.Position)
            .HasMaxLength(100)
            .IsRequired(false);

        // ── FK → SchoolClass (nullable) ──────────────────────────────────────
        builder.HasOne(u => u.Class)
            .WithMany(c => c.Students)
            .HasForeignKey(u => u.ClassId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        builder.Property(u => u.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(u => u.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");
    }
}
