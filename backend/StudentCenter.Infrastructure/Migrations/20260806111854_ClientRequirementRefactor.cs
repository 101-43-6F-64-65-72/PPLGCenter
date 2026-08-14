using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudentCenter.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ClientRequirementRefactor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "NIM",
                table: "Users",
                newName: "NIP");

            migrationBuilder.RenameIndex(
                name: "IX_Users_NIM",
                table: "Users",
                newName: "IX_Users_NIP");

            migrationBuilder.AddColumn<DateTime>(
                name: "JoinDate",
                table: "ExtracurricularMembers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()");

            migrationBuilder.AddColumn<int>(
                name: "Position",
                table: "ExtracurricularMembers",
                type: "integer",
                maxLength: 50,
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "ExtracurricularMembers",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Active");

            migrationBuilder.CreateTable(
                name: "ExtracurricularAdvisors",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    TeacherId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExtracurricularId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExtracurricularAdvisors", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExtracurricularAdvisors_Extracurriculars_ExtracurricularId",
                        column: x => x.ExtracurricularId,
                        principalTable: "Extracurriculars",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ExtracurricularAdvisors_Users_TeacherId",
                        column: x => x.TeacherId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ExtracurricularAdvisors_ExtracurricularId",
                table: "ExtracurricularAdvisors",
                column: "ExtracurricularId");

            migrationBuilder.CreateIndex(
                name: "IX_ExtracurricularAdvisors_TeacherId_ExtracurricularId",
                table: "ExtracurricularAdvisors",
                columns: new[] { "TeacherId", "ExtracurricularId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExtracurricularAdvisors");

            migrationBuilder.DropColumn(
                name: "JoinDate",
                table: "ExtracurricularMembers");

            migrationBuilder.DropColumn(
                name: "Position",
                table: "ExtracurricularMembers");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "ExtracurricularMembers");

            migrationBuilder.RenameColumn(
                name: "NIP",
                table: "Users",
                newName: "NIM");

            migrationBuilder.RenameIndex(
                name: "IX_Users_NIP",
                table: "Users",
                newName: "IX_Users_NIM");
        }
    }
}
