using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class ProposalConfiguration : IEntityTypeConfiguration<Proposal>
{
    public void Configure(EntityTypeBuilder<Proposal> builder)
    {
        builder.ToTable("Proposals");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(p => p.Title)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(p => p.Description)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(p => p.FileUrl)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(p => p.Status)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(p => p.RejectionReason)
            .HasMaxLength(1000);

        builder.Property(p => p.SubmittedByUserId)
            .IsRequired();

        builder.Property(p => p.ReviewedByUserId);

        builder.Property(p => p.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(p => p.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(p => p.ReviewedAt);

        builder.HasOne(p => p.SubmittedByUser)
            .WithMany()
            .HasForeignKey(p => p.SubmittedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.ReviewedByUser)
            .WithMany()
            .HasForeignKey(p => p.ReviewedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Extracurricular)
            .WithMany()
            .HasForeignKey(p => p.ExtracurricularId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(p => p.SubmittedByUserId);
        builder.HasIndex(p => p.Status);
        builder.HasIndex(p => p.CreatedAt);
        builder.HasIndex(p => p.ReviewedByUserId);
        builder.HasIndex(p => p.ExtracurricularId);
    }
}
