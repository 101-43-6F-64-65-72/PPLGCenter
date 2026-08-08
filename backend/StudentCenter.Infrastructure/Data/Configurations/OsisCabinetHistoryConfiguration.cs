using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class OsisCabinetHistoryConfiguration : IEntityTypeConfiguration<OsisCabinetHistory>
{
    public void Configure(EntityTypeBuilder<OsisCabinetHistory> builder)
    {
        builder.HasKey(h => h.Id);

        builder.HasOne(h => h.AcademicYear)
            .WithMany()
            .HasForeignKey(h => h.AcademicYearId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(h => h.Student)
            .WithMany()
            .HasForeignKey(h => h.StudentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
