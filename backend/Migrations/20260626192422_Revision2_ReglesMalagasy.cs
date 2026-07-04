using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmitGestion.Api.Migrations
{
    /// <inheritdoc />
    public partial class Revision2_ReglesMalagasy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SerieId",
                table: "Seances",
                type: "uuid",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "CreditsEcts",
                table: "Matieres",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            // double precision -> integer : PostgreSQL exige un cast explicite (USING).
            migrationBuilder.Sql(
                "ALTER TABLE \"Matieres\" ALTER COLUMN \"Coefficient\" TYPE integer USING ROUND(\"Coefficient\")::integer;");

            migrationBuilder.AddColumn<bool>(
                name: "Archivee",
                table: "Filieres",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "LettreSpecifique",
                table: "Filieres",
                type: "character varying(1)",
                maxLength: 1,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Cin",
                table: "Etudiants",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            // Attribue une lettre spécifique distincte (A, B, C, …) aux filières déjà existantes,
            // sinon l'index unique échouerait sur des chaînes vides identiques.
            migrationBuilder.Sql(@"
                UPDATE ""Filieres"" f
                SET ""LettreSpecifique"" = sub.lettre
                FROM (
                    SELECT ""Id"", CHR(64 + (ROW_NUMBER() OVER (ORDER BY ""Id""))::int) AS lettre
                    FROM ""Filieres""
                ) sub
                WHERE f.""Id"" = sub.""Id"";");

            migrationBuilder.CreateIndex(
                name: "IX_Filieres_LettreSpecifique",
                table: "Filieres",
                column: "LettreSpecifique",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Filieres_LettreSpecifique",
                table: "Filieres");

            migrationBuilder.DropColumn(
                name: "SerieId",
                table: "Seances");

            migrationBuilder.DropColumn(
                name: "Archivee",
                table: "Filieres");

            migrationBuilder.DropColumn(
                name: "LettreSpecifique",
                table: "Filieres");

            migrationBuilder.DropColumn(
                name: "Cin",
                table: "Etudiants");

            migrationBuilder.AlterColumn<int>(
                name: "CreditsEcts",
                table: "Matieres",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<double>(
                name: "Coefficient",
                table: "Matieres",
                type: "double precision",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");
        }
    }
}
