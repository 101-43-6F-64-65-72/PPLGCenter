using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class FacilityManagerConfiguration : IEntityTypeConfiguration<FacilityManager>
{
    public void Configure(EntityTypeBuilder<FacilityManager> builder)
    {
        builder.HasKey(fm => fm.Id);

        // Unique assignment per facility & manager
        builder.HasIndex(fm => new { fm.FacilityId, fm.ManagerUserId })
               .IsUnique();

        builder.HasOne(fm => fm.Facility)
               .WithMany()
               .HasForeignKey(fm => fm.FacilityId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(fm => fm.ManagerUser)
               .WithMany()
               .HasForeignKey(fm => fm.ManagerUserId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
