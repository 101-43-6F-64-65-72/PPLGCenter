using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class OsisApplicationConfiguration : IEntityTypeConfiguration<OsisApplication>
{
    public void Configure(EntityTypeBuilder<OsisApplication> builder)
    {
        builder.HasKey(a => a.Id);

        builder.HasOne(a => a.OsisPosition)
            .WithMany(p => p.Applications)
            .HasForeignKey(a => a.OsisPositionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.ApplicantStudent)
            .WithMany()
            .HasForeignKey(a => a.ApplicantStudentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
