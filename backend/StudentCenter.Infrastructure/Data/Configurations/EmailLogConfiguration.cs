using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class EmailLogConfiguration : IEntityTypeConfiguration<EmailLog>
{
    public void Configure(EntityTypeBuilder<EmailLog> builder)
    {
        builder.ToTable("EmailLogs");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(e => e.Recipient)
            .IsRequired()
            .HasMaxLength(254);

        builder.Property(e => e.Sender)
            .IsRequired()
            .HasMaxLength(254);

        builder.Property(e => e.Subject)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.Message)
            .IsRequired()
            .HasMaxLength(5000);

        builder.Property(e => e.Provider)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(e => e.ProviderResponse)
            .HasMaxLength(2000);

        builder.Property(e => e.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(e => e.ErrorMessage)
            .HasMaxLength(2000);

        builder.Property(e => e.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(e => e.SentAt)
            .IsRequired(false);

        // Relationships
        builder.HasOne(e => e.RecipientUser)
            .WithMany()
            .HasForeignKey(e => e.RecipientUserId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        builder.HasOne(e => e.CreatedByUser)
            .WithMany()
            .HasForeignKey(e => e.CreatedByUserId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        builder.HasIndex(e => e.CreatedAt);
        builder.HasIndex(e => e.Recipient);
        builder.HasIndex(e => e.Status);
    }
}
