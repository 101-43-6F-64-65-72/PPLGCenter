using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IQuizService
{
    Task<TodayQuizInfoResponse> GetTodayQuizInfoAsync(DateOnly date, Guid userId);
    Task<StartQuizResponse> StartQuizSessionAsync(DateOnly date, Guid userId);
    Task<ClientQuestionResponse?> GetCurrentQuestionAsync(Guid sessionId, Guid userId);
    Task<SubmitAnswerResponse> SubmitAnswerAsync(Guid sessionId, SubmitAnswerRequest request, Guid userId);
    Task<QuizSessionSummaryResponse> SurrenderSessionAsync(Guid sessionId, Guid userId);
    Task<List<QuizLeaderboardItemResponse>> GetDailyLeaderboardAsync(DateOnly date, int limit = 50);
    Task<List<QuizLeaderboardItemResponse>> GetAllTimeLeaderboardAsync(int limit = 50);
    Task<UserQuizProfileResponse> GetUserQuizStatsAsync(Guid userId);
}
