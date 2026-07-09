using EmitGestion.Api.Models;

namespace EmitGestion.Api.DTOs;

// ---------- Authentification ----------
public record LoginRequest(string Login, string MotDePasse);

public record LoginResponse(string Token, UtilisateurInfo Utilisateur);

public record UtilisateurInfo(int Id, string Login, string NomComplet, string Role, int? EnseignantId);

public record CreateUtilisateurRequest(
    string Login,
    string NomComplet,
    string MotDePasse,
    RoleUtilisateur Role,
    int? EnseignantId);

public record UpdateUtilisateurRequest(
    string NomComplet,
    RoleUtilisateur Role,
    bool Actif,
    int? EnseignantId,
    string? NouveauMotDePasse);

// ---------- Détection de conflits / disponibilité ----------
public record ConflitInfo(string Type, string Message, int? SeanceId);

/// <summary>Résultat d'une vérification de planification d'une séance.</summary>
public record VerificationSeance(bool Ok, List<ConflitInfo> Conflits);

// ---------- Génération automatique de l'emploi du temps ----------
/// <summary>Une séance proposée par le planificateur (non encore enregistrée).</summary>
public record PropositionSeance(
    string Jour,          // "Lundi".."Vendredi"
    string HeureDebut,    // "08:00"
    string HeureFin,      // "10:00"
    int MatiereId, string MatiereNom,
    int EnseignantId, string EnseignantNom,
    int SalleId, string SalleNom,
    TypeSeance TypeSeance);

public record ResultatGeneration(List<PropositionSeance> Propositions, List<string> NonPlacees);

public record AppliquerGenerationRequest(
    int GroupeId, DateOnly Lundi, bool Recurrent, bool Remplacer,
    List<PropositionSeance> Propositions);

// ---------- Tableau de bord ----------
public record DashboardStats(
    int NbFilieres,
    int NbEtudiants,
    int NbEnseignants,
    int NbSalles,
    int NbMatieres,
    int NbGroupes,
    int NbSeances,
    string? AnneeActive,
    List<RepartitionItem> EtudiantsParFiliere,
    List<RepartitionItem> EtudiantsParNiveau);

public record RepartitionItem(string Libelle, int Total);
