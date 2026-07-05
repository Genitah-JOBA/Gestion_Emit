using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmitGestion.Api.Migrations
{
    /// <inheritdoc />
    public partial class Parcours_Niveaux_ManyToMany : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ParcoursNiveaux",
                columns: table => new
                {
                    NiveauxId = table.Column<int>(type: "integer", nullable: false),
                    ParcoursId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ParcoursNiveaux", x => new { x.NiveauxId, x.ParcoursId });
                    table.ForeignKey(
                        name: "FK_ParcoursNiveaux_Niveaux_NiveauxId",
                        column: x => x.NiveauxId,
                        principalTable: "Niveaux",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ParcoursNiveaux_Parcours_ParcoursId",
                        column: x => x.ParcoursId,
                        principalTable: "Parcours",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ParcoursNiveaux_ParcoursId",
                table: "ParcoursNiveaux",
                column: "ParcoursId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ParcoursNiveaux");
        }
    }
}
