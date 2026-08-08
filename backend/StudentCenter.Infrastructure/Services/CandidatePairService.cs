using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class CandidatePairService : ICandidatePairService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;

    public CandidatePairService(AppDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<List<CandidatePairResponse>> GetCandidatePairsAsync(Guid electionId, Guid? currentUserId = null)
    {
        var election = await _context.Elections.FirstOrDefaultAsync(e => e.Id == electionId && e.DeletedAt == null);

        User? currentUser = null;
        if (currentUserId.HasValue)
        {
            currentUser = await _context.Users.FindAsync(currentUserId.Value);
        }

        var isAdminOrTeacher = currentUser != null && (currentUser.Role == UserRole.Admin || currentUser.Role == UserRole.Teacher);
        var isClosedOrPublished = election != null && (election.Status == ElectionStatus.Closed || election.Status == ElectionStatus.PublishedResult);
        var canSeeVoteCounts = isClosedOrPublished || isAdminOrTeacher;

        var pairs = await _context.CandidatePairs
            .AsNoTracking()
            .Where(c => c.ElectionId == electionId)
            .Include(c => c.ChairmanUser)
                .ThenInclude(u => u.Class)
            .Include(c => c.ViceUser!)
                .ThenInclude(u => u!.Class)
            .Include(c => c.Votes)
            .OrderBy(c => c.CandidateNumber)
            .ToListAsync();

        var totalVotesInElection = await _context.CandidatePairVotes.CountAsync(v => v.ElectionId == electionId);

        return pairs.Select(p => MapToResponse(p, totalVotesInElection, canSeeVoteCounts)).ToList();
    }

    public async Task<CandidatePairResponse?> GetCandidatePairByIdAsync(Guid candidatePairId, Guid? currentUserId = null)
    {
        var pair = await _context.CandidatePairs
            .AsNoTracking()
            .Where(c => c.Id == candidatePairId)
            .Include(c => c.ChairmanUser)
                .ThenInclude(u => u.Class)
            .Include(c => c.ViceUser!)
                .ThenInclude(u => u!.Class)
            .Include(c => c.Votes)
            .FirstOrDefaultAsync();

        if (pair is null) return null;

        var election = await _context.Elections.FirstOrDefaultAsync(e => e.Id == pair.ElectionId && e.DeletedAt == null);
        User? currentUser = null;
        if (currentUserId.HasValue)
        {
            currentUser = await _context.Users.FindAsync(currentUserId.Value);
        }

        var isAdminOrTeacher = currentUser != null && (currentUser.Role == UserRole.Admin || currentUser.Role == UserRole.Teacher);
        var isClosedOrPublished = election != null && (election.Status == ElectionStatus.Closed || election.Status == ElectionStatus.PublishedResult);
        var canSeeVoteCounts = isClosedOrPublished || isAdminOrTeacher;

        var totalVotesInElection = await _context.CandidatePairVotes.CountAsync(v => v.ElectionId == pair.ElectionId);
        return MapToResponse(pair, totalVotesInElection, canSeeVoteCounts);
    }

    public async Task<ElectionEligibilityResponse> CheckEligibilityAsync(Guid electionId, Guid studentId)
    {
        var reasons = new List<string>();
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == studentId);
        if (user is null || user.Role != UserRole.Student)
        {
            reasons.Add("Hanya siswa aktif yang berhak mendaftar sebagai Calon Ketua.");
            return new ElectionEligibilityResponse
            {
                ElectionId = electionId,
                StudentId = studentId,
                Eligible = false,
                IsOsisMember = false,
                AlreadyRegistered = false,
                Reasons = reasons
            };
        }

        var osisEkskul = await _context.Extracurriculars
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.IsActive && (e.Name.ToLower() == "osis" || e.Category.ToLower() == "kepemimpinan"));

        bool isOsisMember = false;
        if (osisEkskul != null)
        {
            isOsisMember = await _context.ExtracurricularMembers
                .AsNoTracking()
                .AnyAsync(m => m.ExtracurricularId == osisEkskul.Id && m.StudentId == studentId && m.Status == "Active");
        }

        if (!isOsisMember)
        {
            reasons.Add("Siswa belum menjadi anggota OSIS aktif.");
        }

        var alreadyRegistered = await _context.CandidatePairs
            .AsNoTracking()
            .AnyAsync(c => c.ElectionId == electionId && c.Status != CandidatePairStatus.Rejected && (c.ChairmanUserId == studentId || c.ViceUserId == studentId));

        if (alreadyRegistered)
        {
            reasons.Add("Anda sudah terdaftar dalam pasangan calon di pemilihan ini.");
        }

        var election = await _context.Elections.AsNoTracking().FirstOrDefaultAsync(e => e.Id == electionId && e.DeletedAt == null);
        if (election != null && election.Status != ElectionStatus.Open)
        {
            reasons.Add("Pemilihan tidak dalam status aktif.");
        }

        bool eligible = isOsisMember && !alreadyRegistered && (reasons.Count == 0);

        return new ElectionEligibilityResponse
        {
            ElectionId = electionId,
            StudentId = studentId,
            Eligible = eligible,
            IsOsisMember = isOsisMember,
            AlreadyRegistered = alreadyRegistered,
            Reasons = reasons
        };
    }

    public async Task<CandidatePairResponse> RegisterChairmanAsync(RegisterChairmanRequest request, Guid chairmanUserId)
    {
        var eligibility = await CheckEligibilityAsync(request.ElectionId, chairmanUserId);
        if (!eligibility.IsOsisMember)
        {
            throw new UnauthorizedAccessException("Hanya anggota aktif OSIS yang berhak mendaftar sebagai Calon Ketua OSIS.");
        }
        if (!eligibility.Eligible)
        {
            throw new InvalidOperationException(eligibility.Reasons.FirstOrDefault() ?? "Anda belum memenuhi syarat untuk mendaftar.");
        }

        var pair = new CandidatePair
        {
            Id = Guid.NewGuid(),
            ElectionId = request.ElectionId,
            CandidateNumber = request.CandidateNumber,
            ChairmanUserId = chairmanUserId,
            Vision = request.Vision.Trim(),
            Mission = request.Mission.Trim(),
            Programs = request.Programs.Trim(),
            PhotoUrl = request.PhotoUrl,
            Status = CandidatePairStatus.WaitingVice,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.CandidatePairs.Add(pair);
        await _context.SaveChangesAsync();

        return MapToResponse(pair, 0);
    }

    public async Task<CandidatePairResponse> ApplyViceAsync(Guid candidatePairId, ApplyViceRequest request, Guid viceUserId)
    {
        var pair = await _context.CandidatePairs.FirstOrDefaultAsync(c => c.Id == candidatePairId);
        if (pair is null) throw new KeyNotFoundException("Pasangan calon tidak ditemukan.");

        var election = await _context.Elections.FirstOrDefaultAsync(e => e.Id == pair.ElectionId && e.DeletedAt == null);
        if (election is null || election.Status == ElectionStatus.Closed || election.Status == ElectionStatus.Draft)
        {
            throw new InvalidOperationException("Pemilihan tidak dalam status menerima pendaftaran calon.");
        }

        var user = await _context.Users.FindAsync(viceUserId);
        if (user is null || user.Role != UserRole.Student)
        {
            throw new UnauthorizedAccessException("Hanya siswa yang dapat mendaftar sebagai Calon Wakil Ketua OSIS.");
        }

        if (pair.Status != CandidatePairStatus.WaitingVice)
        {
            throw new InvalidOperationException("Pasangan calon ini tidak dalam status terbuka untuk pendaftaran Calon Wakil.");
        }

        if (pair.ChairmanUserId == viceUserId)
        {
            throw new InvalidOperationException("Calon Ketua tidak dapat mendaftar sebagai Wakil pada pasangan sendiri.");
        }

        var alreadyInElection = await _context.CandidatePairs.AnyAsync(c =>
            c.ElectionId == pair.ElectionId &&
            c.Status != CandidatePairStatus.Rejected &&
            (c.ChairmanUserId == viceUserId || c.ViceUserId == viceUserId));

        if (alreadyInElection)
        {
            throw new InvalidOperationException("Anda sudah terdaftar sebagai calon Ketua atau Wakil pada pasangan calon lain di pemilihan ini.");
        }

        pair.ViceUserId = viceUserId;
        pair.ViceVision = request.ViceVision?.Trim();
        pair.ViceMission = request.ViceMission?.Trim();
        pair.VicePhotoUrl = request.VicePhotoUrl;
        pair.Status = CandidatePairStatus.WaitingChairman;
        pair.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Notify Chairman
        await _notificationService.NotifyUserAsync(
            pair.ChairmanUserId,
            "Permohonan Calon Wakil Ketua OSIS",
            "Seorang siswa telah mengajukan diri sebagai Calon Wakil Ketua pada pasangan Anda. Silakan beri persetujuan.",
            NotificationType.System,
            NotificationPriority.High,
            pair.Id.ToString(),
            NotificationReferenceType.Election
        );

        return MapToResponse(pair, 0);
    }

    public async Task<bool> ChairmanReviewViceAsync(Guid candidatePairId, bool isAccepted, Guid chairmanUserId)
    {
        var pair = await _context.CandidatePairs.FirstOrDefaultAsync(c => c.Id == candidatePairId);
        if (pair is null) throw new KeyNotFoundException("Pasangan calon tidak ditemukan.");

        if (pair.ChairmanUserId != chairmanUserId)
        {
            throw new UnauthorizedAccessException("Hanya Calon Ketua pasangan ini yang berhak menyetujui Calon Wakil.");
        }

        if (pair.Status != CandidatePairStatus.WaitingChairman)
        {
            throw new InvalidOperationException("Pasangan calon tidak dalam status menunggu persetujuan Calon Ketua.");
        }

        if (isAccepted)
        {
            pair.Status = CandidatePairStatus.WaitingTeacher;
        }
        else
        {
            pair.ViceUserId = null;
            pair.ViceVision = null;
            pair.ViceMission = null;
            pair.VicePhotoUrl = null;
            pair.Status = CandidatePairStatus.WaitingVice;
        }

        pair.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> TeacherReviewPairAsync(Guid candidatePairId, ReviewCandidatePairRequest request, Guid teacherUserId)
    {
        var pair = await _context.CandidatePairs.FirstOrDefaultAsync(c => c.Id == candidatePairId);
        if (pair is null) throw new KeyNotFoundException("Pasangan calon tidak ditemukan.");

        if (pair.Status != CandidatePairStatus.WaitingTeacher)
        {
            throw new InvalidOperationException("Pasangan calon tidak dalam status menunggu review Guru Pembina.");
        }

        if (request.IsApproved)
        {
            pair.Status = CandidatePairStatus.WaitingAdmin;
        }
        else
        {
            pair.Status = CandidatePairStatus.Rejected;
            pair.RejectionReason = request.RejectionReason;
        }

        pair.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> AdminReviewPairAsync(Guid candidatePairId, ReviewCandidatePairRequest request, Guid adminUserId)
    {
        var pair = await _context.CandidatePairs.FirstOrDefaultAsync(c => c.Id == candidatePairId);
        if (pair is null) throw new KeyNotFoundException("Pasangan calon tidak ditemukan.");

        if (pair.Status != CandidatePairStatus.WaitingAdmin)
        {
            throw new InvalidOperationException("Pasangan calon tidak dalam status menunggu persetujuan Final Admin.");
        }

        if (request.IsApproved)
        {
            pair.Status = CandidatePairStatus.Approved;
            pair.ApprovedAt = DateTime.UtcNow;
        }
        else
        {
            pair.Status = CandidatePairStatus.Rejected;
            pair.RejectionReason = request.RejectionReason;
        }

        pair.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CastVoteAsync(Guid electionId, Guid candidatePairId, Guid voterUserId)
    {
        var election = await _context.Elections.FirstOrDefaultAsync(e => e.Id == electionId && e.DeletedAt == null);
        if (election is null) throw new KeyNotFoundException("Pemilihan tidak ditemukan.");

        if (election.Status != ElectionStatus.Open)
        {
            throw new InvalidOperationException("Pemilihan tidak dalam status terbuka untuk voting.");
        }

        var now = DateTime.UtcNow;
        if (election.StartDate > now || election.EndDate < now)
        {
            throw new InvalidOperationException("Waktu voting belum dimulai atau sudah berakhir.");
        }

        var pair = await _context.CandidatePairs.FirstOrDefaultAsync(c => c.Id == candidatePairId && c.ElectionId == electionId);
        if (pair is null || pair.Status != CandidatePairStatus.Approved)
        {
            throw new InvalidOperationException("Pasangan calon tidak valid atau belum disetujui.");
        }

        var alreadyVoted = await _context.CandidatePairVotes.AnyAsync(v => v.ElectionId == electionId && v.VoterUserId == voterUserId);
        if (alreadyVoted)
        {
            throw new InvalidOperationException("Anda sudah menggunakan hak suara Anda dalam pemilihan ini.");
        }

        var vote = new CandidatePairVote
        {
            Id = Guid.NewGuid(),
            ElectionId = electionId,
            CandidatePairId = candidatePairId,
            VoterUserId = voterUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.CandidatePairVotes.Add(vote);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<PemilosLiveResultResponse?> GetLiveResultsAsync(Guid electionId, Guid? currentUserId = null)
    {
        var election = await _context.Elections.FirstOrDefaultAsync(e => e.Id == electionId && e.DeletedAt == null);
        if (election is null) return null;

        User? currentUser = null;
        if (currentUserId.HasValue)
        {
            currentUser = await _context.Users.FindAsync(currentUserId.Value);
        }

        var isAdminOrTeacher = currentUser != null && (currentUser.Role == UserRole.Admin || currentUser.Role == UserRole.Teacher);
        var isClosedOrPublished = election.Status == ElectionStatus.Closed || election.Status == ElectionStatus.PublishedResult;

        // Results are visible ONLY when election is Closed/PublishedResult for regular voters (students).
        // Admin and Teacher retain live monitoring access during Open or Closed.
        var isResultsVisible = isClosedOrPublished || isAdminOrTeacher;

        var totalEligible = await _context.Users.CountAsync(u => u.IsActive && u.Role == UserRole.Student);
        var totalVotesCast = await _context.CandidatePairVotes.CountAsync(v => v.ElectionId == electionId);
        var participationRate = totalEligible > 0 ? Math.Round((double)totalVotesCast / totalEligible * 100, 2) : 0;

        var pairs = await GetCandidatePairsAsync(electionId, currentUserId);
        var approvedPairs = pairs.Where(p => p.Status == CandidatePairStatus.Approved).OrderByDescending(p => p.VoteCount).ToList();
        var winner = isClosedOrPublished ? approvedPairs.FirstOrDefault() : null;

        return new PemilosLiveResultResponse
        {
            ElectionId = election.Id,
            ElectionTitle = election.Title,
            Status = election.Status,
            IsResultsVisible = isResultsVisible,
            TotalEligibleVoters = totalEligible,
            TotalVotesCast = isResultsVisible ? totalVotesCast : 0,
            ParticipationRate = isResultsVisible ? participationRate : 0,
            WinnerPair = winner,
            Rankings = isResultsVisible ? approvedPairs : new()
        };
    }

    private static CandidatePairResponse MapToResponse(CandidatePair p, int totalVotesInElection, bool includeVoteCount = true)
    {
        var voteCount = includeVoteCount ? (p.Votes?.Count ?? 0) : 0;
        var votePct = (includeVoteCount && totalVotesInElection > 0) ? Math.Round((double)voteCount / totalVotesInElection * 100, 2) : 0;

        return new CandidatePairResponse
        {
            Id = p.Id,
            ElectionId = p.ElectionId,
            CandidateNumber = p.CandidateNumber,
            ChairmanUserId = p.ChairmanUserId,
            ChairmanName = p.ChairmanUser?.FullName ?? "Calon Ketua",
            ChairmanNis = p.ChairmanUser?.NIS,
            ChairmanClass = p.ChairmanUser?.Class?.Name,
            PhotoUrl = p.PhotoUrl,
            ViceUserId = p.ViceUserId,
            ViceName = p.ViceUser?.FullName,
            ViceNis = p.ViceUser?.NIS,
            ViceClass = p.ViceUser?.Class?.Name,
            VicePhotoUrl = p.VicePhotoUrl,
            Vision = p.Vision,
            Mission = p.Mission,
            Programs = p.Programs,
            ViceVision = p.ViceVision,
            ViceMission = p.ViceMission,
            Status = p.Status,
            RejectionReason = p.RejectionReason,
            VoteCount = voteCount,
            VotePercentage = votePct,
            CreatedAt = p.CreatedAt
        };
    }
}
