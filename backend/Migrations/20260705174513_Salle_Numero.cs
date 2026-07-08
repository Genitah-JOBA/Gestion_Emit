using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmitGestion.Api.Migrations
{
    /// <inheritdoc />
    public partial class Salle_Numero : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Numero",
                table: "Salles",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Numero",
                table: "Salles");
        }
    }
}
