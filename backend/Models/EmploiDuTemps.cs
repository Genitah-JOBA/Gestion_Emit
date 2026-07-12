using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EmitGestion.Api.Models;

public class AnneeAcademique
{
    public int Id { get; set; }

    [Required, MaxLength(20)]
    public string Libelle { get; set; } = string.Empty; // ex: 2024-2025

    public DateOnly DateDebut { get; set; }
    public DateOnly DateFin { get; set; }

    /// <summary>Année académique courante (une seule active à la fois).</summary>
    public bool Active { get; set; }

    [JsonIgnore] public ICollection<Etudiant> Etudiants { get; set; } = new List<Etudiant>();
    [JsonIgnore] public ICollection<Seance> Seances { get; set; } = new List<Seance>();
}

/// <summary>Une séance de cours planifiée dans l'emploi du temps.</summary>
public class Seance
{
    public int Id { get; set; }

    public DateOnly DateCours { get; set; }
    public TimeOnly HeureDebut { get; set; }
    public TimeOnly HeureFin { get; set; }

    public TypeSeance TypeSeance { get; set; } = TypeSeance.Cours;

    public int MatiereId { get; set; }
    public Matiere? Matiere { get; set; }

    public int EnseignantId { get; set; }
    public Enseignant? Enseignant { get; set; }

    public int SalleId { get; set; }
    public Salle? Salle { get; set; }

    public int GroupeId { get; set; }
    public Groupe? Groupe { get; set; }

    public int AnneeAcademiqueId { get; set; }
    public AnneeAcademique? AnneeAcademique { get; set; }

    /// <summary>Identifiant de série : regroupe les occurrences hebdomadaires d'une même séance récurrente.</summary>
    public Guid? SerieId { get; set; }
}

/// <summary>
/// Créneau de disponibilité hebdomadaire récurrent d'un enseignant.
/// Amélioration ajoutée : permet de vérifier qu'un enseignant est disponible
/// avant de planifier une séance.
/// </summary>
public class DisponibiliteEnseignant
{
    public int Id { get; set; }

    public int EnseignantId { get; set; }
    public Enseignant? Enseignant { get; set; }

    public JourSemaine JourSemaine { get; set; }
    public TimeOnly HeureDebut { get; set; }
    public TimeOnly HeureFin { get; set; }

    /// <summary>
    /// Période de validité (facultative) du créneau récurrent. Vides = toujours valable.
    /// Renseignées = le créneau ne s'applique qu'entre ces dates (ex. un cours qui dure 3 semaines).
    /// </summary>
    public DateOnly? DateDebut { get; set; }
    public DateOnly? DateFin { get; set; }

    /// <summary>true = disponible sur ce créneau, false = indisponible.</summary>
    public bool Disponible { get; set; } = true;

    [MaxLength(250)]
    public string? Commentaire { get; set; }
}
