using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Application.Services;

public interface IAiQuizGeneratorService
{
    Task<List<GeneratedQuestionJsonItem>> GenerateQuestionsChunkAsync(string topic, string difficulty, int count, string? model = null, string? provider = null);
    Task<List<DailyQuizQuestion>> GenerateInitialDailyPoolAsync(DateOnly date, string topic, string? model = null, string? provider = null);
    Task<List<DailyQuizQuestion>> GenerateEndlessBatchAsync(DateOnly date, string topic, int startQuestionNumber, int count = 10);
}
