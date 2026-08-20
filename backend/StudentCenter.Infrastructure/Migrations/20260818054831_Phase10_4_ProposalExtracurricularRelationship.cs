using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudentCenter.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Phase10_4_ProposalExtracurricularRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ExtracurricularId",
                table: "Proposals",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Proposals_ExtracurricularId",
                table: "Proposals",
                column: "ExtracurricularId");

            migrationBuilder.AddForeignKey(
                name: "FK_Proposals_Extracurriculars_ExtracurricularId",
                table: "Proposals",
                column: "ExtracurricularId",
                principalTable: "Extracurriculars",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Proposals_Extracurriculars_ExtracurricularId",
                table: "Proposals");

            migrationBuilder.DropIndex(
                name: "IX_Proposals_ExtracurricularId",
                table: "Proposals");

            migrationBuilder.DropColumn(
                name: "ExtracurricularId",
                table: "Proposals");
        }
    }
}
