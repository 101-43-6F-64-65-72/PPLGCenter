using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class ShowcaseBannerConfiguration : IEntityTypeConfiguration<ShowcaseBanner>
{
    public void Configure(EntityTypeBuilder<ShowcaseBanner> builder)
    {
        builder.ToTable("ShowcaseBanners");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(s => s.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(s => s.Description)
            .HasColumnType("text");

        builder.Property(s => s.ImageUrl)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(s => s.LinkUrl)
            .HasMaxLength(500);

        builder.Property(s => s.ButtonText)
            .HasMaxLength(100);

        builder.Property(s => s.Order)
            .HasDefaultValue(0);

        builder.Property(s => s.IsActive)
            .HasDefaultValue(true);

        builder.Property(s => s.CreatedAt)
            .HasDefaultValueSql("now()");

        builder.Property(s => s.UpdatedAt)
            .HasDefaultValueSql("now()");

        builder.HasOne(s => s.Announcement)
            .WithMany()
            .HasForeignKey(s => s.AnnouncementId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(s => s.Order);
        builder.HasIndex(s => s.IsActive);
    }
}
