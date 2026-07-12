using EmitGestion.Api.Models;
using EmitGestion.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace EmitGestion.Api.Data;

/// <summary>Initialise la base avec des comptes et des données de démonstration.</summary>
public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        await db.Database.MigrateAsync();

        // ----- Comptes utilisateurs -----
        if (!await db.Utilisateurs.AnyAsync())
        {
            db.Utilisateurs.AddRange(
                new Utilisateur
                {
                    Login = "admin",
                    NomComplet = "Administrateur EMIT",
                    MotDePasseHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                    Role = RoleUtilisateur.Admin
                },
                new Utilisateur
                {
                    Login = "secretariat",
                    NomComplet = "Secrétariat EMIT",
                    MotDePasseHash = BCrypt.Net.BCrypt.HashPassword("secret123"),
                    Role = RoleUtilisateur.Secretariat
                });
            await db.SaveChangesAsync();
        }

        // ----- Année académique courante (automatique selon la date du jour) -----
        var annee = await AnneeAcademiqueHelper.AssurerCouranteAsync(db);
        var aa = annee.Libelle.Length >= 4 ? annee.Libelle.Substring(2, 2) : "25"; // 2 derniers chiffres de l'année de début

        if (await db.Filieres.AnyAsync()) return; // données déjà présentes

        // ----- Niveaux -----
        var l1 = new Niveau { Nom = "L1", Ordre = 1 };
        var l2 = new Niveau { Nom = "L2", Ordre = 2 };
        var l3 = new Niveau { Nom = "L3", Ordre = 3 };
        var m1 = new Niveau { Nom = "M1", Ordre = 4 };
        var m2 = new Niveau { Nom = "M2", Ordre = 5 };
        db.Niveaux.AddRange(l1, l2, l3, m1, m2);

        // ----- Filières (avec lettre spécifique) -----
        var info = new Filiere { CodeFiliere = "INFO", Nom = "Informatique", LettreSpecifique = "I", Description = "Génie logiciel et systèmes d'information" };
        var gest = new Filiere { CodeFiliere = "GEST", Nom = "Gestion", LettreSpecifique = "G", Description = "Management et gestion des organisations" };
        db.Filieres.AddRange(info, gest);

        // ----- Bâtiment & salles -----
        var batA = new Batiment { Nom = "Bâtiment A" };
        db.Batiments.Add(batA);
        var amphiA = new Salle { Nom = "Amphi A", Capacite = 200, TypeSalle = TypeSalle.Amphitheatre, Batiment = batA };
        var salle12 = new Salle { Nom = "Salle 12", Capacite = 40, TypeSalle = TypeSalle.SalleDeClasse, Batiment = batA };
        var studio1 = new Salle { Nom = "Studio 1", Capacite = 30, TypeSalle = TypeSalle.Studio, Batiment = batA };
        db.Salles.AddRange(amphiA, salle12, studio1);

        // ----- Enseignants (email obligatoire, téléphone malgache) -----
        var ens1 = new Enseignant { Nom = "Koné", Prenoms = "Aminata", Grade = GradeEnseignant.MaitreDeConferences, Email = "a.kone@emit.mg", Telephone = "0341234567" };
        var ens2 = new Enseignant { Nom = "Traoré", Prenoms = "Ibrahim", Grade = GradeEnseignant.Docteur, Email = "i.traore@emit.mg", Telephone = "0329876543" };
        db.Enseignants.AddRange(ens1, ens2);

        // ----- Matières (code coordonné à la filière, semestre selon le niveau) -----
        var algo = new Matiere { CodeMatiere = "INFO101", Nom = "Algorithmique", Coefficient = 3, CreditsEcts = 6, Semestre = 1, Filiere = info, Niveau = l1 };
        var bdd = new Matiere { CodeMatiere = "INFO301", Nom = "Bases de données", Coefficient = 3, CreditsEcts = 6, Semestre = 3, Filiere = info, Niveau = l2 };
        var compta = new Matiere { CodeMatiere = "GEST101", Nom = "Comptabilité générale", Coefficient = 2, CreditsEcts = 4, Semestre = 1, Filiere = gest, Niveau = l1 };
        db.Matieres.AddRange(algo, bdd, compta);

        // ----- Groupes (nom composé : Niveau Code-Filière Lettre) -----
        var grpInfoL2 = new Groupe { Nom = "L2 INFO A", Filiere = info, Niveau = l2 };
        var grpGestL1 = new Groupe { Nom = "L1 GEST A", Filiere = gest, Niveau = l1 };
        db.Groupes.AddRange(grpInfoL2, grpGestL1);

        // ----- Étudiants (matricule : 3 chiffres + lettre filière + 2 chiffres année) -----
        db.Etudiants.AddRange(
            new Etudiant { Matricule = $"001I{aa}", Nom = "Diallo", Prenoms = "Fatou", Sexe = Sexe.Feminin, Filiere = info, Niveau = l2, AnneeAcademique = annee, Email = "f.diallo@etu.emit.mg", Telephone = "0331111111" },
            new Etudiant { Matricule = $"002I{aa}", Nom = "Bamba", Prenoms = "Yao", Sexe = Sexe.Masculin, Filiere = info, Niveau = l2, AnneeAcademique = annee, Email = "y.bamba@etu.emit.mg", Telephone = "0332222222" },
            new Etudiant { Matricule = $"003G{aa}", Nom = "Ouattara", Prenoms = "Awa", Sexe = Sexe.Feminin, Filiere = gest, Niveau = l1, AnneeAcademique = annee, Email = "a.ouattara@etu.emit.mg", Telephone = "0343333333", Statut = StatutEtudiant.Redoublant });

        // ----- Disponibilités enseignant -----
        db.Disponibilites.AddRange(
            new DisponibiliteEnseignant { Enseignant = ens1, JourSemaine = JourSemaine.Lundi, HeureDebut = new TimeOnly(8, 0), HeureFin = new TimeOnly(12, 0), Disponible = true },
            new DisponibiliteEnseignant { Enseignant = ens1, JourSemaine = JourSemaine.Mardi, HeureDebut = new TimeOnly(14, 0), HeureFin = new TimeOnly(18, 0), Disponible = true },
            new DisponibiliteEnseignant { Enseignant = ens2, JourSemaine = JourSemaine.Lundi, HeureDebut = new TimeOnly(8, 0), HeureFin = new TimeOnly(12, 0), Disponible = true });

        await db.SaveChangesAsync();

        // ----- Séances de démonstration -----
        db.Seances.AddRange(
            new Seance { DateCours = ProchainLundi(), HeureDebut = new TimeOnly(8, 0), HeureFin = new TimeOnly(10, 0), TypeSeance = TypeSeance.Cours, Matiere = bdd, Enseignant = ens1, Salle = amphiA, Groupe = grpInfoL2, AnneeAcademique = annee },
            new Seance { DateCours = ProchainLundi(), HeureDebut = new TimeOnly(8, 0), HeureFin = new TimeOnly(10, 0), TypeSeance = TypeSeance.Cours, Matiere = compta, Enseignant = ens2, Salle = salle12, Groupe = grpGestL1, AnneeAcademique = annee });

        await db.SaveChangesAsync();
    }

    private static DateOnly ProchainLundi()
    {
        var d = DateOnly.FromDateTime(DateTime.Today);
        while (d.DayOfWeek != DayOfWeek.Monday) d = d.AddDays(1);
        return d;
    }
}
