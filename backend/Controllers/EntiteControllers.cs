using EmitGestion.Api.Data;
using EmitGestion.Api.Models;
using EmitGestion.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmitGestion.Api.Controllers;

public class FilieresController(AppDbContext db) : CrudController<Filiere>(db)
{
    // Les filières archivées (soft-delete) sont masquées des listes.
    protected override IQueryable<Filiere> Query() => Db.Filieres.Where(f => !f.Archivee).OrderBy(f => f.CodeFiliere);

    protected override void Map(Filiere c, Filiere s)
    {
        c.CodeFiliere = s.CodeFiliere?.Trim().ToUpperInvariant() ?? "";
        c.Nom = s.Nom;
        c.LettreSpecifique = s.LettreSpecifique?.Trim().ToUpperInvariant() ?? "";
        c.Description = s.Description;
    }
    protected override void OnCreate(Filiere e) => e.DateCreation = DateTime.UtcNow;

    protected override Task ValidateAsync(Filiere e, bool modification)
    {
        if (string.IsNullOrWhiteSpace(e.CodeFiliere))
            throw new ValidationException("Le code de la filière est obligatoire.");
        if (e.LettreSpecifique.Length != 1 || !char.IsLetter(e.LettreSpecifique[0]))
            throw new ValidationException("La lettre spécifique est obligatoire : une seule lettre majuscule (ex : I).");
        return Task.CompletedTask;
    }

    // Soft-delete : on archive la filière si elle est référencée, sinon on supprime réellement.
    public override async Task<IActionResult> Delete(int id)
    {
        var f = await Db.Filieres.FindAsync(id);
        if (f is null) return NotFound();

        var utilisee = await Db.Etudiants.AnyAsync(x => x.FiliereId == id)
            || await Db.Matieres.AnyAsync(x => x.FiliereId == id)
            || await Db.Groupes.AnyAsync(x => x.FiliereId == id)
            || await Db.Parcours.AnyAsync(x => x.FiliereId == id);

        if (utilisee)
        {
            f.Archivee = true;
            await Db.SaveChangesAsync();
            return Ok(new { archivee = true, message = "Filière utilisée par d'autres données : elle a été archivée (masquée) au lieu d'être supprimée." });
        }
        Db.Filieres.Remove(f);
        await Db.SaveChangesAsync();
        return NoContent();
    }
}

public class NiveauxController(AppDbContext db) : CrudController<Niveau>(db)
{
    protected override IQueryable<Niveau> Query() => Db.Niveaux.OrderBy(n => n.Ordre);
    protected override void Map(Niveau c, Niveau s) { c.Nom = s.Nom?.Trim() ?? ""; c.Ordre = s.Ordre; }
    protected override Task ValidateAsync(Niveau e, bool modification)
    {
        if (string.IsNullOrWhiteSpace(e.Nom)) throw new ValidationException("Le nom du niveau est obligatoire.");
        if (e.Ordre < 1) throw new ValidationException("L'ordre doit être un entier positif.");
        return Task.CompletedTask;
    }
}

public class ParcoursController(AppDbContext db) : CrudController<Parcours>(db)
{
    protected override IQueryable<Parcours> Query() =>
        Db.Parcours.Include(p => p.Filiere).Include(p => p.Niveaux);

    protected override void Map(Parcours c, Parcours s)
    {
        c.Nom = s.Nom?.Trim() ?? "";
        c.FiliereId = s.FiliereId;

        var ids = (s.NiveauxIds ?? new List<int>()).Distinct().ToList();
        // En modification, l'entité est suivie : on charge sa collection actuelle avant de la remplacer.
        if (Db.Entry(c).State != EntityState.Detached)
            Db.Entry(c).Collection(p => p.Niveaux).Load();
        c.Niveaux.Clear();
        if (ids.Count > 0)
            foreach (var n in Db.Niveaux.Where(n => ids.Contains(n.Id)))
                c.Niveaux.Add(n);
    }

    protected override Task ValidateAsync(Parcours e, bool modification)
    {
        if (string.IsNullOrWhiteSpace(e.Nom))
            throw new ValidationException("Le nom du parcours est obligatoire.");
        if (e.FiliereId <= 0)
            throw new ValidationException("La filière est obligatoire.");
        if (e.Niveaux.Count == 0)
            throw new ValidationException("Sélectionnez au moins un niveau pour ce parcours.");
        return Task.CompletedTask;
    }

