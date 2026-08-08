using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class ElectionCandidateConfiguration : IEntityTypeConfiguration<ElectionCandidate>
{
    public void Configure(EntityTypeBuilder<ElectionCandidate> builder)
    {
        builder.HasKey(c => c.Id);

        builder.HasOne(c => c.Election)
            .WithMany(e => e.Candidates)
            .HasForeignKey(c => c.ElectionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.Student)
            .WithMany()
            .HasForeignKey(c => c.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(c => c.Vision)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(c => c.Mission)
            .IsRequired()
            .HasMaxLength(4000);

        builder.HasQueryFilter(c => c.Election.DeletedAt == null);
    }
}
