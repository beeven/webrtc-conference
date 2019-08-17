using Microsoft.EntityFrameworkCore.Migrations;

namespace webrtc_conference.Migrations
{
    public partial class InitCommit : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Conferences",
                columns: table => new
                {
                    ConferenceId = table.Column<int>(nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(nullable: true),
                    ParticipantCount = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Conferences", x => x.ConferenceId);
                });

            migrationBuilder.CreateTable(
                name: "Participants",
                columns: table => new
                {
                    ParticipantId = table.Column<string>(nullable: false),
                    Name = table.Column<string>(nullable: true),
                    ConferenceId = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Participants", x => x.ParticipantId);
                    table.ForeignKey(
                        name: "FK_Participants_Conferences_ConferenceId",
                        column: x => x.ConferenceId,
                        principalTable: "Conferences",
                        principalColumn: "ConferenceId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Conferences",
                columns: new[] { "ConferenceId", "Name", "ParticipantCount" },
                values: new object[] { 1, "Testing Conference", 5 });

            migrationBuilder.InsertData(
                table: "Conferences",
                columns: new[] { "ConferenceId", "Name", "ParticipantCount" },
                values: new object[] { 2, "Meeting 2", 14 });

            migrationBuilder.InsertData(
                table: "Conferences",
                columns: new[] { "ConferenceId", "Name", "ParticipantCount" },
                values: new object[] { 3, "Morbi leo risus", 1 });

            migrationBuilder.CreateIndex(
                name: "IX_Participants_ConferenceId",
                table: "Participants",
                column: "ConferenceId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Participants");

            migrationBuilder.DropTable(
                name: "Conferences");
        }
    }
}