    // On retire d'abord les liens niveaux (table de jointure) avant de supprimer le parcours,
    // sinon la contrainte de clé étrangère (Restrict) bloque la suppression.
    public override async Task<IActionResult> Delete(int id)
    {
        var p = await Db.Parcours.Include(x => x.Niveaux).FirstOrDefaultAsync(x => x.Id == id);
        if (p is null) return NotFound();

        p.Niveaux.Clear();
        Db.Parcours.Remove(p);
        try
        {
            await Db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new { message = "Suppression impossible : ce parcours est utilisé par des matières, groupes ou étudiants." });
        }
        return NoContent();
    }
}

public class BatimentsController(AppDbContext db) : CrudController<Batiment>(db)
{
    protected override void Map(Batiment c, Batiment s) { c.Nom = s.Nom; c.Adresse = s.Adresse; }
}

public class SallesController(AppDbContext db) : CrudController<Salle>(db)
{
    protected override IQueryable<Salle> Query() => Db.Salles.Include(s => s.Batiment).OrderBy(s => s.Nom);
    protected override void Map(Salle c, Salle s)
    {
        c.Nom = s.Nom?.Trim() ?? "";
        c.Numero = s.Numero?.Trim();
        c.Capacite = s.Capacite;
        c.TypeSalle = s.TypeSalle;
        c.BatimentId = s.BatimentId;
    }
    protected override async Task ValidateAsync(Salle e, bool modification)
    {
        if (string.IsNullOrWhiteSpace(e.Nom)) throw new ValidationException("Le nom de la salle est obligatoire.");
        if (string.IsNullOrWhiteSpace(e.Numero)) throw new ValidationException("Le numéro de la salle est obligatoire.");
        if (e.Capacite < 1) throw new ValidationException("La capacité doit être au moins 1.");
        if (e.BatimentId is null) throw new ValidationException("Le bâtiment est obligatoire.");

        // Un même numéro ne peut pas être réutilisé dans le même bâtiment (comparaison insensible à la casse).
        var numero = e.Numero.Trim().ToLower();
        var doublon = await Db.Salles.AnyAsync(s =>
            s.BatimentId == e.BatimentId && s.Numero != null && s.Numero.ToLower() == numero
            && (!modification || s.Id != e.Id));
        if (doublon) throw new ValidationException($"Le numéro « {e.Numero.Trim()} » existe déjà dans ce bâtiment.");
    }
}

public class GroupesController(AppDbContext db) : CrudController<Groupe>(db)
{
    protected override IQueryable<Groupe> Query() =>
        Db.Groupes.Include(g => g.Filiere).Include(g => g.Niveau).Include(g => g.Parcours).OrderBy(g => g.Nom);
    protected override void Map(Groupe c, Groupe s)
    {
        c.Nom = s.Nom?.Trim() ?? "";
        c.FiliereId = s.FiliereId;
        c.NiveauId = s.NiveauId;
        c.ParcoursId = s.ParcoursId;
    }
    protected override async Task ValidateAsync(Groupe e, bool modification)
    {
        if (string.IsNullOrWhiteSpace(e.Nom)) throw new ValidationException("Le nom du groupe est obligatoire.");
        if (e.FiliereId <= 0) throw new ValidationException("La filière est obligatoire.");
        if (e.NiveauId <= 0) throw new ValidationException("Le niveau est obligatoire.");

        // Interdit deux groupes portant le même nom (comparaison insensible à la casse).
        var nom = e.Nom.Trim().ToLower();
        var doublon = await Db.Groupes.AnyAsync(g => g.Nom.ToLower() == nom && (!modification || g.Id != e.Id));
        if (doublon) throw new ValidationException($"Un groupe nommé « {e.Nom.Trim()} » existe déjà.");
    }
}

public class MatieresController(AppDbContext db) : CrudController<Matiere>(db)
{
    protected override IQueryable<Matiere> Query() =>
        Db.Matieres.Include(m => m.Filiere).Include(m => m.Niveau).Include(m => m.Parcours).OrderBy(m => m.CodeMatiere);
    protected override void Map(Matiere c, Matiere s)
    {
        c.CodeMatiere = s.CodeMatiere?.Trim().ToUpperInvariant() ?? "";
        c.Nom = s.Nom;
        c.Coefficient = s.Coefficient;
        c.CreditsEcts = s.CreditsEcts;
        c.Semestre = s.Semestre;
        c.FiliereId = s.FiliereId;
        c.NiveauId = s.NiveauId;
        c.ParcoursId = s.ParcoursId;
    }

