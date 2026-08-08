using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class ExtracurricularAdvisorConfiguration : IEntityTypeConfiguration<ExtracurricularAdvisor>
{
    public void Configure(EntityTypeBuilder<ExtracurricularAdvisor> builder)
    {
        builder.ToTable("ExtracurricularAdvisors");

        builder.HasKey(ea => ea.Id);

        builder.Property(ea => ea.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.HasOne(ea => ea.Teacher)
            .WithMany(u => u.AdvisorExtracurriculars)
            .HasForeignKey(ea => ea.TeacherId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ea => ea.Extracurricular)
            .WithMany(e => e.Advisors)
            .HasForeignKey(ea => ea.ExtracurricularId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(ea => new { ea.TeacherId, ea.ExtracurricularId })
            .IsUnique();
    }
}
