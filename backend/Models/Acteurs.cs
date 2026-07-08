using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EmitGestion.Api.Models;

public class Enseignant
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Nom { get; set; } = string.Empty;

    // Prénoms facultatif (le formulaire l'indique « optionnel ») : type nullable, sinon
    // ASP.NET le rend implicitement requis (nullable reference types) et rejette les saisies sans prénom.
    [MaxLength(150)]
    public string? Prenoms { get; set; }

    public GradeEnseignant Grade { get; set; } = GradeEnseignant.Assistant;

    [MaxLength(150)]
    public string? Email { get; set; }

    [MaxLength(30)]
    public string? Telephone { get; set; }

    [JsonIgnore] public ICollection<Seance> Seances { get; set; } = new List<Seance>();
    [JsonIgnore] public ICollection<DisponibiliteEnseignant> Disponibilites { get; set; } = new List<DisponibiliteEnseignant>();
}

public class Groupe
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Nom { get; set; } = string.Empty; // ex: L2 INFO A

    public int FiliereId { get; set; }
    public Filiere? Filiere { get; set; }

    public int NiveauId { get; set; }
    public Niveau? Niveau { get; set; }

    public int? ParcoursId { get; set; }
    public Parcours? Parcours { get; set; }

    [JsonIgnore] public ICollection<Seance> Seances { get; set; } = new List<Seance>();
}

public class Etudiant
{
    public int Id { get; set; }

    [Required, MaxLength(30)]
    public string Matricule { get; set; } = string.Empty; // unique

    [Required, MaxLength(100)]
    public string Nom { get; set; } = string.Empty;

    // Prénoms facultatif (le formulaire l'indique « optionnel ») : type nullable, sinon
    // ASP.NET le rend implicitement requis (nullable reference types) et rejette les saisies sans prénom.
    [MaxLength(150)]
    public string? Prenoms { get; set; }

    public DateOnly? DateNaissance { get; set; }

    public Sexe Sexe { get; set; } = Sexe.Masculin;

    /// <summary>CIN (carte d'identité) — obligatoire pour les majeurs. Le 6e chiffre code le genre (1=M, 2=F).</summary>
    [MaxLength(20)]
    public string? Cin { get; set; }

    [MaxLength(150)]
    public string? Email { get; set; }

    [MaxLength(30)]
    public string? Telephone { get; set; }

    public int FiliereId { get; set; }
    public Filiere? Filiere { get; set; }

    public int NiveauId { get; set; }
    public Niveau? Niveau { get; set; }

    public int? ParcoursId { get; set; }
    public Parcours? Parcours { get; set; }

    public int AnneeAcademiqueId { get; set; }
    public AnneeAcademique? AnneeAcademique { get; set; }

    public StatutEtudiant Statut { get; set; } = StatutEtudiant.Passant;
}
