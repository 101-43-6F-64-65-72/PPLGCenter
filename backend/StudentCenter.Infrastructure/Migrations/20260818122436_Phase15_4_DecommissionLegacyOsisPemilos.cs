using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudentCenter.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Phase15_4_DecommissionLegacyOsisPemilos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TABLE IF EXISTS \"CandidatePairs\" CASCADE;");
            migrationBuilder.Sql("DROP TABLE IF EXISTS \"Elections\" CASCADE;");
        }


        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Elections",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CabinetStructureJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Elections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Elections_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "OsisCabinetHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AcademicYearId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Department = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    PhotoUrl = table.Column<string>(type: "text", nullable: true),
                    PositionTitle = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OsisCabinetHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OsisCabinetHistories_AcademicYears_AcademicYearId",
                        column: x => x.AcademicYearId,
                        principalTable: "AcademicYears",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OsisCabinetHistories_Users_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "OsisPositions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AcademicYearId = table.Column<Guid>(type: "uuid", nullable: false),
                    Capacity = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Department = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    IsOpenForRecruitment = table.Column<bool>(type: "boolean", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OsisPositions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OsisPositions_AcademicYears_AcademicYearId",
                        column: x => x.AcademicYearId,
                        principalTable: "AcademicYears",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CandidatePairs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ChairmanUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ElectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    ViceUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CandidateNumber = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Mission = table.Column<string>(type: "text", nullable: false),
                    PhotoUrl = table.Column<string>(type: "text", nullable: true),
                    Programs = table.Column<string>(type: "text", nullable: false),
                    RejectionReason = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ViceMission = table.Column<string>(type: "text", nullable: true),
                    VicePhotoUrl = table.Column<string>(type: "text", nullable: true),
                    ViceVision = table.Column<string>(type: "text", nullable: true),
                    Vision = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CandidatePairs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CandidatePairs_Elections_ElectionId",
                        column: x => x.ElectionId,
                        principalTable: "Elections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CandidatePairs_Users_ChairmanUserId",
                        column: x => x.ChairmanUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CandidatePairs_Users_ViceUserId",
                        column: x => x.ViceUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ElectionCandidates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ElectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    CandidateNumber = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Mission = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    PhotoUrl = table.Column<string>(type: "text", nullable: true),
                    Vision = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ElectionCandidates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ElectionCandidates_Elections_ElectionId",
                        column: x => x.ElectionId,
                        principalTable: "Elections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ElectionCandidates_Users_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "OsisApplications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ApplicantStudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    OsisPositionId = table.Column<Guid>(type: "uuid", nullable: false),
                    AdminNotes = table.Column<string>(type: "text", nullable: true),
                    ChairmanNotes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Motivation = table.Column<string>(type: "text", nullable: false),
                    PortfolioUrl = table.Column<string>(type: "text", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    TeacherReviewNotes = table.Column<string>(type: "text", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OsisApplications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OsisApplications_OsisPositions_OsisPositionId",
                        column: x => x.OsisPositionId,
                        principalTable: "OsisPositions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OsisApplications_Users_ApplicantStudentId",
                        column: x => x.ApplicantStudentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CandidatePairVotes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CandidatePairId = table.Column<Guid>(type: "uuid", nullable: false),
                    ElectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    VoterUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CandidatePairVotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CandidatePairVotes_CandidatePairs_CandidatePairId",
                        column: x => x.CandidatePairId,
                        principalTable: "CandidatePairs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CandidatePairVotes_Elections_ElectionId",
                        column: x => x.ElectionId,
                        principalTable: "Elections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CandidatePairVotes_Users_VoterUserId",
                        column: x => x.VoterUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Votes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CandidateId = table.Column<Guid>(type: "uuid", nullable: false),
                    ElectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    VoterUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Votes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Votes_ElectionCandidates_CandidateId",
                        column: x => x.CandidateId,
                        principalTable: "ElectionCandidates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Votes_Elections_ElectionId",
                        column: x => x.ElectionId,
                        principalTable: "Elections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Votes_Users_VoterUserId",
                        column: x => x.VoterUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CandidatePairs_ChairmanUserId",
                table: "CandidatePairs",
                column: "ChairmanUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CandidatePairs_ElectionId",
                table: "CandidatePairs",
                column: "ElectionId");

            migrationBuilder.CreateIndex(
                name: "IX_CandidatePairs_ViceUserId",
                table: "CandidatePairs",
                column: "ViceUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CandidatePairVotes_CandidatePairId",
                table: "CandidatePairVotes",
                column: "CandidatePairId");

            migrationBuilder.CreateIndex(
                name: "IX_CandidatePairVotes_ElectionId_VoterUserId",
                table: "CandidatePairVotes",
                columns: new[] { "ElectionId", "VoterUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CandidatePairVotes_VoterUserId",
                table: "CandidatePairVotes",
                column: "VoterUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ElectionCandidates_ElectionId",
                table: "ElectionCandidates",
                column: "ElectionId");

            migrationBuilder.CreateIndex(
                name: "IX_ElectionCandidates_StudentId",
                table: "ElectionCandidates",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_Elections_CreatedByUserId",
                table: "Elections",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_OsisApplications_ApplicantStudentId",
                table: "OsisApplications",
                column: "ApplicantStudentId");

            migrationBuilder.CreateIndex(
                name: "IX_OsisApplications_OsisPositionId",
                table: "OsisApplications",
                column: "OsisPositionId");

            migrationBuilder.CreateIndex(
                name: "IX_OsisCabinetHistories_AcademicYearId",
                table: "OsisCabinetHistories",
                column: "AcademicYearId");

            migrationBuilder.CreateIndex(
                name: "IX_OsisCabinetHistories_StudentId",
                table: "OsisCabinetHistories",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_OsisPositions_AcademicYearId",
                table: "OsisPositions",
                column: "AcademicYearId");

            migrationBuilder.CreateIndex(
                name: "IX_Votes_CandidateId",
                table: "Votes",
                column: "CandidateId");

            migrationBuilder.CreateIndex(
                name: "IX_Votes_ElectionId_VoterUserId",
                table: "Votes",
                columns: new[] { "ElectionId", "VoterUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Votes_VoterUserId",
                table: "Votes",
                column: "VoterUserId");
        }
    }
}
