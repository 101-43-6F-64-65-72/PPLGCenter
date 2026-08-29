using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using StudentCenter.Application.Services;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class DailyQuizSchedulerWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DailyQuizSchedulerWorker> _logger;

    public DailyQuizSchedulerWorker(IServiceProvider serviceProvider, ILogger<DailyQuizSchedulerWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("DailyQuizSchedulerWorker background service started.");

        // Run an initial check after 10 seconds of startup
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessDailyQuizPipelineAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in DailyQuizSchedulerWorker pipeline.");
            }

            // Check every 15 minutes
            await Task.Delay(TimeSpan.FromMinutes(15), stoppingToken);
        }
    }

    private async Task ProcessDailyQuizPipelineAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var topicService = scope.ServiceProvider.GetRequiredService<IDailyTopicService>();
        var aiGenerator = scope.ServiceProvider.GetRequiredService<IAiQuizGeneratorService>();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var wibNow = DateTime.UtcNow.AddHours(7);
        var today = DateOnly.FromDateTime(wibNow);
        var tomorrow = today.AddDays(1);

        // 1. Ensure TODAY's topic & 30 initial questions are ready
        try
        {
            var existingCount = await dbContext.DailyQuizQuestions.CountAsync(q => q.TargetDate == today);
            if (existingCount == 0)
            {
                var todayTopic = await topicService.GetSelectedTopicNameAsync(today);
                _logger.LogInformation("No existing questions for today ({Date}). Triggering AI generator for topic '{Topic}'...", today, todayTopic);
                await aiGenerator.GenerateInitialDailyPoolAsync(today, todayTopic);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to verify or generate today's initial pool ({Date})", today);
        }

        // 2. If it's past 21:00 WIB (9 PM), finalize TOMORROW's topic and pre-generate tomorrow's questions
        if (wibNow.Hour >= 21)
        {
            try
            {
                var tomorrowTopic = await topicService.GetSelectedTopicNameAsync(tomorrow);
                _logger.LogInformation("Finalized tomorrow's topic: '{Topic}' for date {Date}", tomorrowTopic, tomorrow);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to finalize tomorrow's topic ({Date})", tomorrow);
            }
        }

        // 3. Automated Cleanup: Hapus bank soal hari-hari lalu (TargetDate < today) agar DB tetap bersih & ringan
        try
        {
            var oldQuestions = await dbContext.DailyQuizQuestions
                .Where(q => q.TargetDate < today)
                .ToListAsync();

            if (oldQuestions.Count > 0)
            {
                dbContext.DailyQuizQuestions.RemoveRange(oldQuestions);
                await dbContext.SaveChangesAsync();
                _logger.LogInformation("Cleaned up {Count} expired quiz questions from previous days.", oldQuestions.Count);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to cleanup expired daily quiz questions.");
        }
    }
}

