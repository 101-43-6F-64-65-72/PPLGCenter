using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class CommunityGroupMemberConfiguration : IEntityTypeConfiguration<CommunityGroupMember>
{
    public void Configure(EntityTypeBuilder<CommunityGroupMember> builder)
    {
        builder.HasKey(gm => gm.Id);

        // Unique member assignment per group
        builder.HasIndex(gm => new { gm.GroupId, gm.UserId })
               .IsUnique();

        builder.HasOne(gm => gm.Group)
               .WithMany(g => g.Members)
               .HasForeignKey(gm => gm.GroupId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(gm => gm.User)
               .WithMany()
               .HasForeignKey(gm => gm.UserId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
