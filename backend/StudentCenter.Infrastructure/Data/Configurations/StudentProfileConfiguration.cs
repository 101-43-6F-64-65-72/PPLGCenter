using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class StudentProfileConfiguration : IEntityTypeConfiguration<StudentProfile>
{
    public void Configure(EntityTypeBuilder<StudentProfile> builder)
    {
        builder.HasKey(sp => sp.Id);

        // Strict 1:1 relationship with User
        builder.HasIndex(sp => sp.UserId)
               .IsUnique();

        builder.HasOne(sp => sp.User)
               .WithOne(u => u.StudentProfile)
               .HasForeignKey<StudentProfile>(sp => sp.UserId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.Property(sp => sp.Bio)
               .HasMaxLength(1000);
    }
}