    /// <summary>Semestres autorisés par niveau.</summary>
    public static int[] SemestresDuNiveau(string? niveau) => (niveau ?? "").ToUpperInvariant() switch
    {
        "L1" => new[] { 1, 2 },
        "L2" => new[] { 3, 4 },
        "L3" => new[] { 4, 5 },
        "M1" => new[] { 6, 7 },
        "M2" => new[] { 8, 9 },
        _ => Array.Empty<int>(),
    };

    protected override async Task ValidateAsync(Matiere e, bool modification)
    {
        if (e.Coefficient < 1) throw new ValidationException("Le coefficient est obligatoire et doit être un entier >= 1.");

        var filiere = await Db.Filieres.FindAsync(e.FiliereId) ?? throw new ValidationException("Filière introuvable.");
        var niveau = await Db.Niveaux.FindAsync(e.NiveauId) ?? throw new ValidationException("Niveau introuvable.");

        if (!e.CodeMatiere.StartsWith(filiere.CodeFiliere, StringComparison.OrdinalIgnoreCase))
            throw new ValidationException($"Le code matière doit commencer par le code de la filière ({filiere.CodeFiliere}). Ex : {filiere.CodeFiliere}101.");

        var sems = SemestresDuNiveau(niveau.Nom);
        if (sems.Length > 0 && !sems.Contains(e.Semestre))
            throw new ValidationException($"Pour le niveau {niveau.Nom}, le semestre doit être S{sems[0]} ou S{sems[1]}.");
    }
}

public class EnseignantsController(AppDbContext db) : CrudController<Enseignant>(db)
{
    protected override IQueryable<Enseignant> Query() => Db.Enseignants.OrderBy(e => e.Nom);
    protected override void Map(Enseignant c, Enseignant s)
    {
        c.Nom = s.Nom?.Trim() ?? "";
        c.Prenoms = string.IsNullOrWhiteSpace(s.Prenoms) ? null : s.Prenoms.Trim();
        c.Grade = s.Grade;
        c.Email = s.Email?.Trim();
        c.Telephone = s.Telephone?.Trim();
    }
    protected override async Task ValidateAsync(Enseignant e, bool modification)
    {
        if (string.IsNullOrWhiteSpace(e.Nom)) throw new ValidationException("Le nom est obligatoire.");
        if (!Validations.EmailValide(e.Email))
            throw new ValidationException("L'email est obligatoire et doit contenir « @ » et « . » (ex : nom@gmail.com).");
        if (!string.IsNullOrWhiteSpace(e.Telephone) && !Validations.TelephoneValide(e.Telephone))
            throw new ValidationException("Le téléphone doit comporter 10 chiffres et commencer par 032, 033, 034, 037 ou 038.");
        await UniciteContact.VerifierAsync(Db, e.Email, e.Telephone, enseignantIdExclu: modification ? e.Id : null);
    }
}

public class EtudiantsController(AppDbContext db) : CrudController<Etudiant>(db)
{
    protected override IQueryable<Etudiant> Query() =>
        Db.Etudiants
            .Include(e => e.Filiere).Include(e => e.Niveau).Include(e => e.Parcours).Include(e => e.AnneeAcademique)
            .OrderBy(e => e.Nom).ThenBy(e => e.Prenoms);
    protected override void Map(Etudiant c, Etudiant s)
    {
        c.Matricule = s.Matricule?.Trim().ToUpperInvariant() ?? "";
        c.Nom = s.Nom?.Trim() ?? "";
        c.Prenoms = string.IsNullOrWhiteSpace(s.Prenoms) ? null : s.Prenoms.Trim();
        c.DateNaissance = s.DateNaissance;
        c.Sexe = s.Sexe;
        c.Cin = s.Cin?.Trim();
        c.Email = s.Email?.Trim();
        c.Telephone = s.Telephone?.Trim();
        c.FiliereId = s.FiliereId;
        c.NiveauId = s.NiveauId;
        c.ParcoursId = s.ParcoursId;
        c.AnneeAcademiqueId = s.AnneeAcademiqueId;
        c.Statut = s.Statut;
    }

