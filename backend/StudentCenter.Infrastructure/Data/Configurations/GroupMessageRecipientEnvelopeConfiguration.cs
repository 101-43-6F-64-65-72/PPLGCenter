using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class GroupMessageRecipientEnvelopeConfiguration : IEntityTypeConfiguration<GroupMessageRecipientEnvelope>
{
    public void Configure(EntityTypeBuilder<GroupMessageRecipientEnvelope> builder)
    {
        builder.HasKey(e => e.Id);

        builder.HasIndex(e => e.MessageId);
        builder.HasIndex(e => e.RecipientUserId);

        builder.HasOne(e => e.Message)
               .WithMany(m => m.RecipientEnvelopes)
               .HasForeignKey(e => e.MessageId)
               .OnDelete(DeleteBehavior.Cascade);

        // Restrict delete on RecipientUserId
        builder.HasOne(e => e.RecipientUser)
               .WithMany()
               .HasForeignKey(e => e.RecipientUserId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
