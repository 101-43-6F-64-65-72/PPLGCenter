using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class CandidatePairVoteConfiguration : IEntityTypeConfiguration<CandidatePairVote>
{
    public void Configure(EntityTypeBuilder<CandidatePairVote> builder)
    {
        builder.HasKey(v => v.Id);

        // Unique Constraint: Exactly 1 vote per election per user account
        builder.HasIndex(v => new { v.ElectionId, v.VoterUserId })
            .IsUnique();

        builder.HasOne(v => v.Election)
            .WithMany()
            .HasForeignKey(v => v.ElectionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(v => v.CandidatePair)
            .WithMany(cp => cp.Votes)
            .HasForeignKey(v => v.CandidatePairId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(v => v.VoterUser)
            .WithMany()
            .HasForeignKey(v => v.VoterUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(v => v.Election.DeletedAt == null);
    }
}
