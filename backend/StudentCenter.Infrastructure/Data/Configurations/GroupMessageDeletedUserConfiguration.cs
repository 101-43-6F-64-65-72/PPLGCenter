using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class GroupMessageDeletedUserConfiguration : IEntityTypeConfiguration<GroupMessageDeletedUser>
{
    public void Configure(EntityTypeBuilder<GroupMessageDeletedUser> builder)
    {
        builder.HasKey(d => d.Id);

        builder.HasIndex(d => d.MessageId);
        builder.HasIndex(d => d.UserId);
        builder.HasIndex(d => new { d.MessageId, d.UserId }).IsUnique();

        builder.HasOne(d => d.Message)
               .WithMany(m => m.DeletedForUsers)
               .HasForeignKey(d => d.MessageId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.User)
               .WithMany()
               .HasForeignKey(d => d.UserId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
