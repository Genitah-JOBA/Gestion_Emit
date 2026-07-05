using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace EmitGestion.Api.Models;

public class Filiere
{
    public int Id { get; set; }

    [Required, MaxLength(20)]
    public string CodeFiliere { get; set; } = string.Empty; // ex: INFO, MATH, GEST

    [Required, MaxLength(150)]
    public string Nom { get; set; } = string.Empty;

    /// <summary>Lettre spécifique (1 majuscule) utilisée dans le matricule étudiant. Ex: I pour INFO.</summary>
    [Required, MaxLength(1)]
    public string LettreSpecifique { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    /// <summary>Soft-delete : une filière utilisée par d'autres données est archivée (cachée) au lieu d'être supprimée.</summary>
    public bool Archivee { get; set; }

    public DateTime DateCreation { get; set; } = DateTime.UtcNow;

    [JsonIgnore] public ICollection<Parcours> Parcours { get; set; } = new List<Parcours>();
    [JsonIgnore] public ICollection<Matiere> Matieres { get; set; } = new List<Matiere>();
    [JsonIgnore] public ICollection<Etudiant> Etudiants { get; set; } = new List<Etudiant>();
    [JsonIgnore] public ICollection<Groupe> Groupes { get; set; } = new List<Groupe>();
}

public class Niveau
{
    public int Id { get; set; }

    [Required, MaxLength(20)]
    public string Nom { get; set; } = string.Empty; // L1, L2, L3, M1, M2

    public int Ordre { get; set; }

    [JsonIgnore] public ICollection<Matiere> Matieres { get; set; } = new List<Matiere>();
    [JsonIgnore] public ICollection<Etudiant> Etudiants { get; set; } = new List<Etudiant>();
    [JsonIgnore] public ICollection<Groupe> Groupes { get; set; } = new List<Groupe>();
    [JsonIgnore] public ICollection<Parcours> Parcours { get; set; } = new List<Parcours>();
}

public class Parcours
{
    public int Id { get; set; }

    [Required, MaxLength(150)]
    public string Nom { get; set; } = string.Empty;

    public int FiliereId { get; set; }
    public Filiere? Filiere { get; set; }

    /// <summary>Niveaux d'études rattachés à ce parcours (relation plusieurs-à-plusieurs).</summary>
    public ICollection<Niveau> Niveaux { get; set; } = new List<Niveau>();

    /// <summary>
    /// Identifiants des niveaux : exposés en lecture (calculés depuis <see cref="Niveaux"/>)
    /// et utilisés en écriture depuis le frontend.
    /// </summary>
    [NotMapped]
    public List<int> NiveauxIds
    {
        get => _niveauxIds ?? Niveaux?.Select(n => n.Id).ToList() ?? new List<int>();
        set => _niveauxIds = value;
    }
    private List<int>? _niveauxIds;

    [JsonIgnore] public ICollection<Matiere> Matieres { get; set; } = new List<Matiere>();
    [JsonIgnore] public ICollection<Etudiant> Etudiants { get; set; } = new List<Etudiant>();
    [JsonIgnore] public ICollection<Groupe> Groupes { get; set; } = new List<Groupe>();
}

public class Matiere
{
    public int Id { get; set; }

    [Required, MaxLength(20)]
    public string CodeMatiere { get; set; } = string.Empty; // ex: INFO101

    [Required, MaxLength(150)]
    public string Nom { get; set; } = string.Empty;

    /// <summary>Coefficient entier (>= 1).</summary>
    public int Coefficient { get; set; } = 1;
    /// <summary>Crédits ECTS (facultatif).</summary>
    public int? CreditsEcts { get; set; }
    /// <summary>Numéro de semestre (S1..S9 selon le niveau).</summary>
    public int Semestre { get; set; } = 1;

    public int FiliereId { get; set; }
    public Filiere? Filiere { get; set; }

    public int NiveauId { get; set; }
    public Niveau? Niveau { get; set; }

    public int? ParcoursId { get; set; }
    public Parcours? Parcours { get; set; }

    [JsonIgnore] public ICollection<Seance> Seances { get; set; } = new List<Seance>();
}
