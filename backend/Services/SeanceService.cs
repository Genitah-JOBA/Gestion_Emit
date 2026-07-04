using EmitGestion.Api.Data;
using EmitGestion.Api.DTOs;
using EmitGestion.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EmitGestion.Api.Services;

/// <summary>
/// Logique métier de l'emploi du temps : détection des conflits
/// (salle occupée, enseignant occupé, groupe occupé) et vérification
/// de la disponibilité de l'enseignant.
/// </summary>
public class SeanceService
{
    private readonly AppDbContext _db;

    public SeanceService(AppDbContext db) => _db = db;

    /// <summary>Vérifie la planification d'une séance avant insertion/modification.</summary>
    /// <param name="seanceIdExclue">Id à ignorer (cas d'une modification).</param>
    public async Task<VerificationSeance> VerifierAsync(Seance s, int? seanceIdExclue = null)
    {
        var conflits = new List<ConflitInfo>();

        if (s.HeureFin <= s.HeureDebut)
        {
            conflits.Add(new ConflitInfo("horaire",
                "L'heure de fin doit être postérieure à l'heure de début.", null));
            return new VerificationSeance(false, conflits);
        }

        // Séances le même jour qui se chevauchent dans le temps.
        var memeJour = await _db.Seances
            .Include(x => x.Salle)
            .Include(x => x.Enseignant)
            .Include(x => x.Groupe)
            .Where(x => x.DateCours == s.DateCours
                        && (seanceIdExclue == null || x.Id != seanceIdExclue))
            .ToListAsync();

        var chevauchent = memeJour
            .Where(x => s.HeureDebut < x.HeureFin && x.HeureDebut < s.HeureFin)
            .ToList();

        foreach (var c in chevauchent.Where(x => x.SalleId == s.SalleId))
            conflits.Add(new ConflitInfo("salle",
                $"Salle déjà occupée de {c.HeureDebut:HH\\:mm} à {c.HeureFin:HH\\:mm} ({c.Salle?.Nom}).", c.Id));

        foreach (var c in chevauchent.Where(x => x.EnseignantId == s.EnseignantId))
            conflits.Add(new ConflitInfo("enseignant",
                $"Enseignant déjà en cours de {c.HeureDebut:HH\\:mm} à {c.HeureFin:HH\\:mm}.", c.Id));

        foreach (var c in chevauchent.Where(x => x.GroupeId == s.GroupeId))
            conflits.Add(new ConflitInfo("groupe",
                $"Groupe déjà en cours de {c.HeureDebut:HH\\:mm} à {c.HeureFin:HH\\:mm}.", c.Id));

        // Le dimanche n'est pas un jour de cours.
        if (s.DateCours.DayOfWeek == DayOfWeek.Sunday)
        {
            conflits.Add(new ConflitInfo("jour", "Le dimanche n'est pas un jour de cours.", null));
            return new VerificationSeance(false, conflits);
        }

        // Vérification de la disponibilité hebdomadaire de l'enseignant.
        // DayOfWeek : Lundi=1..Samedi=6 -> correspond directement à l'énumération JourSemaine.
        var jour = (JourSemaine)(int)s.DateCours.DayOfWeek;

        var dispos = await _db.Disponibilites
            .Where(d => d.EnseignantId == s.EnseignantId && d.JourSemaine == jour)
            .ToListAsync();

        if (dispos.Count > 0)
        {
            // Indisponibilités explicites qui chevauchent la séance.
            var indispo = dispos.FirstOrDefault(d => !d.Disponible
                && s.HeureDebut < d.HeureFin && d.HeureDebut < s.HeureFin);
            if (indispo != null)
            {
                conflits.Add(new ConflitInfo("disponibilite",
                    $"L'enseignant est marqué indisponible le {jour} de {indispo.HeureDebut:HH\\:mm} à {indispo.HeureFin:HH\\:mm}.", null));
            }
            else
            {
                // Si des créneaux de disponibilité existent, la séance doit être couverte par l'un d'eux.
                var creneauxDispo = dispos.Where(d => d.Disponible).ToList();
                if (creneauxDispo.Count > 0)
                {
                    var couverte = creneauxDispo.Any(d => s.HeureDebut >= d.HeureDebut && s.HeureFin <= d.HeureFin);
                    if (!couverte)
                        conflits.Add(new ConflitInfo("disponibilite",
                            $"La séance est en dehors des créneaux de disponibilité déclarés de l'enseignant pour le {jour}.", null));
                }
            }
        }

        return new VerificationSeance(conflits.Count == 0, conflits);
    }
}
