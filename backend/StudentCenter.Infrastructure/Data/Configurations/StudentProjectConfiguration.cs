using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class StudentProjectConfiguration : IEntityTypeConfiguration<StudentProject>
{
    public void Configure(EntityTypeBuilder<StudentProject> builder)
    {
        builder.HasKey(sp => sp.Id);

        builder.Property(sp => sp.Title)
               .IsRequired()
               .HasMaxLength(200);

        builder.Property(sp => sp.Description)
               .IsRequired()
               .HasMaxLength(2000);

        builder.HasOne(sp => sp.StudentProfile)
               .WithMany(p => p.Projects)
               .HasForeignKey(sp => sp.StudentProfileId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
