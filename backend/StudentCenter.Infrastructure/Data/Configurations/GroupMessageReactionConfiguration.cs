using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class GroupMessageReactionConfiguration : IEntityTypeConfiguration<GroupMessageReaction>
{
    public void Configure(EntityTypeBuilder<GroupMessageReaction> builder)
    {
        builder.HasKey(r => r.Id);

        builder.HasIndex(r => r.MessageId);
        builder.HasIndex(r => r.UserId);
        builder.HasIndex(r => new { r.MessageId, r.UserId }).IsUnique();

        builder.HasOne(r => r.Message)
               .WithMany(m => m.Reactions)
               .HasForeignKey(r => r.MessageId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.User)
               .WithMany()
               .HasForeignKey(r => r.UserId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
