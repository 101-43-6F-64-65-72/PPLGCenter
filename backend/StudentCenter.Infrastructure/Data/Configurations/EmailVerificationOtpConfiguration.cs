using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class EmailVerificationOtpConfiguration : IEntityTypeConfiguration<EmailVerificationOtp>
{
    public void Configure(EntityTypeBuilder<EmailVerificationOtp> builder)
    {
        builder.ToTable("EmailVerificationOtps");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(e => e.Email)
            .IsRequired()
            .HasMaxLength(254);

        builder.Property(e => e.OtpHash)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(e => e.ExpiresAt)
            .IsRequired();

        builder.Property(e => e.AttemptCount)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(e => e.IsUsed)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(e => e.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.UserId);
        builder.HasIndex(e => e.Email);
        builder.HasIndex(e => e.CreatedAt);
    }
}
