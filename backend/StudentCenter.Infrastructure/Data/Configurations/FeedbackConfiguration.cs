using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class FeedbackConfiguration : IEntityTypeConfiguration<Feedback>
{
    public void Configure(EntityTypeBuilder<Feedback> builder)
    {
        builder.ToTable("Feedbacks");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(f => f.Category)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(f => f.Rating)
            .IsRequired();

        builder.Property(f => f.Content)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(f => f.UserName)
            .HasMaxLength(200);

        builder.Property(f => f.UserIdentifier)
            .HasMaxLength(100);

        builder.Property(f => f.UserRole)
            .HasMaxLength(50);

        builder.Property(f => f.Status)
            .IsRequired()
            .HasMaxLength(30)
            .HasDefaultValue("Pending");

        builder.Property(f => f.AdminNotes)
            .HasMaxLength(500);

        builder.Property(f => f.CreatedAt)
            .HasDefaultValueSql("now()");

        builder.HasOne(f => f.User)
            .WithMany()
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(f => f.Category);
        builder.HasIndex(f => f.Rating);
        builder.HasIndex(f => f.Status);
        builder.HasIndex(f => f.CreatedAt);
    }
}
