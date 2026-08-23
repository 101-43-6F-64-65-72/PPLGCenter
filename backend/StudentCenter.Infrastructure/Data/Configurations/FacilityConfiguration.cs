using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class FacilityConfiguration : IEntityTypeConfiguration<Facility>
{
    public void Configure(EntityTypeBuilder<Facility> builder)
    {
        builder.ToTable("Facilities");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.Id)
            .HasColumnName("Id")
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(f => f.Name)
            .HasColumnName("Name")
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(f => f.Description)
            .HasColumnName("Description")
            .HasMaxLength(1000);

        builder.Property(f => f.Location)
            .HasColumnName("Location")
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(f => f.Capacity)
            .HasColumnName("Capacity")
            .IsRequired();

        builder.Property(f => f.ImageUrl)
            .HasColumnName("ImageUrl")
            .HasMaxLength(500);

        builder.Property(f => f.Model3DUrl)
            .HasColumnName("Model3DUrl")
            .HasMaxLength(500);

        builder.Property(f => f.Category)
            .HasColumnName("Category")
            .HasMaxLength(100);

        builder.Property(f => f.IsActive)
            .HasColumnName("IsActive")
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(f => f.ManagerTeacherId)
            .HasColumnName("ManagerTeacherId");

        builder.Property(f => f.CreatedAt)
            .HasColumnName("CreatedAt")
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(f => f.UpdatedAt)
            .HasColumnName("UpdatedAt")
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Ignore(f => f.IsDeleted);

        builder.HasIndex(f => f.Name);
        builder.HasIndex(f => f.IsActive);
    }
}
