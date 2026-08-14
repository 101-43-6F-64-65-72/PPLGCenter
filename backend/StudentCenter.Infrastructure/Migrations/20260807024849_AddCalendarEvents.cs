using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudentCenter.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCalendarEvents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AdminComment",
                table: "Proposals",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AttachmentUrl",
                table: "Proposals",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Proposals",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "StudentId",
                table: "Proposals",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "SubmittedAt",
                table: "Proposals",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "TeacherComment",
                table: "Proposals",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Facilities",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "CoachName",
                table: "Extracurriculars",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CoachPhoneNumber",
                table: "Extracurriculars",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Day",
                table: "Extracurriculars",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EndTime",
                table: "Extracurriculars",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaximumMembers",
                table: "Extracurriculars",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "RegistrationOpen",
                table: "Extracurriculars",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "StartTime",
                table: "Extracurriculars",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Color",
                table: "CalendarEvents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "CalendarEvents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EndTime",
                table: "CalendarEvents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EventDate",
                table: "CalendarEvents",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "StartTime",
                table: "CalendarEvents",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Visibility",
                table: "CalendarEvents",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "Elections",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
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
                name: "ElectionCandidates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ElectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    Vision = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Mission = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    PhotoUrl = table.Column<string>(type: "text", nullable: true),
                    CandidateNumber = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
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
                name: "Votes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ElectionId = table.Column<Guid>(type: "uuid", nullable: false),
                    CandidateId = table.Column<Guid>(type: "uuid", nullable: false),
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Votes");

            migrationBuilder.DropTable(
                name: "ElectionCandidates");

            migrationBuilder.DropTable(
                name: "Elections");

            migrationBuilder.DropColumn(
                name: "AdminComment",
                table: "Proposals");

            migrationBuilder.DropColumn(
                name: "AttachmentUrl",
                table: "Proposals");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "Proposals");

            migrationBuilder.DropColumn(
                name: "StudentId",
                table: "Proposals");

            migrationBuilder.DropColumn(
                name: "SubmittedAt",
                table: "Proposals");

            migrationBuilder.DropColumn(
                name: "TeacherComment",
                table: "Proposals");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Facilities");

            migrationBuilder.DropColumn(
                name: "CoachName",
                table: "Extracurriculars");

            migrationBuilder.DropColumn(
                name: "CoachPhoneNumber",
                table: "Extracurriculars");

            migrationBuilder.DropColumn(
                name: "Day",
                table: "Extracurriculars");

            migrationBuilder.DropColumn(
                name: "EndTime",
                table: "Extracurriculars");

            migrationBuilder.DropColumn(
                name: "MaximumMembers",
                table: "Extracurriculars");

            migrationBuilder.DropColumn(
                name: "RegistrationOpen",
                table: "Extracurriculars");

            migrationBuilder.DropColumn(
                name: "StartTime",
                table: "Extracurriculars");

            migrationBuilder.DropColumn(
                name: "Color",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "EndTime",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "EventDate",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "StartTime",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "Visibility",
                table: "CalendarEvents");
        }
    }
}
