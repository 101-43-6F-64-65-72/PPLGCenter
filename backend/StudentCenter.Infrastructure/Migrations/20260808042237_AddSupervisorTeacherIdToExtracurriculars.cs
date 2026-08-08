using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudentCenter.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSupervisorTeacherIdToExtracurriculars : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SupervisorTeacherId",
                table: "Extracurriculars",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Extracurriculars_SupervisorTeacherId",
                table: "Extracurriculars",
                column: "SupervisorTeacherId");

            migrationBuilder.AddForeignKey(
                name: "FK_Extracurriculars_Users_SupervisorTeacherId",
                table: "Extracurriculars",
                column: "SupervisorTeacherId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Extracurriculars_Users_SupervisorTeacherId",
                table: "Extracurriculars");

            migrationBuilder.DropIndex(
                name: "IX_Extracurriculars_SupervisorTeacherId",
                table: "Extracurriculars");

            migrationBuilder.DropColumn(
                name: "SupervisorTeacherId",
                table: "Extracurriculars");
        }
    }
}
