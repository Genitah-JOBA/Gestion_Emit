using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EmitGestion.Api.Models;

/// <summary>Compte d'authentification. Rôles : Admin, Secretariat, Enseignant.</summary>
public class Utilisateur
{
    public int Id { get; set; }

    [Required, MaxLength(80)]
    public string Login { get; set; } = string.Empty;

    [Required, MaxLength(150)]
    public string NomComplet { get; set; } = string.Empty;

    [JsonIgnore]
    public string MotDePasseHash { get; set; } = string.Empty;

    public RoleUtilisateur Role { get; set; } = RoleUtilisateur.Secretariat;

    public bool Actif { get; set; } = true;

    /// <summary>Pour un compte de rôle Enseignant : lien vers sa fiche enseignant.</summary>
    public int? EnseignantId { get; set; }
    public Enseignant? Enseignant { get; set; }

    public DateTime DateCreation { get; set; } = DateTime.UtcNow;
}
