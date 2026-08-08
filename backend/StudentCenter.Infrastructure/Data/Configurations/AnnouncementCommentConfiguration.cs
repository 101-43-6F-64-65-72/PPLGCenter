using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class AnnouncementCommentConfiguration : IEntityTypeConfiguration<AnnouncementComment>
{
    public void Configure(EntityTypeBuilder<AnnouncementComment> builder)
    {
        builder.ToTable("AnnouncementComments");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(c => c.Content)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(c => c.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(c => c.AnnouncementId)
            .IsRequired();

        builder.Property(c => c.UserId)
            .IsRequired();

        builder.HasOne(c => c.Announcement)
            .WithMany(a => a.Comments)
            .HasForeignKey(c => c.AnnouncementId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.User)
            .WithMany()
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.ParentComment)
            .WithMany(c => c.ChildComments)
            .HasForeignKey(c => c.ParentCommentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(c => c.AnnouncementId);
        builder.HasIndex(c => c.UserId);
        builder.HasIndex(c => c.ParentCommentId);
        builder.HasIndex(c => c.CreatedAt);
    }
}
