using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class MembershipService : IMembershipService
{
    private readonly AppDbContext _context;

    public MembershipService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> IsMemberOfExtracurricularAsync(Guid userId, Guid extracurricularId)
    {
        return await _context.ExtracurricularMembers
            .AnyAsync(m =>
                m.StudentId == userId &&
                m.ExtracurricularId == extracurricularId &&
                m.Status == "Active");
    }

    public async Task<bool> IsAdvisorOfExtracurricularAsync(Guid userId, Guid extracurricularId)
    {
        return await _context.ExtracurricularAdvisors
            .AnyAsync(a =>
                a.TeacherId == userId &&
                a.ExtracurricularId == extracurricularId);
    }

    public async Task<bool> IsLeaderOfExtracurricularAsync(Guid userId, Guid extracurricularId)
    {
        return await _context.ExtracurricularMembers
            .AnyAsync(m =>
                m.StudentId == userId &&
                m.ExtracurricularId == extracurricularId &&
                m.Status == "Active" &&
                m.Position == ExtracurricularMemberPosition.Leader);
    }

    public async Task<string?> GetPositionInExtracurricularAsync(Guid userId, Guid extracurricularId)
    {
        var member = await _context.ExtracurricularMembers
            .FirstOrDefaultAsync(m =>
                m.StudentId == userId &&
                m.ExtracurricularId == extracurricularId &&
                m.Status == "Active");

        return member?.Position.ToString();
    }
}
