using Microsoft.EntityFrameworkCore;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Announcement> Announcements => Set<Announcement>();
    public DbSet<Material> Materials => Set<Material>();
    public DbSet<Assignment> Assignments => Set<Assignment>();
    public DbSet<Submission> Submissions => Set<Submission>();
    public DbSet<CalendarEvent> CalendarEvents => Set<CalendarEvent>();
    public DbSet<AnnouncementComment> AnnouncementComments => Set<AnnouncementComment>();
    public DbSet<AnnouncementReaction> AnnouncementReactions => Set<AnnouncementReaction>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Facility> Facilities => Set<Facility>();
    public DbSet<FacilityBooking> FacilityBookings => Set<FacilityBooking>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
