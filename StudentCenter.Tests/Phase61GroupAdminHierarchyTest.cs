using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

[Collection("LivePostgreSQL")]
public class Phase61GroupAdminHierarchyTest
{
    private const string ConnectionString = "Host=db.rwopazhqgvvrosdizmvt.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=L7RzTWA4ZkpBVw1B;SSL Mode=Require;Trust Server Certificate=true;Pooling=false;";

    private AppDbContext GetDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task VerifyPhase61GroupAdminHierarchyAndActions()
    {
        using var db = GetDbContext();
        var communityService = new CommunityGroupService(db);

        var studentA = await db.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Student);
        Assert.NotNull(studentA);

        var studentB = await db.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Student && u.Id != studentA.Id);
        Assert.NotNull(studentB);

        // 1. Student A creates a group
        var groupName = "Grup Uji Admin " + Guid.NewGuid().ToString("N")[..6];
        var group = await communityService.CreateGroupAsync(new CreateCommunityGroupRequest
        {
            Name = groupName,
            Description = "Grup untuk menguji hirarki admin"
        }, studentA.Id);

        Assert.NotNull(group);

        // 2. Student B is invited / added to the group
        var inviteOk = await communityService.InviteMemberAsync(group.Id, studentB.Id, studentA.Id);
        Assert.True(inviteOk);

        // 3. Student A promotes Student B to Admin
        var promoteResult = await communityService.ManageMemberAsync(group.Id, studentB.Id, new ManageMemberRequest
        {
            Status = CommunityMemberStatus.Accepted,
            Role = CommunityMemberRole.Admin
        }, studentA.Id);

        Assert.NotNull(promoteResult);
        Assert.Equal(CommunityMemberRole.Admin, promoteResult.Role);

        // 4. Student A kicks Student B from group
        var kickResult = await communityService.ManageMemberAsync(group.Id, studentB.Id, new ManageMemberRequest
        {
            Status = CommunityMemberStatus.Declined,
            Role = CommunityMemberRole.Member
        }, studentA.Id);

        Assert.NotNull(kickResult);

        // 5. Clean up test group
        await communityService.DeleteGroupAsync(group.Id, studentA.Id);
    }
}
