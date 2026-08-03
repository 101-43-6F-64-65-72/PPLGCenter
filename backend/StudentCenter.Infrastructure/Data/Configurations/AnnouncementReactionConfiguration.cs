using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class AnnouncementReactionConfiguration : IEntityTypeConfiguration<AnnouncementReaction>
{
    public void Configure(EntityTypeBuilder<AnnouncementReaction> builder)
    {
        builder.ToTable("AnnouncementReactions");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(r => r.Type)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(r => r.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(r => r.AnnouncementId)
            .IsRequired();

        builder.Property(r => r.UserId)
            .IsRequired();

        builder.HasOne(r => r.Announcement)
            .WithMany(a => a.Reactions)
            .HasForeignKey(r => r.AnnouncementId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(r => r.AnnouncementId);
        builder.HasIndex(r => r.UserId);
        builder.HasIndex(r => new { r.AnnouncementId, r.UserId }).IsUnique();
    }
}
