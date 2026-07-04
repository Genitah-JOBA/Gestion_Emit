using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace EmitGestion.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AnneesAcademiques",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Libelle = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DateDebut = table.Column<DateOnly>(type: "date", nullable: false),
                    DateFin = table.Column<DateOnly>(type: "date", nullable: false),
                    Active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnneesAcademiques", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Batiments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nom = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Adresse = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Batiments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Enseignants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nom = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Prenoms = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Grade = table.Column<int>(type: "integer", nullable: false),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    Telephone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Enseignants", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Filieres",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CodeFiliere = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Nom = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DateCreation = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Filieres", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Niveaux",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nom = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Ordre = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Niveaux", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Salles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nom = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Capacite = table.Column<int>(type: "integer", nullable: false),
                    TypeSalle = table.Column<int>(type: "integer", nullable: false),
                    BatimentId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Salles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Salles_Batiments_BatimentId",
                        column: x => x.BatimentId,
                        principalTable: "Batiments",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Disponibilites",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EnseignantId = table.Column<int>(type: "integer", nullable: false),
                    JourSemaine = table.Column<int>(type: "integer", nullable: false),
                    HeureDebut = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    HeureFin = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    Disponible = table.Column<bool>(type: "boolean", nullable: false),
                    Commentaire = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Disponibilites", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Disponibilites_Enseignants_EnseignantId",
                        column: x => x.EnseignantId,
                        principalTable: "Enseignants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Utilisateurs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Login = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    NomComplet = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    MotDePasseHash = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    Actif = table.Column<bool>(type: "boolean", nullable: false),
                    EnseignantId = table.Column<int>(type: "integer", nullable: true),
                    DateCreation = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Utilisateurs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Utilisateurs_Enseignants_EnseignantId",
                        column: x => x.EnseignantId,
                        principalTable: "Enseignants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Parcours",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nom = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    FiliereId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Parcours", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Parcours_Filieres_FiliereId",
                        column: x => x.FiliereId,
                        principalTable: "Filieres",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Etudiants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Matricule = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Nom = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Prenoms = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    DateNaissance = table.Column<DateOnly>(type: "date", nullable: true),
                    Sexe = table.Column<int>(type: "integer", nullable: false),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    Telephone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    FiliereId = table.Column<int>(type: "integer", nullable: false),
                    NiveauId = table.Column<int>(type: "integer", nullable: false),
                    ParcoursId = table.Column<int>(type: "integer", nullable: true),
                    AnneeAcademiqueId = table.Column<int>(type: "integer", nullable: false),
                    Statut = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Etudiants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Etudiants_AnneesAcademiques_AnneeAcademiqueId",
                        column: x => x.AnneeAcademiqueId,
                        principalTable: "AnneesAcademiques",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Etudiants_Filieres_FiliereId",
                        column: x => x.FiliereId,
                        principalTable: "Filieres",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Etudiants_Niveaux_NiveauId",
                        column: x => x.NiveauId,
                        principalTable: "Niveaux",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Etudiants_Parcours_ParcoursId",
                        column: x => x.ParcoursId,
                        principalTable: "Parcours",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Groupes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nom = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FiliereId = table.Column<int>(type: "integer", nullable: false),
                    NiveauId = table.Column<int>(type: "integer", nullable: false),
                    ParcoursId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Groupes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Groupes_Filieres_FiliereId",
                        column: x => x.FiliereId,
                        principalTable: "Filieres",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Groupes_Niveaux_NiveauId",
                        column: x => x.NiveauId,
                        principalTable: "Niveaux",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Groupes_Parcours_ParcoursId",
                        column: x => x.ParcoursId,
                        principalTable: "Parcours",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Matieres",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CodeMatiere = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Nom = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Coefficient = table.Column<double>(type: "double precision", nullable: false),
                    CreditsEcts = table.Column<int>(type: "integer", nullable: false),
                    Semestre = table.Column<int>(type: "integer", nullable: false),
                    FiliereId = table.Column<int>(type: "integer", nullable: false),
                    NiveauId = table.Column<int>(type: "integer", nullable: false),
                    ParcoursId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Matieres", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Matieres_Filieres_FiliereId",
                        column: x => x.FiliereId,
                        principalTable: "Filieres",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Matieres_Niveaux_NiveauId",
                        column: x => x.NiveauId,
                        principalTable: "Niveaux",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Matieres_Parcours_ParcoursId",
                        column: x => x.ParcoursId,
                        principalTable: "Parcours",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Seances",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DateCours = table.Column<DateOnly>(type: "date", nullable: false),
                    HeureDebut = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    HeureFin = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    TypeSeance = table.Column<int>(type: "integer", nullable: false),
                    MatiereId = table.Column<int>(type: "integer", nullable: false),
                    EnseignantId = table.Column<int>(type: "integer", nullable: false),
                    SalleId = table.Column<int>(type: "integer", nullable: false),
                    GroupeId = table.Column<int>(type: "integer", nullable: false),
                    AnneeAcademiqueId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Seances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Seances_AnneesAcademiques_AnneeAcademiqueId",
                        column: x => x.AnneeAcademiqueId,
                        principalTable: "AnneesAcademiques",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Seances_Enseignants_EnseignantId",
                        column: x => x.EnseignantId,
                        principalTable: "Enseignants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Seances_Groupes_GroupeId",
                        column: x => x.GroupeId,
                        principalTable: "Groupes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Seances_Matieres_MatiereId",
                        column: x => x.MatiereId,
                        principalTable: "Matieres",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Seances_Salles_SalleId",
                        column: x => x.SalleId,
                        principalTable: "Salles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AnneesAcademiques_Libelle",
                table: "AnneesAcademiques",
                column: "Libelle",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Disponibilites_EnseignantId",
                table: "Disponibilites",
                column: "EnseignantId");

            migrationBuilder.CreateIndex(
                name: "IX_Etudiants_AnneeAcademiqueId",
                table: "Etudiants",
                column: "AnneeAcademiqueId");

            migrationBuilder.CreateIndex(
                name: "IX_Etudiants_FiliereId",
                table: "Etudiants",
                column: "FiliereId");

            migrationBuilder.CreateIndex(
                name: "IX_Etudiants_Matricule",
                table: "Etudiants",
                column: "Matricule",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Etudiants_NiveauId",
                table: "Etudiants",
                column: "NiveauId");

            migrationBuilder.CreateIndex(
                name: "IX_Etudiants_ParcoursId",
                table: "Etudiants",
                column: "ParcoursId");

            migrationBuilder.CreateIndex(
                name: "IX_Filieres_CodeFiliere",
                table: "Filieres",
                column: "CodeFiliere",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Groupes_FiliereId",
                table: "Groupes",
                column: "FiliereId");

            migrationBuilder.CreateIndex(
                name: "IX_Groupes_NiveauId",
                table: "Groupes",
                column: "NiveauId");

            migrationBuilder.CreateIndex(
                name: "IX_Groupes_ParcoursId",
                table: "Groupes",
                column: "ParcoursId");

            migrationBuilder.CreateIndex(
                name: "IX_Matieres_CodeMatiere",
                table: "Matieres",
                column: "CodeMatiere",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Matieres_FiliereId",
                table: "Matieres",
                column: "FiliereId");

            migrationBuilder.CreateIndex(
                name: "IX_Matieres_NiveauId",
                table: "Matieres",
                column: "NiveauId");

            migrationBuilder.CreateIndex(
                name: "IX_Matieres_ParcoursId",
                table: "Matieres",
                column: "ParcoursId");

            migrationBuilder.CreateIndex(
                name: "IX_Parcours_FiliereId",
                table: "Parcours",
                column: "FiliereId");

            migrationBuilder.CreateIndex(
                name: "IX_Salles_BatimentId",
                table: "Salles",
                column: "BatimentId");

            migrationBuilder.CreateIndex(
                name: "IX_Seances_AnneeAcademiqueId",
                table: "Seances",
                column: "AnneeAcademiqueId");

            migrationBuilder.CreateIndex(
                name: "IX_Seances_EnseignantId",
                table: "Seances",
                column: "EnseignantId");

            migrationBuilder.CreateIndex(
                name: "IX_Seances_GroupeId",
                table: "Seances",
                column: "GroupeId");

            migrationBuilder.CreateIndex(
                name: "IX_Seances_MatiereId",
                table: "Seances",
                column: "MatiereId");

            migrationBuilder.CreateIndex(
                name: "IX_Seances_SalleId",
                table: "Seances",
                column: "SalleId");

            migrationBuilder.CreateIndex(
                name: "IX_Utilisateurs_EnseignantId",
                table: "Utilisateurs",
                column: "EnseignantId");

            migrationBuilder.CreateIndex(
                name: "IX_Utilisateurs_Login",
                table: "Utilisateurs",
                column: "Login",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Disponibilites");

            migrationBuilder.DropTable(
                name: "Etudiants");

            migrationBuilder.DropTable(
                name: "Seances");

            migrationBuilder.DropTable(
                name: "Utilisateurs");

            migrationBuilder.DropTable(
                name: "AnneesAcademiques");

            migrationBuilder.DropTable(
                name: "Groupes");

            migrationBuilder.DropTable(
                name: "Matieres");

            migrationBuilder.DropTable(
                name: "Salles");

            migrationBuilder.DropTable(
                name: "Enseignants");

            migrationBuilder.DropTable(
                name: "Niveaux");

            migrationBuilder.DropTable(
                name: "Parcours");

            migrationBuilder.DropTable(
                name: "Batiments");

            migrationBuilder.DropTable(
                name: "Filieres");
        }
    }
}
