using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class GroupMessageConfiguration : IEntityTypeConfiguration<GroupMessage>
{
    public void Configure(EntityTypeBuilder<GroupMessage> builder)
    {
        builder.HasKey(gm => gm.Id);

        builder.HasIndex(gm => gm.GroupId);
        builder.HasIndex(gm => gm.SenderUserId);

        builder.HasOne(gm => gm.Group)
               .WithMany(g => g.Messages)
               .HasForeignKey(gm => gm.GroupId)
               .OnDelete(DeleteBehavior.Cascade);

        // Restrict delete on SenderUserId to preserve message audit history
        builder.HasOne(gm => gm.SenderUser)
               .WithMany()
               .HasForeignKey(gm => gm.SenderUserId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
