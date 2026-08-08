using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class OsisPositionConfiguration : IEntityTypeConfiguration<OsisPosition>
{
    public void Configure(EntityTypeBuilder<OsisPosition> builder)
    {
        builder.HasKey(p => p.Id);

        builder.HasOne(p => p.AcademicYear)
            .WithMany()
            .HasForeignKey(p => p.AcademicYearId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
