using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class VoteConfiguration : IEntityTypeConfiguration<Vote>
{
    public void Configure(EntityTypeBuilder<Vote> builder)
    {
        builder.HasKey(v => v.Id);

        // Unique Constraint: One vote per election per user
        builder.HasIndex(v => new { v.ElectionId, v.VoterUserId })
            .IsUnique();

        builder.HasOne(v => v.Election)
            .WithMany(e => e.Votes)
            .HasForeignKey(v => v.ElectionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(v => v.Candidate)
            .WithMany(c => c.Votes)
            .HasForeignKey(v => v.CandidateId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(v => v.VoterUser)
            .WithMany()
            .HasForeignKey(v => v.VoterUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(v => v.Election.DeletedAt == null);
    }
}
