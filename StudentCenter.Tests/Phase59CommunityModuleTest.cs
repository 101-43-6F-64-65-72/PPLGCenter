using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

[Collection("LivePostgreSQL")]
public class Phase59CommunityModuleTest
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
    public async Task VerifyPhase59CommunityModuleFeatures()
    {
        using var db = GetDbContext();
        var communityService = new CommunityGroupService(db);

        var studentA = await db.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Student);
        Assert.NotNull(studentA);

        var studentB = await db.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Student && u.Id != studentA.Id);
        Assert.NotNull(studentB);

        var teacher = await db.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Teacher);
        Assert.NotNull(teacher);

        // 1. Test Private Group Creation by Student A
        var groupName = "Grup Rahasia Siswa " + Guid.NewGuid().ToString("N")[..6];
        var createdGroup = await communityService.CreateGroupAsync(new CreateCommunityGroupRequest
        {
            Name = groupName,
            Description = "Deskripsi Grup Rahasia"
        }, studentA.Id);

        Assert.NotNull(createdGroup);
        Assert.Equal(groupName, createdGroup.Name);

        // 2. Verify Private Scoping: Student A can see group, Student B cannot see it yet
        var studentAGroups = await communityService.GetGroupsAsync(studentA.Id, 1, 50, groupName);
        Assert.Contains(studentAGroups.Items, g => g.Id == createdGroup.Id);

        var studentBGroups = await communityService.GetGroupsAsync(studentB.Id, 1, 50, groupName);
        Assert.DoesNotContain(studentBGroups.Items, g => g.Id == createdGroup.Id);

        // 3. Search User & Invite Student B to the Group
        var searchResults = await communityService.SearchUsersForInviteAsync(createdGroup.Id, studentB.FullName[..3], studentA.Id);
        Assert.NotEmpty(searchResults);

        var inviteSuccess = await communityService.InviteMemberAsync(createdGroup.Id, studentB.Id, studentA.Id);
        Assert.True(inviteSuccess);

        // 4. Verify Invitation appears in Student B's Inbox
        var studentBInvitations = await communityService.GetInvitationsAsync(studentB.Id);
        Assert.Contains(studentBInvitations, i => i.GroupId == createdGroup.Id);

        var targetInvitation = studentBInvitations.First(i => i.GroupId == createdGroup.Id);

        // 5. Student B accepts the invitation
        var respondSuccess = await communityService.RespondToInvitationAsync(targetInvitation.MembershipId, accept: true, studentB.Id);
        Assert.True(respondSuccess);

        // 6. Verify Student B can now see the private group in their feed
        var studentBGroupsAfterAccept = await communityService.GetGroupsAsync(studentB.Id, 1, 50, groupName);
        Assert.Contains(studentBGroupsAfterAccept.Items, g => g.Id == createdGroup.Id);

        // 7. Verify Teacher Batch Member Creation
        var teacherGroupName = "Grup Mapel " + Guid.NewGuid().ToString("N")[..6];
        var teacherGroup = await communityService.CreateGroupAsync(new CreateCommunityGroupRequest
        {
            Name = teacherGroupName,
            Description = "Grup Pembelajaran PPLG",
            InitialMemberUserIds = new System.Collections.Generic.List<Guid> { studentA.Id, studentB.Id }
        }, teacher.Id);

        Assert.NotNull(teacherGroup);
        Assert.Equal(3, teacherGroup.MemberCount); // Teacher + Student A + Student B
    }
}
