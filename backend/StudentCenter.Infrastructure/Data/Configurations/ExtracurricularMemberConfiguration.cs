using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class ExtracurricularMemberConfiguration : IEntityTypeConfiguration<ExtracurricularMember>
{
    public void Configure(EntityTypeBuilder<ExtracurricularMember> builder)
    {
        builder.ToTable("ExtracurricularMembers");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(m => m.ExtracurricularId)
            .IsRequired();

        builder.Property(m => m.StudentId)
            .IsRequired();

        builder.Property(m => m.Position)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(m => m.Status)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue("Active");

        builder.Property(m => m.JoinDate)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(m => m.JoinedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.HasOne(m => m.Student)
            .WithMany(u => u.Memberships)
            .HasForeignKey(m => m.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(m => m.ExtracurricularId);
        builder.HasIndex(m => m.StudentId);
        builder.HasIndex(m => new { m.ExtracurricularId, m.StudentId }).IsUnique();
        builder.HasIndex(m => m.JoinedAt);
    }
}
