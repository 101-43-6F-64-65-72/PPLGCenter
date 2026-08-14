using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class DiscussionThreadConfiguration : IEntityTypeConfiguration<DiscussionThread>
{
    public void Configure(EntityTypeBuilder<DiscussionThread> builder)
    {
        builder.ToTable("DiscussionThreads");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(t => t.Title).IsRequired().HasMaxLength(250);
        builder.Property(t => t.Body).IsRequired();

        builder.Property(t => t.RowVersion).IsRowVersion();

        builder.HasOne(t => t.ClassSubject)
            .WithMany()
            .HasForeignKey(t => t.ClassSubjectId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.CreatedByUser)
            .WithMany()
            .HasForeignKey(t => t.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(t => t.ClassSubjectId);
        builder.HasIndex(t => t.CreatedByUserId);
        builder.HasIndex(t => t.IsPinned);
        builder.HasIndex(t => t.CreatedAt);
    }
}
