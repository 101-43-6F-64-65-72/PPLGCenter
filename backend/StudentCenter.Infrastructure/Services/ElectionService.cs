using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class ElectionService : IElectionService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;

    public ElectionService(AppDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<PagedResult<ElectionResponse>> GetElectionsAsync(int page, int pageSize, Guid? currentUserId = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Elections
            .AsNoTracking()
            .Where(e => e.DeletedAt == null);

        var totalCount = await query.CountAsync();

        var elections = await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(e => e.CreatedByUser)
            .Include(e => e.Candidates)
                .ThenInclude(c => c.Student)
            .Include(e => e.Votes)
            .ToListAsync();

        var items = elections.Select(e => MapToResponse(e, currentUserId)).ToList();

        return new PagedResult<ElectionResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<ElectionResponse?> GetElectionByIdAsync(Guid id, Guid? currentUserId = null)
    {
        var election = await _context.Elections
            .AsNoTracking()
            .Where(e => e.Id == id && e.DeletedAt == null)
            .Include(e => e.CreatedByUser)
            .Include(e => e.Candidates)
                .ThenInclude(c => c.Student)
            .Include(e => e.Votes)
            .FirstOrDefaultAsync();

        if (election is null) return null;

        return MapToResponse(election, currentUserId);
    }

    public async Task<ElectionResponse> CreateElectionAsync(CreateElectionRequest request, Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user is null) throw new KeyNotFoundException("User tidak ditemukan.");

        var election = new Election
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            StartDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc),
            EndDate = DateTime.SpecifyKind(request.EndDate, DateTimeKind.Utc),
            Status = ElectionStatus.Draft,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Elections.Add(election);
        await _context.SaveChangesAsync();

        return MapToResponse(election, userId);
    }

    public async Task<ElectionResponse?> UpdateElectionAsync(Guid id, UpdateElectionRequest request, Guid userId, string userRole)
    {
        var election = await _context.Elections
            .Include(e => e.Candidates)
            .FirstOrDefaultAsync(e => e.Id == id && e.DeletedAt == null);

        if (election is null) return null;

        if (userRole != "Admin" && election.CreatedByUserId != userId)
        {
            throw new UnauthorizedAccessException("Anda tidak berhak mengubah pemilu ini.");
        }

        election.Title = request.Title.Trim();
        election.Description = request.Description.Trim();
        election.StartDate = request.StartDate;
        election.EndDate = request.EndDate;
        election.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToResponse(election, userId);
    }

    public async Task<bool> DeleteElectionAsync(Guid id, Guid userId, string userRole)
    {
        var election = await _context.Elections
            .FirstOrDefaultAsync(e => e.Id == id && e.DeletedAt == null);

        if (election is null) return false;

        if (userRole != "Admin" && election.CreatedByUserId != userId)
        {
            throw new UnauthorizedAccessException("Anda tidak berhak menghapus pemilu ini.");
        }

        election.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<ElectionCandidateResponse> AddCandidateAsync(Guid electionId, CreateCandidateRequest request, Guid userId, string userRole)
    {
        var election = await _context.Elections.FirstOrDefaultAsync(e => e.Id == electionId && e.DeletedAt == null);
        if (election is null) throw new KeyNotFoundException("Pemilu tidak ditemukan.");

        var student = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.StudentId);
        if (student is null) throw new KeyNotFoundException("Siswa kandidat tidak ditemukan.");

        var candidate = new ElectionCandidate
        {
            Id = Guid.NewGuid(),
            ElectionId = electionId,
            StudentId = request.StudentId,
            Vision = request.Vision.Trim(),
            Mission = request.Mission.Trim(),
            PhotoUrl = request.PhotoUrl,
            CandidateNumber = request.CandidateNumber,
            CreatedAt = DateTime.UtcNow
        };

        _context.ElectionCandidates.Add(candidate);
        await _context.SaveChangesAsync();

        return new ElectionCandidateResponse
        {
            Id = candidate.Id,
            ElectionId = candidate.ElectionId,
            StudentId = candidate.StudentId,
            StudentName = student.FullName,
            StudentNis = student.NIS,
            Vision = candidate.Vision,
            Mission = candidate.Mission,
            PhotoUrl = candidate.PhotoUrl,
            CandidateNumber = candidate.CandidateNumber
        };
    }

    public async Task<bool> RemoveCandidateAsync(Guid electionId, Guid candidateId, Guid userId, string userRole)
    {
        var candidate = await _context.ElectionCandidates
            .FirstOrDefaultAsync(c => c.Id == candidateId && c.ElectionId == electionId);

        if (candidate is null) return false;

        _context.ElectionCandidates.Remove(candidate);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> OpenElectionAsync(Guid electionId, Guid userId, string userRole)
    {
        var election = await _context.Elections.FirstOrDefaultAsync(e => e.Id == electionId && e.DeletedAt == null);
        if (election is null) return false;

        election.Status = ElectionStatus.Open;
        election.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Broadcast notification to all active users
        var userIds = await _context.Users.Where(u => u.IsActive).Select(u => u.Id).ToListAsync();
        foreach (var uid in userIds)
        {
            await _notificationService.NotifyUserAsync(
                uid,
                "Pemilihan Ketua OSIS Dibuka",
                $"Pemilihan '{election.Title}' telah resmi dibuka! Berikan suara Anda sekarang.",
                NotificationType.ElectionOpen,
                NotificationPriority.High,
                election.Id.ToString(),
                NotificationReferenceType.Election
            );
        }

        return true;
    }

    public async Task<bool> CloseElectionAsync(Guid electionId, Guid userId, string userRole)
    {
        var election = await _context.Elections.FirstOrDefaultAsync(e => e.Id == electionId && e.DeletedAt == null);
        if (election is null) return false;

        election.Status = ElectionStatus.Closed;
        election.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var userIds = await _context.Users.Where(u => u.IsActive).Select(u => u.Id).ToListAsync();
        foreach (var uid in userIds)
        {
            await _notificationService.NotifyUserAsync(
                uid,
                "Pemilihan Ketua OSIS Ditutup",
                $"Pemilihan '{election.Title}' telah ditutup.",
                NotificationType.ElectionClosed,
                NotificationPriority.Normal,
                election.Id.ToString(),
                NotificationReferenceType.Election
            );
        }

        return true;
    }

    public async Task<bool> PublishResultAsync(Guid electionId, Guid userId, string userRole)
    {
        var election = await _context.Elections.FirstOrDefaultAsync(e => e.Id == electionId && e.DeletedAt == null);
        if (election is null) return false;

        election.Status = ElectionStatus.PublishedResult;
        election.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var userIds = await _context.Users.Where(u => u.IsActive).Select(u => u.Id).ToListAsync();
        foreach (var uid in userIds)
        {
            await _notificationService.NotifyUserAsync(
                uid,
                "Hasil Pemilihan OSIS Diumumkan",
                $"Hasil resmi pemilihan '{election.Title}' telah dipublikasikan!",
                NotificationType.ElectionResultPublished,
                NotificationPriority.High,
                election.Id.ToString(),
                NotificationReferenceType.Election
            );
        }

        return true;
    }

    public async Task<bool> VoteAsync(Guid electionId, VoteRequest request, Guid voterUserId)
    {
        var election = await _context.Elections
            .Include(e => e.Candidates)
            .FirstOrDefaultAsync(e => e.Id == electionId && e.DeletedAt == null);

        if (election is null) throw new KeyNotFoundException("Pemilu tidak ditemukan.");

        if (election.Status != ElectionStatus.Open)
        {
            throw new InvalidOperationException("Pemilu tidak dalam status dibuka untuk voting.");
        }

        var now = DateTime.UtcNow;
        if (election.StartDate > now || election.EndDate < now)
        {
            throw new InvalidOperationException("Waktu voting telah berakhir atau belum dimulai.");
        }

        var candidateExists = election.Candidates.Any(c => c.Id == request.CandidateId);
        if (!candidateExists)
        {
            throw new KeyNotFoundException("Kandidat pilihan tidak valid.");
        }

        var alreadyVoted = await _context.Votes
            .AnyAsync(v => v.ElectionId == electionId && v.VoterUserId == voterUserId);

        if (alreadyVoted)
        {
            throw new InvalidOperationException("Anda sudah memberikan suara pada pemilihan ini.");
        }

        var vote = new Vote
        {
            Id = Guid.NewGuid(),
            ElectionId = electionId,
            CandidateId = request.CandidateId,
            VoterUserId = voterUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Votes.Add(vote);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<ElectionResultResponse?> GetResultAsync(Guid electionId)
    {
        var election = await _context.Elections
            .AsNoTracking()
            .Include(e => e.Candidates)
                .ThenInclude(c => c.Student)
            .Include(e => e.Votes)
            .FirstOrDefaultAsync(e => e.Id == electionId && e.DeletedAt == null);

        if (election is null) return null;

        var totalEligible = await _context.Users.CountAsync(u => u.IsActive);
        var totalVotes = election.Votes.Count;
        var participationRate = totalEligible > 0 ? Math.Round((double)totalVotes / totalEligible * 100, 2) : 0;

        var candidateResults = election.Candidates.Select(c =>
        {
            var count = election.Votes.Count(v => v.CandidateId == c.Id);
            var pct = totalVotes > 0 ? Math.Round((double)count / totalVotes * 100, 2) : 0;
            return new ElectionCandidateResponse
            {
                Id = c.Id,
                ElectionId = c.ElectionId,
                StudentId = c.StudentId,
                StudentName = c.Student?.FullName ?? "Kandidat",
                StudentNis = c.Student?.NIS,
                Vision = c.Vision,
                Mission = c.Mission,
                PhotoUrl = c.PhotoUrl,
                CandidateNumber = c.CandidateNumber,
                VoteCount = count,
                VotePercentage = pct
            };
        })
        .OrderByDescending(c => c.VoteCount)
        .ThenBy(c => c.CandidateNumber)
        .ToList();

        var winner = candidateResults.FirstOrDefault();

        return new ElectionResultResponse
        {
            ElectionId = election.Id,
            ElectionTitle = election.Title,
            TotalVotes = totalVotes,
            ParticipationRate = participationRate,
            WinnerCandidate = winner,
            CandidateRankings = candidateResults
        };
    }

    public async Task<ParticipationResponse?> GetParticipationAsync(Guid electionId)
    {
        var election = await _context.Elections
            .AsNoTracking()
            .Include(e => e.Votes)
            .FirstOrDefaultAsync(e => e.Id == electionId && e.DeletedAt == null);

        if (election is null) return null;

        var totalEligible = await _context.Users.CountAsync(u => u.IsActive);
        var totalVoted = election.Votes.Count;
        var rate = totalEligible > 0 ? Math.Round((double)totalVoted / totalEligible * 100, 2) : 0;

        return new ParticipationResponse
        {
            ElectionId = electionId,
            TotalEligibleVoters = totalEligible,
            TotalVoted = totalVoted,
            ParticipationRate = rate
        };
    }

    public async Task<bool> StartPemilosAsync(Guid electionId, StartPemilosRequest request, Guid userId, string userRole)
    {
        var election = await _context.Elections.FirstOrDefaultAsync(e => e.Id == electionId && e.DeletedAt == null);
        if (election is null) throw new KeyNotFoundException("Sesi Pemilos tidak ditemukan.");

        var approvedPairsCount = await _context.CandidatePairs.CountAsync(c => c.ElectionId == electionId && c.Status == CandidatePairStatus.Approved);
        if (approvedPairsCount < 2)
        {
            throw new InvalidOperationException("Pemilos belum dapat dimulai karena pasangan calon disetujui kurang dari 2 pasang (minimal 2 pasang kandidat disetujui).");
        }

        election.StartDate = request.StartDate;
        election.EndDate = request.EndDate;
        election.CabinetStructureJson = request.CabinetStructureJson;
        election.Status = ElectionStatus.Open;
        election.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> StopPemilosAsync(Guid electionId, Guid userId, string userRole)
    {
        var election = await _context.Elections.FirstOrDefaultAsync(e => e.Id == electionId && e.DeletedAt == null);
        if (election is null) throw new KeyNotFoundException("Sesi Pemilos tidak ditemukan.");

        election.Status = ElectionStatus.Closed;
        election.UpdatedAt = DateTime.UtcNow;

        // Determine winning CandidatePair
        var pairs = await _context.CandidatePairs
            .Include(c => c.ChairmanUser)
            .Include(c => c.ViceUser)
            .Include(c => c.Votes)
            .Where(c => c.ElectionId == electionId && c.Status != CandidatePairStatus.Rejected)
            .ToListAsync();

        var winningPair = pairs
            .OrderByDescending(p => p.Votes.Count)
            .FirstOrDefault();

        if (winningPair != null && winningPair.ChairmanUserId != Guid.Empty)
        {
            var activeYear = await _context.AcademicYears.FirstOrDefaultAsync(a => a.IsActive)
                ?? await _context.AcademicYears.OrderByDescending(a => a.StartDate).FirstOrDefaultAsync();

            if (activeYear is null)
            {
                activeYear = new AcademicYear
                {
                    Id = Guid.NewGuid(),
                    Name = "2025/2026",
                    StartDate = DateTime.UtcNow,
                    EndDate = DateTime.UtcNow.AddYears(1),
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                _context.AcademicYears.Add(activeYear);
                await _context.SaveChangesAsync();
            }

            // Deactivate previous active cabinet members
            var previousMembers = await _context.OsisCabinetHistories
                .Where(h => h.IsActive)
                .ToListAsync();
            foreach (var prev in previousMembers)
            {
                prev.IsActive = false;
            }

            // Add Chairman
            _context.OsisCabinetHistories.Add(new OsisCabinetHistory
            {
                Id = Guid.NewGuid(),
                AcademicYearId = activeYear.Id,
                StudentId = winningPair.ChairmanUserId,
                PositionTitle = "Ketua OSIS",
                Department = "BPH",
                PhotoUrl = winningPair.PhotoUrl ?? winningPair.ChairmanUser?.PhotoUrl,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });

            // Add Vice Chairman
            if (winningPair.ViceUserId.HasValue)
            {
                _context.OsisCabinetHistories.Add(new OsisCabinetHistory
                {
                    Id = Guid.NewGuid(),
                    AcademicYearId = activeYear.Id,
                    StudentId = winningPair.ViceUserId.Value,
                    PositionTitle = "Wakil Ketua OSIS",
                    Department = "BPH",
                    PhotoUrl = winningPair.VicePhotoUrl ?? winningPair.ViceUser?.PhotoUrl,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Parse CabinetStructureJson if available to populate Secretary, Treasurer, and Custom Divisions
            if (!string.IsNullOrWhiteSpace(election.CabinetStructureJson))
            {
                try
                {
                    using var doc = System.Text.Json.JsonDocument.Parse(election.CabinetStructureJson);
                    var root = doc.RootElement;

                    async Task AddMemberAsync(string propIdName, string propLabelName, string title, string dept)
                    {
                        string? rawValue = null;
                        if (root.TryGetProperty(propIdName, out var elemId) && elemId.ValueKind == System.Text.Json.JsonValueKind.String)
                        {
                            rawValue = elemId.GetString();
                        }
                        if (string.IsNullOrWhiteSpace(rawValue) && root.TryGetProperty(propLabelName, out var elemLabel) && elemLabel.ValueKind == System.Text.Json.JsonValueKind.String)
                        {
                            rawValue = elemLabel.GetString();
                        }

                        if (!string.IsNullOrWhiteSpace(rawValue))
                        {
                            Guid studentGuid = Guid.Empty;
                            if (Guid.TryParse(rawValue, out var parsedGuid))
                            {
                                studentGuid = parsedGuid;
                            }
                            else
                            {
                                // Try finding user by name prefix
                                var cleanName = rawValue.Split('(')[0].Trim();
                                var foundUser = await _context.Users.FirstOrDefaultAsync(u => u.FullName.Contains(cleanName));
                                if (foundUser != null)
                                {
                                    studentGuid = foundUser.Id;
                                }
                            }

                            if (studentGuid == Guid.Empty)
                            {
                                studentGuid = winningPair.ChairmanUserId; // fallback if student not in DB
                            }

                            _context.OsisCabinetHistories.Add(new OsisCabinetHistory
                            {
                                Id = Guid.NewGuid(),
                                AcademicYearId = activeYear.Id,
                                StudentId = studentGuid,
                                PositionTitle = title,
                                Department = dept,
                                IsActive = true,
                                CreatedAt = DateTime.UtcNow
                            });
                        }
                    }

                    await AddMemberAsync("secretary1Id", "secretary1", "Sekretaris 1", "Sekretaris");
                    await AddMemberAsync("secretary2Id", "secretary2", "Sekretaris 2", "Sekretaris");
                    await AddMemberAsync("treasurer1Id", "treasurer1", "Bendahara 1", "Bendahara");
                    await AddMemberAsync("treasurer2Id", "treasurer2", "Bendahara 2", "Bendahara");

                    // Parse customDivisions
                    if (root.TryGetProperty("customDivisions", out var divElem) && divElem.ValueKind == System.Text.Json.JsonValueKind.Array)
                    {
                        foreach (var item in divElem.EnumerateArray())
                        {
                            string divName = item.TryGetProperty("divisionName", out var dProp) ? dProp.GetString() ?? "Divisi OSIS" : "Divisi OSIS";
                            string studVal = item.TryGetProperty("studentName", out var sProp) ? sProp.GetString() ?? "" : "";
                            if (item.TryGetProperty("studentId", out var sIdProp) && !string.IsNullOrWhiteSpace(sIdProp.GetString()))
                            {
                                studVal = sIdProp.GetString()!;
                            }

                            if (!string.IsNullOrWhiteSpace(divName))
                            {
                                Guid sGuid = Guid.Empty;
                                if (Guid.TryParse(studVal, out var parsedSGuid))
                                {
                                    sGuid = parsedSGuid;
                                }
                                else if (!string.IsNullOrWhiteSpace(studVal))
                                {
                                    var cleanName = studVal.Split('(')[0].Trim();
                                    var foundUser = await _context.Users.FirstOrDefaultAsync(u => u.FullName.Contains(cleanName));
                                    if (foundUser != null) sGuid = foundUser.Id;
                                }

                                if (sGuid == Guid.Empty) sGuid = winningPair.ChairmanUserId;

                                _context.OsisCabinetHistories.Add(new OsisCabinetHistory
                                {
                                    Id = Guid.NewGuid(),
                                    AcademicYearId = activeYear.Id,
                                    StudentId = sGuid,
                                    PositionTitle = divName,
                                    Department = divName,
                                    IsActive = true,
                                    CreatedAt = DateTime.UtcNow
                                });
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[StopPemilos CabinetJson Parse Error] {ex.Message}");
                }
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ResetAndStartNewPemilosAsync(Guid electionId, Guid userId, string userRole)
    {
        var election = await _context.Elections.FirstOrDefaultAsync(e => e.Id == electionId && e.DeletedAt == null);
        if (election is null) throw new KeyNotFoundException("Sesi Pemilos tidak ditemukan.");

        if (userRole != "Teacher" && userRole != "Admin")
            throw new UnauthorizedAccessException("Hanya Guru Pembina OSIS atau Admin yang dapat mereset dan memulai periode Pemilos baru.");

        // 1. Archive current active OSIS cabinet members
        var activeYear = await _context.AcademicYears.FirstOrDefaultAsync(y => y.IsActive)
            ?? await _context.AcademicYears.FirstOrDefaultAsync();

        var activeMembers = await _context.OsisCabinetHistories
            .Where(h => h.IsActive)
            .ToListAsync();
        foreach (var member in activeMembers)
        {
            member.IsActive = false;
            if (activeYear != null && (member.AcademicYearId == Guid.Empty || member.AcademicYearId == null))
            {
                member.AcademicYearId = activeYear.Id;
            }
        }

        // 2. Clear candidate pairs and votes for this election
        var votes = await _context.CandidatePairVotes
            .Where(v => v.ElectionId == electionId)
            .ToListAsync();
        _context.CandidatePairVotes.RemoveRange(votes);

        var pairs = await _context.CandidatePairs
            .Where(c => c.ElectionId == electionId)
            .ToListAsync();
        _context.CandidatePairs.RemoveRange(pairs);

        // 3. Reset Election status to Draft (0 = fresh setup state)
        election.Status = ElectionStatus.Draft;
        election.CabinetStructureJson = null;
        election.StartDate = DateTime.UtcNow;
        election.EndDate = DateTime.UtcNow.AddDays(7);
        election.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    private static ElectionResponse MapToResponse(Election e, Guid? currentUserId)
    {
        var totalVotes = e.Votes?.Count ?? 0;
        var userVote = currentUserId.HasValue ? e.Votes?.FirstOrDefault(v => v.VoterUserId == currentUserId.Value) : null;

        return new ElectionResponse
        {
            Id = e.Id,
            Title = e.Title,
            Description = e.Description,
            StartDate = e.StartDate,
            EndDate = e.EndDate,
            Status = e.Status,
            HasVoted = userVote != null,
            VotedCandidateId = userVote?.CandidateId,
            CabinetStructureJson = e.CabinetStructureJson,
            CreatedByUserId = e.CreatedByUserId,
            CreatedByUserName = e.CreatedByUser?.FullName ?? "Admin",
            CreatedAt = e.CreatedAt,
            UpdatedAt = e.UpdatedAt,
            Candidates = e.Candidates?.Select(c =>
            {
                var count = e.Votes?.Count(v => v.CandidateId == c.Id) ?? 0;
                var pct = totalVotes > 0 ? Math.Round((double)count / totalVotes * 100, 2) : 0;
                return new ElectionCandidateResponse
                {
                    Id = c.Id,
                    ElectionId = c.ElectionId,
                    StudentId = c.StudentId,
                    StudentName = c.Student?.FullName ?? "Kandidat",
                    StudentNis = c.Student?.NIS,
                    Vision = c.Vision,
                    Mission = c.Mission,
                    PhotoUrl = c.PhotoUrl,
                    CandidateNumber = c.CandidateNumber,
                    VoteCount = count,
                    VotePercentage = pct
                };
            }).OrderBy(c => c.CandidateNumber).ToList() ?? new()
        };
    }
}
