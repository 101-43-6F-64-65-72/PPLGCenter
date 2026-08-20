using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class ClassDivisionService : IClassDivisionService
{
    private readonly AppDbContext _context;

    public ClassDivisionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> IsUserAuthorizedToManageClassTreeAsync(Guid userId, Guid schoolClassId)
    {
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return false;

        // Admin can manage any class division tree
        if (user.Role == UserRole.Admin)
            return true;

        if (user.Role == UserRole.Teacher)
        {
            var schoolClass = await _context.SchoolClasses.AsNoTracking().FirstOrDefaultAsync(c => c.Id == schoolClassId);
            if (schoolClass != null && schoolClass.HomeroomTeacherId == userId)
                return true;

            var teachesClass = await _context.ClassSubjects
                .AsNoTracking()
                .AnyAsync(cs => cs.ClassId == schoolClassId && cs.TeacherSubject != null && cs.TeacherSubject.TeacherId == userId);

            return teachesClass;
        }

        // Ketua Kelas can manage their assigned class division tree
        var isKetuaKelas = await _context.ClassLeadership
            .AsNoTracking()
            .AnyAsync(cl => cl.SchoolClassId == schoolClassId && cl.ClassLeaderStudentId == userId && cl.IsActive);

        return isKetuaKelas;
    }

    public async Task<List<ClassDivisionNodeResponse>> GetDivisionTreeAsync(Guid schoolClassId)
    {
        var divisions = await _context.ClassDivisions
            .Include(cd => cd.LeaderStudent)
            .AsNoTracking()
            .Where(cd => cd.SchoolClassId == schoolClassId)
            .ToListAsync();

        return BuildTree(divisions, null);
    }

    public async Task<ClassDivisionNodeResponse?> GetDivisionByIdAsync(Guid divisionId)
    {
        var division = await _context.ClassDivisions
            .Include(cd => cd.LeaderStudent)
            .AsNoTracking()
            .FirstOrDefaultAsync(cd => cd.Id == divisionId);

        return division is null ? null : MapNode(division);
    }

    public async Task<ClassDivisionNodeResponse> CreateDivisionAsync(CreateClassDivisionRequest request)
    {
        // 1. Validate ParentDivisionId if supplied
        if (request.ParentDivisionId.HasValue)
        {
            var parent = await _context.ClassDivisions.FirstOrDefaultAsync(cd => cd.Id == request.ParentDivisionId.Value);
            if (parent is null)
                throw new InvalidOperationException("Parent division does not exist.");
            if (parent.SchoolClassId != request.SchoolClassId)
                throw new InvalidOperationException("Parent division belongs to a different class.");

            // Depth limit check (Max 4 levels)
            var depth = await GetDivisionDepthAsync(parent.Id);
            if (depth >= 4)
                throw new InvalidOperationException("Maximum division tree depth (4 levels) reached.");
        }

        var division = new ClassDivision
        {
            Id = Guid.NewGuid(),
            SchoolClassId = request.SchoolClassId,
            ParentDivisionId = request.ParentDivisionId,
            Name = request.Name,
            Description = request.Description,
            LeaderStudentId = request.LeaderStudentId,
            CreatedAt = DateTime.UtcNow
        };

        _context.ClassDivisions.Add(division);
        await _context.SaveChangesAsync();

        var created = await _context.ClassDivisions
            .Include(cd => cd.LeaderStudent)
            .AsNoTracking()
            .FirstAsync(cd => cd.Id == division.Id);

        return MapNode(created);
    }

    public async Task<ClassDivisionNodeResponse?> UpdateDivisionAsync(Guid divisionId, UpdateClassDivisionRequest request)
    {
        var division = await _context.ClassDivisions.FirstOrDefaultAsync(cd => cd.Id == divisionId);
        if (division is null) return null;

        if (request.ParentDivisionId.HasValue)
        {
            if (request.ParentDivisionId.Value == divisionId)
                throw new InvalidOperationException("A division cannot be its own parent.");

            // Cycle prevention check
            var isDescendant = await IsDescendantAsync(divisionId, request.ParentDivisionId.Value);
            if (isDescendant)
                throw new InvalidOperationException("Cannot assign a child node as parent (cycle detected).");

            var parent = await _context.ClassDivisions.FirstOrDefaultAsync(cd => cd.Id == request.ParentDivisionId.Value);
            if (parent is null || parent.SchoolClassId != division.SchoolClassId)
                throw new InvalidOperationException("Parent division belongs to a different class.");
        }

        division.ParentDivisionId = request.ParentDivisionId;
        division.Name = request.Name;
        division.Description = request.Description;
        division.LeaderStudentId = request.LeaderStudentId;

        await _context.SaveChangesAsync();

        var updated = await _context.ClassDivisions
            .Include(cd => cd.LeaderStudent)
            .AsNoTracking()
            .FirstAsync(cd => cd.Id == divisionId);

        return MapNode(updated);
    }

    public async Task<bool> DeleteDivisionAsync(Guid divisionId)
    {
        var division = await _context.ClassDivisions
            .Include(cd => cd.SubDivisions)
            .FirstOrDefaultAsync(cd => cd.Id == divisionId);

        if (division is null) return false;

        if (division.SubDivisions.Any())
            throw new InvalidOperationException("Cannot delete division with active sub-divisions. Delete child divisions first.");

        _context.ClassDivisions.Remove(division);
        await _context.SaveChangesAsync();
        return true;
    }

    // ─── Recursive Tree Builders & Cycle Auditors ──────────────────────────────

    private static List<ClassDivisionNodeResponse> BuildTree(List<ClassDivision> items, Guid? parentId)
    {
        return items
            .Where(cd => cd.ParentDivisionId == parentId)
            .Select(cd => new ClassDivisionNodeResponse
            {
                Id = cd.Id,
                SchoolClassId = cd.SchoolClassId,
                ParentDivisionId = cd.ParentDivisionId,
                Name = cd.Name,
                Description = cd.Description,
                LeaderStudentId = cd.LeaderStudentId,
                LeaderStudentName = cd.LeaderStudent?.FullName ?? cd.LeaderStudent?.Username,
                CreatedAt = cd.CreatedAt,
                SubDivisions = BuildTree(items, cd.Id)
            })
            .ToList();
    }

    private async Task<int> GetDivisionDepthAsync(Guid divisionId)
    {
        int depth = 1;
        var current = await _context.ClassDivisions.AsNoTracking().FirstOrDefaultAsync(cd => cd.Id == divisionId);
        while (current?.ParentDivisionId != null && depth < 10)
        {
            depth++;
            current = await _context.ClassDivisions.AsNoTracking().FirstOrDefaultAsync(cd => cd.Id == current.ParentDivisionId.Value);
        }
        return depth;
    }

    private async Task<bool> IsDescendantAsync(Guid rootId, Guid targetParentId)
    {
        var children = await _context.ClassDivisions
            .AsNoTracking()
            .Where(cd => cd.ParentDivisionId == rootId)
            .ToListAsync();

        foreach (var child in children)
        {
            if (child.Id == targetParentId) return true;
            if (await IsDescendantAsync(child.Id, targetParentId)) return true;
        }

        return false;
    }

    private static ClassDivisionNodeResponse MapNode(ClassDivision cd) => new()
    {
        Id = cd.Id,
        SchoolClassId = cd.SchoolClassId,
        ParentDivisionId = cd.ParentDivisionId,
        Name = cd.Name,
        Description = cd.Description,
        LeaderStudentId = cd.LeaderStudentId,
        LeaderStudentName = cd.LeaderStudent?.FullName ?? cd.LeaderStudent?.Username,
        CreatedAt = cd.CreatedAt
    };
}
