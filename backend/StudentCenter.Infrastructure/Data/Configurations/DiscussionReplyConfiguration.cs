using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class DiscussionReplyConfiguration : IEntityTypeConfiguration<DiscussionReply>
{
    public void Configure(EntityTypeBuilder<DiscussionReply> builder)
    {
        builder.ToTable("DiscussionReplies");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(r => r.Body).IsRequired();

        builder.Property(r => r.RowVersion).IsRowVersion();

        builder.HasOne(r => r.Thread)
            .WithMany(t => t.Replies)
            .HasForeignKey(r => r.ThreadId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.ParentReply)
            .WithMany(r => r.ChildReplies)
            .HasForeignKey(r => r.ParentReplyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.CreatedByUser)
            .WithMany()
            .HasForeignKey(r => r.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(r => r.ThreadId);
        builder.HasIndex(r => r.ParentReplyId);
        builder.HasIndex(r => r.CreatedByUserId);
        builder.HasIndex(r => r.CreatedAt);
    }
}
