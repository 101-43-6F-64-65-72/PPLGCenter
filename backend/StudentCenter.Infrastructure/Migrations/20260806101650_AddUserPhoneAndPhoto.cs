using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudentCenter.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserPhoneAndPhoto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NIM",
                table: "Users",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NIS",
                table: "Users",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NISN",
                table: "Users",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhoneNumber",
                table: "Users",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhotoUrl",
                table: "Users",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Username",
                table: "Users",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Facilities",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Facilities",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AdvisorName",
                table: "Extracurriculars",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AdvisorWhatsapp",
                table: "Extracurriculars",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Location",
                table: "Extracurriculars",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ScheduleDay",
                table: "Extracurriculars",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ScheduleTime",
                table: "Extracurriculars",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_NIM",
                table: "Users",
                column: "NIM");

            migrationBuilder.CreateIndex(
                name: "IX_Users_NIS",
                table: "Users",
                column: "NIS");

            migrationBuilder.CreateIndex(
                name: "IX_Users_NISN",
                table: "Users",
                column: "NISN");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true,
                filter: "\"Username\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_NIM",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_NIS",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_NISN",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_Username",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "NIM",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "NIS",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "NISN",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PhoneNumber",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PhotoUrl",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Username",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "Facilities");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Facilities");

            migrationBuilder.DropColumn(
                name: "AdvisorName",
                table: "Extracurriculars");

            migrationBuilder.DropColumn(
                name: "AdvisorWhatsapp",
                table: "Extracurriculars");

            migrationBuilder.DropColumn(
                name: "Location",
                table: "Extracurriculars");

            migrationBuilder.DropColumn(
                name: "ScheduleDay",
                table: "Extracurriculars");

            migrationBuilder.DropColumn(
                name: "ScheduleTime",
                table: "Extracurriculars");
        }
    }
}
