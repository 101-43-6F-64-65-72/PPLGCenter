using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IDailyTopicService
{
    Task<TopicResponse> ProposeTopicAsync(DateOnly targetDate, string topicName, string? description, Guid teacherId, string teacherName);
    Task<bool> VoteTopicAsync(Guid topicId, Guid teacherId);
    Task<List<TopicResponse>> GetTopicsForDateAsync(DateOnly targetDate, Guid? currentUserId);
    Task<TopicResponse> FinalizeDailyTopicAsync(DateOnly targetDate);
    Task<TopicResponse> PickRandomTopicAsync(DateOnly targetDate);
    Task<string> GetSelectedTopicNameAsync(DateOnly targetDate);
}
