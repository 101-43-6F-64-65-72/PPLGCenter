using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudentCenter.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPplgCenterDomainFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BookManagers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookCategory = table.Column<string>(type: "text", nullable: true),
                    ManagerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookManagers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BookManagers_Users_ManagerUserId",
                        column: x => x.ManagerUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Books",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Author = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ISBN = table.Column<string>(type: "text", nullable: true),
                    Category = table.Column<string>(type: "text", nullable: false),
                    TotalCopies = table.Column<int>(type: "integer", nullable: false),
                    AvailableCopies = table.Column<int>(type: "integer", nullable: false),
                    CoverImageUrl = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Books", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ClassDivisions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SchoolClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParentDivisionId = table.Column<Guid>(type: "uuid", nullable: true),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    LeaderStudentId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassDivisions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClassDivisions_ClassDivisions_ParentDivisionId",
                        column: x => x.ParentDivisionId,
                        principalTable: "ClassDivisions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ClassDivisions_SchoolClasses_SchoolClassId",
                        column: x => x.SchoolClassId,
                        principalTable: "SchoolClasses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClassDivisions_Users_LeaderStudentId",
                        column: x => x.LeaderStudentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ClassLeadership",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SchoolClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    HomeroomTeacherId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassLeaderStudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    AcademicYearId = table.Column<Guid>(type: "uuid", nullable: false),
                    AppointedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    AppointedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    EffectiveDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassLeadership", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ClassLeadership_AcademicYears_AcademicYearId",
                        column: x => x.AcademicYearId,
                        principalTable: "AcademicYears",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ClassLeadership_SchoolClasses_SchoolClassId",
                        column: x => x.SchoolClassId,
                        principalTable: "SchoolClasses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClassLeadership_Users_ClassLeaderStudentId",
                        column: x => x.ClassLeaderStudentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ClassLeadership_Users_HomeroomTeacherId",
                        column: x => x.HomeroomTeacherId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CommunityGroups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    AvatarUrl = table.Column<string>(type: "text", nullable: true),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityGroups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommunityGroups_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FacilityManagers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FacilityId = table.Column<Guid>(type: "uuid", nullable: false),
                    ManagerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FacilityManagers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FacilityManagers_Facilities_FacilityId",
                        column: x => x.FacilityId,
                        principalTable: "Facilities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FacilityManagers_Users_ManagerUserId",
                        column: x => x.ManagerUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ScheduleRotationConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SchoolClassId = table.Column<Guid>(type: "uuid", nullable: false),
                    AnchorStartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    InitialCategory = table.Column<int>(type: "integer", nullable: false),
                    CycleWeeks = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScheduleRotationConfigs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ScheduleRotationConfigs_SchoolClasses_SchoolClassId",
                        column: x => x.SchoolClassId,
                        principalTable: "SchoolClasses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StudentProfiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Bio = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    SkillsJson = table.Column<string>(type: "text", nullable: true),
                    TechStackJson = table.Column<string>(type: "text", nullable: true),
                    SocialLinksJson = table.Column<string>(type: "text", nullable: true),
                    Visibility = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentProfiles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserPermissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Capability = table.Column<string>(type: "text", nullable: false),
                    GrantedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    GrantedByUserId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserPermissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserPermissions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "BookBorrowRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookId = table.Column<Guid>(type: "uuid", nullable: false),
                    BorrowerStudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    BorrowDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DueDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReturnDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    RejectionReason = table.Column<string>(type: "text", nullable: true),
                    ApprovedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookBorrowRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BookBorrowRequests_Books_BookId",
                        column: x => x.BookId,
                        principalTable: "Books",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_BookBorrowRequests_Users_ApprovedByUserId",
                        column: x => x.ApprovedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_BookBorrowRequests_Users_BorrowerStudentId",
                        column: x => x.BorrowerStudentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CommunityGroupMembers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GroupId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityGroupMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommunityGroupMembers_CommunityGroups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "CommunityGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunityGroupMembers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GroupMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GroupId = table.Column<Guid>(type: "uuid", nullable: false),
                    SenderUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    EncryptedPayloadBase64 = table.Column<string>(type: "text", nullable: false),
                    Nonce = table.Column<string>(type: "text", nullable: false),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupMessages_CommunityGroups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "CommunityGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupMessages_Users_SenderUserId",
                        column: x => x.SenderUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StudentProjects",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    TechStackJson = table.Column<string>(type: "text", nullable: true),
                    GithubUrl = table.Column<string>(type: "text", nullable: true),
                    DemoUrl = table.Column<string>(type: "text", nullable: true),
                    ImageUrl = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentProjects", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentProjects_StudentProfiles_StudentProfileId",
                        column: x => x.StudentProfileId,
                        principalTable: "StudentProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GroupMessageRecipientEnvelopes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    MessageId = table.Column<Guid>(type: "uuid", nullable: false),
                    RecipientUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    EncryptedKeyPackage = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GroupMessageRecipientEnvelopes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GroupMessageRecipientEnvelopes_GroupMessages_MessageId",
                        column: x => x.MessageId,
                        principalTable: "GroupMessages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GroupMessageRecipientEnvelopes_Users_RecipientUserId",
                        column: x => x.RecipientUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BookBorrowRequests_ApprovedByUserId",
                table: "BookBorrowRequests",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_BookBorrowRequests_BookId",
                table: "BookBorrowRequests",
                column: "BookId");

            migrationBuilder.CreateIndex(
                name: "IX_BookBorrowRequests_BorrowerStudentId",
                table: "BookBorrowRequests",
                column: "BorrowerStudentId");

            migrationBuilder.CreateIndex(
                name: "IX_BookBorrowRequests_Status",
                table: "BookBorrowRequests",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_BookManagers_ManagerUserId",
                table: "BookManagers",
                column: "ManagerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Books_Category",
                table: "Books",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_Books_ISBN",
                table: "Books",
                column: "ISBN");

            migrationBuilder.CreateIndex(
                name: "IX_ClassDivisions_LeaderStudentId",
                table: "ClassDivisions",
                column: "LeaderStudentId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassDivisions_ParentDivisionId",
                table: "ClassDivisions",
                column: "ParentDivisionId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassDivisions_SchoolClassId",
                table: "ClassDivisions",
                column: "SchoolClassId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassLeadership_AcademicYearId",
                table: "ClassLeadership",
                column: "AcademicYearId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassLeadership_ClassLeaderStudentId",
                table: "ClassLeadership",
                column: "ClassLeaderStudentId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassLeadership_HomeroomTeacherId",
                table: "ClassLeadership",
                column: "HomeroomTeacherId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassLeadership_SchoolClassId_AcademicYearId",
                table: "ClassLeadership",
                columns: new[] { "SchoolClassId", "AcademicYearId" },
                unique: true,
                filter: "\"IsActive\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityGroupMembers_GroupId_UserId",
                table: "CommunityGroupMembers",
                columns: new[] { "GroupId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CommunityGroupMembers_UserId",
                table: "CommunityGroupMembers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityGroups_CreatedByUserId",
                table: "CommunityGroups",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_FacilityManagers_FacilityId_ManagerUserId",
                table: "FacilityManagers",
                columns: new[] { "FacilityId", "ManagerUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FacilityManagers_ManagerUserId",
                table: "FacilityManagers",
                column: "ManagerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupMessageRecipientEnvelopes_MessageId",
                table: "GroupMessageRecipientEnvelopes",
                column: "MessageId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupMessageRecipientEnvelopes_RecipientUserId",
                table: "GroupMessageRecipientEnvelopes",
                column: "RecipientUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupMessages_GroupId",
                table: "GroupMessages",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_GroupMessages_SenderUserId",
                table: "GroupMessages",
                column: "SenderUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ScheduleRotationConfigs_SchoolClassId",
                table: "ScheduleRotationConfigs",
                column: "SchoolClassId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentProfiles_UserId",
                table: "StudentProfiles",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StudentProjects_StudentProfileId",
                table: "StudentProjects",
                column: "StudentProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_UserPermissions_UserId",
                table: "UserPermissions",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BookBorrowRequests");

            migrationBuilder.DropTable(
                name: "BookManagers");

            migrationBuilder.DropTable(
                name: "ClassDivisions");

            migrationBuilder.DropTable(
                name: "ClassLeadership");

            migrationBuilder.DropTable(
                name: "CommunityGroupMembers");

            migrationBuilder.DropTable(
                name: "FacilityManagers");

            migrationBuilder.DropTable(
                name: "GroupMessageRecipientEnvelopes");

            migrationBuilder.DropTable(
                name: "ScheduleRotationConfigs");

            migrationBuilder.DropTable(
                name: "StudentProjects");

            migrationBuilder.DropTable(
                name: "UserPermissions");

            migrationBuilder.DropTable(
                name: "Books");

            migrationBuilder.DropTable(
                name: "GroupMessages");

            migrationBuilder.DropTable(
                name: "StudentProfiles");

            migrationBuilder.DropTable(
                name: "CommunityGroups");
        }
    }
}
