using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmitGestion.Api.Migrations
{
    /// <inheritdoc />
    public partial class Enseignant_Matieres : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EnseignantMatieres",
                columns: table => new
                {
                    EnseignantsId = table.Column<int>(type: "integer", nullable: false),
                    MatieresId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EnseignantMatieres", x => new { x.EnseignantsId, x.MatieresId });
                    table.ForeignKey(
                        name: "FK_EnseignantMatieres_Enseignants_EnseignantsId",
                        column: x => x.EnseignantsId,
                        principalTable: "Enseignants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EnseignantMatieres_Matieres_MatieresId",
                        column: x => x.MatieresId,
                        principalTable: "Matieres",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EnseignantMatieres_MatieresId",
                table: "EnseignantMatieres",
                column: "MatieresId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EnseignantMatieres");
        }
    }
}
