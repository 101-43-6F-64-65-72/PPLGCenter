using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class BookBorrowRequestConfiguration : IEntityTypeConfiguration<BookBorrowRequest>
{
    public void Configure(EntityTypeBuilder<BookBorrowRequest> builder)
    {
        builder.HasKey(br => br.Id);

        builder.HasIndex(br => br.BorrowerStudentId);
        builder.HasIndex(br => br.BookId);
        builder.HasIndex(br => br.Status);

        builder.HasOne(br => br.Book)
               .WithMany(b => b.BorrowRequests)
               .HasForeignKey(br => br.BookId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(br => br.BorrowerStudent)
               .WithMany()
               .HasForeignKey(br => br.BorrowerStudentId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(br => br.ApprovedByUser)
               .WithMany()
               .HasForeignKey(br => br.ApprovedByUserId)
               .OnDelete(DeleteBehavior.SetNull);
    }
}
