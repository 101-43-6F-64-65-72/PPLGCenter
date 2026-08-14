using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class FacilityBookingConfiguration : IEntityTypeConfiguration<FacilityBooking>
{
    public void Configure(EntityTypeBuilder<FacilityBooking> builder)
    {
        builder.ToTable("FacilityBookings");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.Id)
            .HasDefaultValueSql("gen_random_uuid()");

        builder.Property(b => b.FacilityId)
            .IsRequired();

        builder.Property(b => b.BookedByUserId)
            .IsRequired();

        builder.Property(b => b.Purpose)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(b => b.StartTime)
            .IsRequired();

        builder.Property(b => b.EndTime)
            .IsRequired();

        builder.Property(b => b.Status)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(b => b.RejectionReason)
            .HasMaxLength(500);

        builder.Property(b => b.ApprovedOrRejectedByUserId);

        builder.Property(b => b.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.Property(b => b.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("now()");

        builder.HasOne(b => b.Facility)
            .WithMany()
            .HasForeignKey(b => b.FacilityId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.BookedByUser)
            .WithMany()
            .HasForeignKey(b => b.BookedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.ApprovedOrRejectedByUser)
            .WithMany()
            .HasForeignKey(b => b.ApprovedOrRejectedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(b => b.FacilityId);
        builder.HasIndex(b => b.BookedByUserId);
        builder.HasIndex(b => b.StartTime);
        builder.HasIndex(b => b.EndTime);
        builder.HasIndex(b => b.Status);
    }
}
