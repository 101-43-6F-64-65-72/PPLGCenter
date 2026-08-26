using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Configurations;

public class UserQuizStatConfiguration : IEntityTypeConfiguration<UserQuizStat>
{
    public void Configure(EntityTypeBuilder<UserQuizStat> builder)
    {
        builder.ToTable("UserQuizStats");

        builder.HasKey(u => u.Id);

        builder.HasOne(u => u.User)
            .WithOne()
            .HasForeignKey<UserQuizStat>(u => u.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(u => u.UserId).IsUnique();
        builder.HasIndex(u => u.TotalScore);
        builder.HasIndex(u => u.CurrentStreak);
    }
}
