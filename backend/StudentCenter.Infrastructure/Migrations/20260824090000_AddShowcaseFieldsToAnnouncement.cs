using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudentCenter.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddShowcaseFieldsToAnnouncement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsShowcase",
                table: "Announcements",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ShowcaseOrder",
                table: "Announcements",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "CustomCtaText",
                table: "Announcements",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomCtaUrl",
                table: "Announcements",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Announcements_IsShowcase",
                table: "Announcements",
                column: "IsShowcase");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Announcements_IsShowcase",
                table: "Announcements");

            migrationBuilder.DropColumn(
                name: "IsShowcase",
                table: "Announcements");

            migrationBuilder.DropColumn(
                name: "ShowcaseOrder",
                table: "Announcements");

            migrationBuilder.DropColumn(
                name: "CustomCtaText",
                table: "Announcements");

            migrationBuilder.DropColumn(
                name: "CustomCtaUrl",
                table: "Announcements");
        }
    }
}
