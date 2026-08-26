using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class DailyTopicService : IDailyTopicService
{
    private readonly AppDbContext _context;
    private readonly ILogger<DailyTopicService> _logger;

    private static readonly string[] DefaultTopicsPool = new[]
    {
        "Git Flow & Merge Conflicts Resolution",
        "RESTful API Architecture & HTTP Status Standards",
        "Clean Code & SOLID Principles",
        "PostgreSQL Indexing & Query Optimization",
        "React Component Lifecycle & State Management",
        "Docker Containerization & CI/CD Pipelines",
        "Cyber Security Best Practices & OWASP Top 10",
        "Object Oriented Programming & Design Patterns (Factory, Observer, Singleton)",
        "Asynchronous Programming & Concurrency in C# / JavaScript",
        "Algorithm Complexity & Big-O Notation",
        "Microservices Architecture & Event-Driven Systems",
        "Authentication & Authorization (JWT, OAuth2, RBAC)"
    };

    public DailyTopicService(AppDbContext context, ILogger<DailyTopicService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<TopicResponse> ProposeTopicAsync(DateOnly targetDate, string topicName, string? description, Guid teacherId, string teacherName)
    {
        var existing = await _context.DailyQuizTopics
            .FirstOrDefaultAsync(t => t.TargetDate == targetDate && t.ProposedByUserId == teacherId);

        if (existing != null)
        {
            existing.TopicName = topicName.Trim();
            existing.Description = description?.Trim();
            await _context.SaveChangesAsync();
            return MapToResponse(existing, false);
        }

        var topic = new DailyQuizTopic
        {
            Id = Guid.NewGuid(),
            TargetDate = targetDate,
            TopicName = topicName.Trim(),
            Description = description?.Trim(),
            ProposedByUserId = teacherId,
            ProposedByUserName = teacherName,
            VotesCount = 0,
            Status = "Draft",
            CreatedAt = DateTime.UtcNow
        };

        _context.DailyQuizTopics.Add(topic);
        await _context.SaveChangesAsync();

        return MapToResponse(topic, false);
    }

    public async Task<bool> VoteTopicAsync(Guid topicId, Guid teacherId)
    {
        var topic = await _context.DailyQuizTopics.FindAsync(topicId);
        if (topic == null) return false;

        var existingVote = await _context.DailyTopicVotes
            .FirstOrDefaultAsync(v => v.TopicId == topicId && v.TeacherUserId == teacherId);

        if (existingVote != null)
        {
            // Cancel vote
            _context.DailyTopicVotes.Remove(existingVote);
            topic.VotesCount = Math.Max(0, topic.VotesCount - 1);
            await _context.SaveChangesAsync();
            return false;
        }

        var vote = new DailyTopicVote
        {
            Id = Guid.NewGuid(),
            TopicId = topicId,
            TeacherUserId = teacherId,
            VotedAt = DateTime.UtcNow
        };

        _context.DailyTopicVotes.Add(vote);
        topic.VotesCount += 1;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<TopicResponse>> GetTopicsForDateAsync(DateOnly targetDate, Guid? currentUserId)
    {
        var topics = await _context.DailyQuizTopics
            .AsNoTracking()
            .Include(t => t.Votes)
            .Where(t => t.TargetDate == targetDate)
            .OrderByDescending(t => t.VotesCount)
            .ThenBy(t => t.CreatedAt)
            .ToListAsync();

        return topics.Select(t =>
        {
            var hasVoted = currentUserId.HasValue && t.Votes.Any(v => v.TeacherUserId == currentUserId.Value);
            return MapToResponse(t, hasVoted);
        }).ToList();
    }

    public async Task<TopicResponse> FinalizeDailyTopicAsync(DateOnly targetDate)
    {
        var topics = await _context.DailyQuizTopics
            .Where(t => t.TargetDate == targetDate)
            .OrderByDescending(t => t.VotesCount)
            .ThenBy(t => t.CreatedAt)
            .ToListAsync();

        if (topics.Count > 0)
        {
            // The top topic wins!
            var winner = topics[0];
            winner.Status = "Selected";

            foreach (var other in topics.Skip(1))
            {
                other.Status = "Archived";
            }

            await _context.SaveChangesAsync();
            return MapToResponse(winner, false);
        }

        // Fallback: Pick randomly from DefaultTopicsPool
        var random = new Random();
        var selectedDefault = DefaultTopicsPool[random.Next(DefaultTopicsPool.Length)];

        var fallbackTopic = new DailyQuizTopic
        {
            Id = Guid.NewGuid(),
            TargetDate = targetDate,
            TopicName = selectedDefault,
            Description = "Tema resmi pilihan sistem kurikulum Rekayasa Perangkat Lunak SMK Negeri 2 Surakarta.",
            ProposedByUserId = null,
            ProposedByUserName = "Sistem Kurikulum RPL",
            VotesCount = 0,
            Status = "Selected",
            CreatedAt = DateTime.UtcNow
        };

        _context.DailyQuizTopics.Add(fallbackTopic);
        await _context.SaveChangesAsync();

        return MapToResponse(fallbackTopic, false);
    }

    public async Task<string> GetSelectedTopicNameAsync(DateOnly targetDate)
    {
        var topic = await _context.DailyQuizTopics
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.TargetDate == targetDate && t.Status == "Selected");

        if (topic != null) return topic.TopicName;

        // Try to get top voted or finalize
        var finalized = await FinalizeDailyTopicAsync(targetDate);
        return finalized.TopicName;
    }

    private static TopicResponse MapToResponse(DailyQuizTopic t, bool hasVoted)
    {
        return new TopicResponse
        {
            Id = t.Id,
            TargetDate = t.TargetDate,
            TopicName = t.TopicName,
            Description = t.Description,
            ProposedByUserId = t.ProposedByUserId,
            ProposedByUserName = t.ProposedByUserName ?? "Guru RPL",
            VotesCount = t.VotesCount,
            Status = t.Status,
            HasVotedByMe = hasVoted,
            CreatedAt = t.CreatedAt
        };
    }
}
