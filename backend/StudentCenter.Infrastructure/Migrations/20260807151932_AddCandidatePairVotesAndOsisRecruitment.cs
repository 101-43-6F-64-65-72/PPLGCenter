using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudentCenter.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCandidatePairVotesAndOsisRecruitment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS ""CandidatePairs"" (
    ""Id"" uuid NOT NULL,
    ""ElectionId"" uuid NOT NULL,
    ""CandidateNumber"" integer NOT NULL,
    ""ChairmanUserId"" uuid NOT NULL,
    ""ViceUserId"" uuid,
    ""Vision"" text NOT NULL,
    ""Mission"" text NOT NULL,
    ""Programs"" text NOT NULL,
    ""ViceVision"" text,
    ""ViceMission"" text,
    ""PhotoUrl"" text,
    ""VicePhotoUrl"" text,
    ""Status"" integer NOT NULL,
    ""RejectionReason"" text,
    ""ApprovedAt"" timestamp with time zone,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    ""UpdatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_CandidatePairs"" PRIMARY KEY (""Id""),
    CONSTRAINT ""FK_CandidatePairs_Elections_ElectionId"" FOREIGN KEY (""ElectionId"") REFERENCES ""Elections"" (""Id"") ON DELETE CASCADE,
    CONSTRAINT ""FK_CandidatePairs_Users_ChairmanUserId"" FOREIGN KEY (""ChairmanUserId"") REFERENCES ""Users"" (""Id"") ON DELETE RESTRICT,
    CONSTRAINT ""FK_CandidatePairs_Users_ViceUserId"" FOREIGN KEY (""ViceUserId"") REFERENCES ""Users"" (""Id"") ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS ""OsisCabinetHistories"" (
    ""Id"" uuid NOT NULL,
    ""AcademicYearId"" uuid NOT NULL,
    ""StudentId"" uuid NOT NULL,
    ""PositionTitle"" text NOT NULL,
    ""Department"" text NOT NULL,
    ""PhotoUrl"" text,
    ""IsActive"" boolean NOT NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_OsisCabinetHistories"" PRIMARY KEY (""Id""),
    CONSTRAINT ""FK_OsisCabinetHistories_AcademicYears_AcademicYearId"" FOREIGN KEY (""AcademicYearId"") REFERENCES ""AcademicYears"" (""Id"") ON DELETE RESTRICT,
    CONSTRAINT ""FK_OsisCabinetHistories_Users_StudentId"" FOREIGN KEY (""StudentId"") REFERENCES ""Users"" (""Id"") ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS ""OsisPositions"" (
    ""Id"" uuid NOT NULL,
    ""AcademicYearId"" uuid NOT NULL,
    ""Title"" text NOT NULL,
    ""Department"" text NOT NULL,
    ""Description"" text NOT NULL,
    ""Capacity"" integer NOT NULL,
    ""IsOpenForRecruitment"" boolean NOT NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    ""UpdatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_OsisPositions"" PRIMARY KEY (""Id""),
    CONSTRAINT ""FK_OsisPositions_AcademicYears_AcademicYearId"" FOREIGN KEY (""AcademicYearId"") REFERENCES ""AcademicYears"" (""Id"") ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS ""CandidatePairVotes"" (
    ""Id"" uuid NOT NULL,
    ""ElectionId"" uuid NOT NULL,
    ""CandidatePairId"" uuid NOT NULL,
    ""VoterUserId"" uuid NOT NULL,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_CandidatePairVotes"" PRIMARY KEY (""Id""),
    CONSTRAINT ""FK_CandidatePairVotes_CandidatePairs_CandidatePairId"" FOREIGN KEY (""CandidatePairId"") REFERENCES ""CandidatePairs"" (""Id"") ON DELETE CASCADE,
    CONSTRAINT ""FK_CandidatePairVotes_Elections_ElectionId"" FOREIGN KEY (""ElectionId"") REFERENCES ""Elections"" (""Id"") ON DELETE CASCADE,
    CONSTRAINT ""FK_CandidatePairVotes_Users_VoterUserId"" FOREIGN KEY (""VoterUserId"") REFERENCES ""Users"" (""Id"") ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS ""OsisApplications"" (
    ""Id"" uuid NOT NULL,
    ""OsisPositionId"" uuid NOT NULL,
    ""ApplicantStudentId"" uuid NOT NULL,
    ""Motivation"" text NOT NULL,
    ""PortfolioUrl"" text,
    ""Status"" integer NOT NULL,
    ""TeacherReviewNotes"" text,
    ""ChairmanNotes"" text,
    ""AdminNotes"" text,
    ""ReviewedAt"" timestamp with time zone,
    ""CreatedAt"" timestamp with time zone NOT NULL,
    ""UpdatedAt"" timestamp with time zone NOT NULL,
    CONSTRAINT ""PK_OsisApplications"" PRIMARY KEY (""Id""),
    CONSTRAINT ""FK_OsisApplications_OsisPositions_OsisPositionId"" FOREIGN KEY (""OsisPositionId"") REFERENCES ""OsisPositions"" (""Id"") ON DELETE CASCADE,
    CONSTRAINT ""FK_OsisApplications_Users_ApplicantStudentId"" FOREIGN KEY (""ApplicantStudentId"") REFERENCES ""Users"" (""Id"") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS ""IX_CandidatePairs_ChairmanUserId"" ON ""CandidatePairs"" (""ChairmanUserId"");
CREATE INDEX IF NOT EXISTS ""IX_CandidatePairs_ElectionId"" ON ""CandidatePairs"" (""ElectionId"");
CREATE INDEX IF NOT EXISTS ""IX_CandidatePairs_ViceUserId"" ON ""CandidatePairs"" (""ViceUserId"");
CREATE INDEX IF NOT EXISTS ""IX_CandidatePairVotes_CandidatePairId"" ON ""CandidatePairVotes"" (""CandidatePairId"");
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_CandidatePairVotes_ElectionId_VoterUserId"" ON ""CandidatePairVotes"" (""ElectionId"", ""VoterUserId"");
CREATE INDEX IF NOT EXISTS ""IX_CandidatePairVotes_VoterUserId"" ON ""CandidatePairVotes"" (""VoterUserId"");
CREATE INDEX IF NOT EXISTS ""IX_OsisApplications_ApplicantStudentId"" ON ""OsisApplications"" (""ApplicantStudentId"");
CREATE INDEX IF NOT EXISTS ""IX_OsisApplications_OsisPositionId"" ON ""OsisApplications"" (""OsisPositionId"");
CREATE INDEX IF NOT EXISTS ""IX_OsisCabinetHistories_AcademicYearId"" ON ""OsisCabinetHistories"" (""AcademicYearId"");
CREATE INDEX IF NOT EXISTS ""IX_OsisCabinetHistories_StudentId"" ON ""OsisCabinetHistories"" (""StudentId"");
CREATE INDEX IF NOT EXISTS ""IX_OsisPositions_AcademicYearId"" ON ""OsisPositions"" (""AcademicYearId"");
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DROP TABLE IF EXISTS ""CandidatePairVotes"";
DROP TABLE IF EXISTS ""OsisApplications"";
DROP TABLE IF EXISTS ""OsisCabinetHistories"";
DROP TABLE IF EXISTS ""CandidatePairs"";
DROP TABLE IF EXISTS ""OsisPositions"";
");
        }
    }
}
