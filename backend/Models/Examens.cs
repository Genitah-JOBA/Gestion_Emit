using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EmitGestion.Api.Models;

/// <summary>
/// Un examen : par matière (donc par filière + niveau), à une date/heure précise, sans récurrence.
/// Il peut se dérouler dans plusieurs salles (les étudiants sont répartis), chacune avec ses surveillants.
/// </summary>
public class Examen
{
    public int Id { get; set; }

    public int MatiereId { get; set; }
    public Matiere? Matiere { get; set; }

    public DateOnly Date { get; set; }
    public TimeOnly HeureDebut { get; set; }
    public TimeOnly HeureFin { get; set; }

    /// <summary>Enseignant responsable (celui qui enseigne la matière).</summary>
    public int EnseignantId { get; set; }
    public Enseignant? Enseignant { get; set; }

    public SessionExamen Session { get; set; } = SessionExamen.Normale;

    /// <summary>Nom du chef de service de la scolarité (figure sur l'avis imprimé).</summary>
    [MaxLength(150)]
    public string? ChefScolarite { get; set; }

    public int AnneeAcademiqueId { get; set; }
    public AnneeAcademique? AnneeAcademique { get; set; }

    /// <summary>Salles de l'examen avec leurs surveillants (au moins une).</summary>
    public ICollection<ExamenSalle> Salles { get; set; } = new List<ExamenSalle>();
}

/// <summary>Une salle utilisée pour un examen, avec ses surveillants (2 obligatoires + 1 facultatif).</summary>
public class ExamenSalle
{
    public int Id { get; set; }

    public int ExamenId { get; set; }
    [JsonIgnore] public Examen? Examen { get; set; }

    public int SalleId { get; set; }
    public Salle? Salle { get; set; }

    [MaxLength(150)]
    public string Surveillant1 { get; set; } = string.Empty;
    [MaxLength(150)]
    public string Surveillant2 { get; set; } = string.Empty;
    [MaxLength(150)]
    public string? Surveillant3 { get; set; }
}
