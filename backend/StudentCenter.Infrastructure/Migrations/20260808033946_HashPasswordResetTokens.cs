using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudentCenter.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class HashPasswordResetTokens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PasswordResetRequests_ResetToken",
                table: "PasswordResetRequests");

            migrationBuilder.DropColumn(
                name: "ResetToken",
                table: "PasswordResetRequests");

            migrationBuilder.AddColumn<string>(
                name: "ResetTokenHash",
                table: "PasswordResetRequests",
                type: "character varying(128)",
                maxLength: 128,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetRequests_ResetTokenHash",
                table: "PasswordResetRequests",
                column: "ResetTokenHash");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PasswordResetRequests_ResetTokenHash",
                table: "PasswordResetRequests");

            migrationBuilder.DropColumn(
                name: "ResetTokenHash",
                table: "PasswordResetRequests");

            migrationBuilder.AddColumn<string>(
                name: "ResetToken",
                table: "PasswordResetRequests",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetRequests_ResetToken",
                table: "PasswordResetRequests",
                column: "ResetToken");
        }
    }
}
