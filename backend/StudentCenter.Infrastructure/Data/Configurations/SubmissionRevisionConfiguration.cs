using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class SubmissionRevisionConfiguration : IEntityTypeConfiguration<SubmissionRevision>
{
    public void Configure(EntityTypeBuilder<SubmissionRevision> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.SubmissionType)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(r => r.Comment)
            .HasMaxLength(1000);

        builder.HasOne(r => r.Submission)
            .WithMany(s => s.Revisions)
            .HasForeignKey(r => r.SubmissionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
