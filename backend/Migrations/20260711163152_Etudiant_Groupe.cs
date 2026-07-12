using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmitGestion.Api.Migrations
{
    /// <inheritdoc />
    public partial class Etudiant_Groupe : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "GroupeId",
                table: "Etudiants",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Etudiants_GroupeId",
                table: "Etudiants",
                column: "GroupeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Etudiants_Groupes_GroupeId",
                table: "Etudiants",
                column: "GroupeId",
                principalTable: "Groupes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Etudiants_Groupes_GroupeId",
                table: "Etudiants");

            migrationBuilder.DropIndex(
                name: "IX_Etudiants_GroupeId",
                table: "Etudiants");

            migrationBuilder.DropColumn(
                name: "GroupeId",
                table: "Etudiants");
        }
    }
}
