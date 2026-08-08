namespace StudentCenter.Domain.Enums;

public enum RecruitmentApplicationStatus
{
    Submitted = 0,             // Student applied
    TeacherReviewed = 1,       // Reviewed by Teacher Advisor
    ChairmanRecommended = 2,   // Recommended by elected OSIS Chairman
    Approved = 3,              // Final approval by Admin & archived to Cabinet
    Rejected = 4               // Application rejected
}