    protected override async Task ValidateAsync(Etudiant e, bool modification)
    {
        // Matricule non modifiable une fois enregistré.
        if (modification)
        {
            var orig = Db.Entry(e).Property(x => x.Matricule).OriginalValue;
            if (!string.IsNullOrEmpty(orig)) e.Matricule = orig;
        }

        var filiere = await Db.Filieres.FindAsync(e.FiliereId) ?? throw new ValidationException("Filière introuvable.");

        if (!Validations.MatriculeFormatValide(e.Matricule))
            throw new ValidationException("Matricule invalide : 3 chiffres + lettre de la filière + 2 chiffres de l'année (ex : 130I24).");
        if (e.Matricule[3].ToString() != filiere.LettreSpecifique)
            throw new ValidationException($"La lettre du matricule doit être « {filiere.LettreSpecifique} » (lettre de la filière {filiere.CodeFiliere}).");

        if (!Validations.EmailValide(e.Email))
            throw new ValidationException("L'email est obligatoire et doit contenir « @ » et « . » (ex : nom@gmail.com).");
        if (!string.IsNullOrWhiteSpace(e.Telephone) && !Validations.TelephoneValide(e.Telephone))
            throw new ValidationException("Le téléphone doit comporter 10 chiffres et commencer par 032, 033, 034, 037 ou 038.");

        if (e.DateNaissance is DateOnly dn)
        {
            var age = Validations.AgeA(dn, DateOnly.FromDateTime(DateTime.Today));
            if (age < 13) throw new ValidationException("L'étudiant doit avoir au moins 13 ans à l'inscription.");
            if (age >= 18)
            {
                if (!Validations.CinValide(e.Cin))
                    throw new ValidationException("Le CIN est obligatoire pour les majeurs : 12 chiffres (le 6e chiffre = 1 pour Masculin, 2 pour Féminin).");
                e.Sexe = Validations.GenreDepuisCin(e.Cin)
                    ?? throw new ValidationException("Le 6e chiffre du CIN doit être 1 (Masculin) ou 2 (Féminin).");
            }
        }

        await UniciteContact.VerifierAsync(Db, e.Email, e.Telephone, etudiantIdExclu: modification ? e.Id : null);
    }
}

public class DisponibilitesController(AppDbContext db) : CrudController<DisponibiliteEnseignant>(db)
{
    protected override IQueryable<DisponibiliteEnseignant> Query() =>
        Db.Disponibilites.Include(d => d.Enseignant).OrderBy(d => d.JourSemaine).ThenBy(d => d.HeureDebut);
    protected override void Map(DisponibiliteEnseignant c, DisponibiliteEnseignant s)
    {
        c.EnseignantId = s.EnseignantId;
        c.JourSemaine = s.JourSemaine;
        c.HeureDebut = s.HeureDebut;
        c.HeureFin = s.HeureFin;
        c.Disponible = s.Disponible;
        c.Commentaire = s.Commentaire;
    }
    protected override Task ValidateAsync(DisponibiliteEnseignant e, bool modification)
    {
        var min = new TimeOnly(7, 0);
        var max = new TimeOnly(19, 0);
        if (e.HeureDebut < min) throw new ValidationException("L'heure de début ne peut pas être avant 07:00.");
        if (e.HeureFin > max) throw new ValidationException("L'heure de fin ne peut pas dépasser 19:00.");
        if (e.HeureFin <= e.HeureDebut) throw new ValidationException("L'heure de fin doit être après l'heure de début.");
        if ((e.HeureFin - e.HeureDebut) < TimeSpan.FromHours(1)) throw new ValidationException("La disponibilité doit durer au moins 1 heure.");
        return Task.CompletedTask;
    }
}

/// <summary>Contrôle d'unicité de l'email et du téléphone, partagé entre étudiants et enseignants.</summary>
internal static class UniciteContact
{
    public static async Task VerifierAsync(AppDbContext db, string? email, string? telephone, int? etudiantIdExclu = null, int? enseignantIdExclu = null)
    {
        if (!string.IsNullOrWhiteSpace(email))
        {
            var dup = await db.Etudiants.AnyAsync(x => x.Email == email && (etudiantIdExclu == null || x.Id != etudiantIdExclu))
                   || await db.Enseignants.AnyAsync(x => x.Email == email && (enseignantIdExclu == null || x.Id != enseignantIdExclu));
            if (dup) throw new ConflitException($"L'email « {email} » est déjà utilisé par un autre étudiant ou enseignant.");
        }
        if (!string.IsNullOrWhiteSpace(telephone))
        {
            var dup = await db.Etudiants.AnyAsync(x => x.Telephone == telephone && (etudiantIdExclu == null || x.Id != etudiantIdExclu))
                   || await db.Enseignants.AnyAsync(x => x.Telephone == telephone && (enseignantIdExclu == null || x.Id != enseignantIdExclu));
            if (dup) throw new ConflitException($"Le téléphone « {telephone} » est déjà utilisé par un autre étudiant ou enseignant.");
        }
    }
}
