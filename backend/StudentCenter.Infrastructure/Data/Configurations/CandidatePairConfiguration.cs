using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class CandidatePairConfiguration : IEntityTypeConfiguration<CandidatePair>
{
    public void Configure(EntityTypeBuilder<CandidatePair> builder)
    {
        builder.HasKey(c => c.Id);

        builder.HasOne(c => c.Election)
            .WithMany()
            .HasForeignKey(c => c.ElectionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.ChairmanUser)
            .WithMany()
            .HasForeignKey(c => c.ChairmanUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.ViceUser)
            .WithMany()
            .HasForeignKey(c => c.ViceUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(c => c.Election.DeletedAt == null);
    }
}
