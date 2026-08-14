using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class ClassDivisionConfiguration : IEntityTypeConfiguration<ClassDivision>
{
    public void Configure(EntityTypeBuilder<ClassDivision> builder)
    {
        builder.HasKey(cd => cd.Id);

        builder.Property(cd => cd.Name)
               .IsRequired()
               .HasMaxLength(100);

        builder.HasOne(cd => cd.SchoolClass)
               .WithMany(sc => sc.Divisions)
               .HasForeignKey(cd => cd.SchoolClassId)
               .OnDelete(DeleteBehavior.Cascade);

        // Self-referencing Tree Structure
        builder.HasOne(cd => cd.ParentDivision)
               .WithMany(cd => cd.SubDivisions)
               .HasForeignKey(cd => cd.ParentDivisionId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(cd => cd.LeaderStudent)
               .WithMany()
               .HasForeignKey(cd => cd.LeaderStudentId)
               .OnDelete(DeleteBehavior.SetNull);
    }
}
