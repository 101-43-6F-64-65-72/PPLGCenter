using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class MaterialConfiguration : IEntityTypeConfiguration<Material>
{
    public void Configure(EntityTypeBuilder<Material> builder)
    {
        builder.ToTable("Materials");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(m => m.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(m => m.Description)
            .HasMaxLength(1000);

        builder.Property(m => m.FileUrl)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(m => m.Subject)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(m => m.Grade)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(m => m.UploadedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(m => m.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(m => m.UploadedByUserId)
            .IsRequired();

        builder.HasOne(m => m.UploadedByUser)
            .WithMany()
            .HasForeignKey(m => m.UploadedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(m => m.UploadedAt);
        builder.HasIndex(m => m.Subject);
        builder.HasIndex(m => m.Grade);
        builder.HasIndex(m => m.UploadedByUserId);
    }
}
