using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudentCenter.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDailyEndlessQuizSubsystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ── DailyQuizTopics ──────────────────────────────────────────────
            migrationBuilder.CreateTable(
                name: "DailyQuizTopics",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TargetDate = table.Column<DateOnly>(type: "date", nullable: false),
                    TopicName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ProposedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    ProposedByUserName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    VotesCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "Draft"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DailyQuizTopics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DailyQuizTopics_Users_ProposedByUserId",
                        column: x => x.ProposedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DailyQuizTopics_TargetDate",
                table: "DailyQuizTopics",
                column: "TargetDate");

            migrationBuilder.CreateIndex(
                name: "IX_DailyQuizTopics_Status",
                table: "DailyQuizTopics",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_DailyQuizTopics_ProposedByUserId",
                table: "DailyQuizTopics",
                column: "ProposedByUserId");

            // ── DailyTopicVotes ──────────────────────────────────────────────
            migrationBuilder.CreateTable(
                name: "DailyTopicVotes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TopicId = table.Column<Guid>(type: "uuid", nullable: false),
                    TeacherUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    VotedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DailyTopicVotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DailyTopicVotes_DailyQuizTopics_TopicId",
                        column: x => x.TopicId,
                        principalTable: "DailyQuizTopics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DailyTopicVotes_Users_TeacherUserId",
                        column: x => x.TeacherUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DailyTopicVotes_TopicId",
                table: "DailyTopicVotes",
                column: "TopicId");

            migrationBuilder.CreateIndex(
                name: "IX_DailyTopicVotes_TeacherUserId",
                table: "DailyTopicVotes",
                column: "TeacherUserId");

            // ── DailyQuizQuestions ───────────────────────────────────────────
            migrationBuilder.CreateTable(
                name: "DailyQuizQuestions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TargetDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Topic = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    QuestionNumber = table.Column<int>(type: "integer", nullable: false),
                    Difficulty = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "easy"),
                    QuestionText = table.Column<string>(type: "text", nullable: false),
                    CodeSnippet = table.Column<string>(type: "text", nullable: true),
                    OptionsJson = table.Column<string>(type: "text", nullable: false),
                    CorrectAnswerIndex = table.Column<int>(type: "integer", nullable: false),
                    Explanation = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DailyQuizQuestions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DailyQuizQuestions_TargetDate",
                table: "DailyQuizQuestions",
                column: "TargetDate");

            migrationBuilder.CreateIndex(
                name: "IX_DailyQuizQuestions_TargetDate_QuestionNumber",
                table: "DailyQuizQuestions",
                columns: new[] { "TargetDate", "QuestionNumber" },
                unique: true);

            // ── QuizSessions ─────────────────────────────────────────────────
            migrationBuilder.CreateTable(
                name: "QuizSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TargetDate = table.Column<DateOnly>(type: "date", nullable: false),
                    CurrentQuestionNumber = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    LivesRemaining = table.Column<int>(type: "integer", nullable: false, defaultValue: 3),
                    Score = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    StreakCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    MaxStreakInSession = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    TotalCorrect = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    TotalWrong = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "Active"),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FinishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuizSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuizSessions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_QuizSessions_UserId",
                table: "QuizSessions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_QuizSessions_TargetDate",
                table: "QuizSessions",
                column: "TargetDate");

            migrationBuilder.CreateIndex(
                name: "IX_QuizSessions_UserId_TargetDate",
                table: "QuizSessions",
                columns: new[] { "UserId", "TargetDate" });

            // ── UserQuizStats ─────────────────────────────────────────────────
            migrationBuilder.CreateTable(
                name: "UserQuizStats",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TotalScore = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    CurrentStreak = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    HighestStreak = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    TotalQuizzesPlayed = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    TotalCorrectAnswers = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    TotalWrongAnswers = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    LastPlayedDate = table.Column<DateOnly>(type: "date", nullable: true),
                    ScoreHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserQuizStats", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserQuizStats_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserQuizStats_UserId",
                table: "UserQuizStats",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserQuizStats_TotalScore",
                table: "UserQuizStats",
                column: "TotalScore");

            migrationBuilder.CreateIndex(
                name: "IX_UserQuizStats_CurrentStreak",
                table: "UserQuizStats",
                column: "CurrentStreak");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "UserQuizStats");
            migrationBuilder.DropTable(name: "QuizSessions");
            migrationBuilder.DropTable(name: "DailyQuizQuestions");
            migrationBuilder.DropTable(name: "DailyTopicVotes");
            migrationBuilder.DropTable(name: "DailyQuizTopics");
        }
    }
}
