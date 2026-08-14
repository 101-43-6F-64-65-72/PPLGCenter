using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudentCenter.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddManagerTeacherToFacility : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ManagerTeacherId",
                table: "Facilities",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Facilities_ManagerTeacherId",
                table: "Facilities",
                column: "ManagerTeacherId");

            migrationBuilder.AddForeignKey(
                name: "FK_Facilities_Users_ManagerTeacherId",
                table: "Facilities",
                column: "ManagerTeacherId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Facilities_Users_ManagerTeacherId",
                table: "Facilities");

            migrationBuilder.DropIndex(
                name: "IX_Facilities_ManagerTeacherId",
                table: "Facilities");

            migrationBuilder.DropColumn(
                name: "ManagerTeacherId",
                table: "Facilities");
        }
    }
}
