using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class ScheduleRotationConfigConfiguration : IEntityTypeConfiguration<ScheduleRotationConfig>
{
    public void Configure(EntityTypeBuilder<ScheduleRotationConfig> builder)
    {
        builder.HasKey(src => src.Id);

        builder.HasIndex(src => src.SchoolClassId);

        builder.HasOne(src => src.SchoolClass)
               .WithMany()
               .HasForeignKey(src => src.SchoolClassId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
