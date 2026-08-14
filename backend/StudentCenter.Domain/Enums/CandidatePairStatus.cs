namespace StudentCenter.Domain.Enums;

public enum CandidatePairStatus
{
    WaitingVice = 1,      // Chairman registered, looking for Vice partner
    WaitingChairman = 2,  // Vice candidate applied, waiting for Chairman approval
    WaitingTeacher = 3,   // Chairman approved Vice, waiting for Teacher Advisor review
    WaitingAdmin = 4,     // Teacher Advisor approved, waiting for Admin final approval
    Approved = 5,         // Fully approved & published on ballot
    Rejected = 6          // Rejected with reason
}
