using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EmitGestion.Api.Models;

public class Batiment
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Nom { get; set; } = string.Empty;

    [MaxLength(250)]
    public string? Adresse { get; set; }

    [JsonIgnore] public ICollection<Salle> Salles { get; set; } = new List<Salle>();
}

public class Salle
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Nom { get; set; } = string.Empty; // ex: Amphi A, TD12

    /// <summary>Numéro de la salle au sein du bâtiment (ex : 001, 404). Unique par bâtiment.</summary>
    [MaxLength(20)]
    public string? Numero { get; set; }

    public int Capacite { get; set; }

    public TypeSalle TypeSalle { get; set; } = TypeSalle.SalleDeClasse;

    public int? BatimentId { get; set; }
    public Batiment? Batiment { get; set; }

    [JsonIgnore] public ICollection<Seance> Seances { get; set; } = new List<Seance>();
}
