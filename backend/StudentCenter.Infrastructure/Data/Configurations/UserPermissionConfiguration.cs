using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class UserPermissionConfiguration : IEntityTypeConfiguration<UserPermission>
{
    public void Configure(EntityTypeBuilder<UserPermission> builder)
    {
        builder.HasKey(up => up.Id);

        builder.HasIndex(up => up.UserId);

        builder.HasOne(up => up.User)
               .WithMany(u => u.CustomPermissions)
               .HasForeignKey(up => up.UserId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
