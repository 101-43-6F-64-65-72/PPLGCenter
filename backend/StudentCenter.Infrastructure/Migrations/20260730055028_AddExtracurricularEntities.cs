using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudentCenter.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddExtracurricularEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Extracurriculars",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    ImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    MaxMembers = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    ManagedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Extracurriculars", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Extracurriculars_Users_ManagedByUserId",
                        column: x => x.ManagedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ExtracurricularMembers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    ExtracurricularId = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExtracurricularMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExtracurricularMembers_Extracurriculars_ExtracurricularId",
                        column: x => x.ExtracurricularId,
                        principalTable: "Extracurriculars",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ExtracurricularMembers_Users_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ExtracurricularMembers_ExtracurricularId",
                table: "ExtracurricularMembers",
                column: "ExtracurricularId");

            migrationBuilder.CreateIndex(
                name: "IX_ExtracurricularMembers_ExtracurricularId_StudentId",
                table: "ExtracurricularMembers",
                columns: new[] { "ExtracurricularId", "StudentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ExtracurricularMembers_JoinedAt",
                table: "ExtracurricularMembers",
                column: "JoinedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ExtracurricularMembers_StudentId",
                table: "ExtracurricularMembers",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_Extracurriculars_Category",
                table: "Extracurriculars",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_Extracurriculars_CreatedAt",
                table: "Extracurriculars",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Extracurriculars_IsActive",
                table: "Extracurriculars",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Extracurriculars_ManagedByUserId",
                table: "Extracurriculars",
                column: "ManagedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Extracurriculars_Name",
                table: "Extracurriculars",
                column: "Name");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExtracurricularMembers");

            migrationBuilder.DropTable(
                name: "Extracurriculars");
        }
    }
}
