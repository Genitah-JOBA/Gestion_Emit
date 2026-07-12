using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace EmitGestion.Api.Migrations
{
    /// <inheritdoc />
    public partial class Examens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Examens",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MatiereId = table.Column<int>(type: "integer", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    HeureDebut = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    HeureFin = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    EnseignantId = table.Column<int>(type: "integer", nullable: false),
                    Session = table.Column<int>(type: "integer", nullable: false),
                    ChefScolarite = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    AnneeAcademiqueId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Examens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Examens_AnneesAcademiques_AnneeAcademiqueId",
                        column: x => x.AnneeAcademiqueId,
                        principalTable: "AnneesAcademiques",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Examens_Enseignants_EnseignantId",
                        column: x => x.EnseignantId,
                        principalTable: "Enseignants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Examens_Matieres_MatiereId",
                        column: x => x.MatiereId,
                        principalTable: "Matieres",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ExamenSalles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ExamenId = table.Column<int>(type: "integer", nullable: false),
                    SalleId = table.Column<int>(type: "integer", nullable: false),
                    Surveillant1 = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Surveillant2 = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Surveillant3 = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExamenSalles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExamenSalles_Examens_ExamenId",
                        column: x => x.ExamenId,
                        principalTable: "Examens",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ExamenSalles_Salles_SalleId",
                        column: x => x.SalleId,
                        principalTable: "Salles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Examens_AnneeAcademiqueId",
                table: "Examens",
                column: "AnneeAcademiqueId");

            migrationBuilder.CreateIndex(
                name: "IX_Examens_EnseignantId",
                table: "Examens",
                column: "EnseignantId");

            migrationBuilder.CreateIndex(
                name: "IX_Examens_MatiereId",
                table: "Examens",
                column: "MatiereId");

            migrationBuilder.CreateIndex(
                name: "IX_ExamenSalles_ExamenId",
                table: "ExamenSalles",
                column: "ExamenId");

            migrationBuilder.CreateIndex(
                name: "IX_ExamenSalles_SalleId",
                table: "ExamenSalles",
                column: "SalleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExamenSalles");

            migrationBuilder.DropTable(
                name: "Examens");
        }
    }
}
