using EmitGestion.Api.Controllers;
using EmitGestion.Api.Data;
using EmitGestion.Api.DTOs;
using EmitGestion.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EmitGestion.Api.Services;

/// <summary>
/// Planificateur automatique d'emploi du temps (algorithme d'optimisation sous contraintes).
///
/// Pour un groupe donné, place chaque matière du programme (même filière + niveau) dans un
/// créneau valide de la semaine, en respectant :
///   - aucun conflit de salle / d'enseignant / de groupe,
///   - la disponibilité déclarée de l'enseignant,
///   - les heures d'ouverture (7h–18h).
///
/// Heuristique : MRV (« Minimum Remaining Values » — on place d'abord la matière la plus
/// contrainte) + fonction de score qui favorise un emploi du temps de qualité
/// (matinées, répartition sur la semaine, journées compactes, enseignant historique).
///
/// Limites du modèle actuel (assumées) : pas de lien matière→enseignant (on prend l'enseignant
/// historique sinon n'importe quel enseignant disponible) ni d'effectif de groupe (pas de
/// contrôle de capacité de salle).
/// </summary>
public class PlanificateurService(AppDbContext db)
{
    private static readonly TimeOnly Ouverture = new(7, 0);
    private static readonly TimeOnly Fermeture = new(18, 0);

    private static bool Chevauche(TimeOnly d1, TimeOnly f1, TimeOnly d2, TimeOnly f2) => d1 < f2 && d2 < f1;

    // Affichage d'une salle : « numéro — bâtiment » (repli sur le nom si pas de numéro).
    private static string LabelSalle(Salle s)
    {
        var num = string.IsNullOrWhiteSpace(s.Numero) ? s.Nom : s.Numero;
        return s.Batiment != null ? $"{num} — {s.Batiment.Nom}" : num;
    }

    /// <summary>Génère une proposition d'emploi du temps pour la semaine indiquée (rien n'est enregistré).</summary>
    public async Task<ResultatGeneration> GenererAsync(int groupeId, DateOnly lundi, int dureeMinutes = 120)
    {
        var groupe = await db.Groupes.FindAsync(groupeId)
            ?? throw new ValidationException("Groupe introuvable.");

        var duree = TimeSpan.FromMinutes(Math.Clamp(dureeMinutes, 60, 240));
        var samedi = lundi.AddDays(5);

        var matieres = await db.Matieres
            .Where(m => m.FiliereId == groupe.FiliereId && m.NiveauId == groupe.NiveauId)
            .OrderBy(m => m.Nom).ToListAsync();
        var enseignants = await db.Enseignants.Include(e => e.Matieres).ToListAsync();
        var salles = await db.Salles.Include(s => s.Batiment).ToListAsync();

        // Enseignants qui enseignent chaque matière (relation Enseignant↔Matiere).
        var profsDe = new Dictionary<int, List<Enseignant>>();
        foreach (var e in enseignants)
            foreach (var m in e.Matieres)
            {
                if (!profsDe.TryGetValue(m.Id, out var l)) { l = []; profsDe[m.Id] = l; }
                l.Add(e);
            }
        var dispos = await db.Disponibilites.ToListAsync();
        var existantes = await db.Seances
            .Where(s => s.DateCours >= lundi && s.DateCours <= samedi).ToListAsync();

        // Effectif du groupe : nombre d'étudiants qui y sont rattachés (0 = pas de contrainte de taille).
        var effectif = await db.Etudiants.CountAsync(e => e.GroupeId == groupeId);

        if (matieres.Count == 0)
            return new ResultatGeneration([], ["Aucune matière n'est définie pour la filière et le niveau de ce groupe."]);
        if (enseignants.Count == 0 || salles.Count == 0)
            return new ResultatGeneration([], ["Il faut au moins un enseignant et une salle pour générer un emploi du temps."]);

        // Enseignant le plus fréquent par matière (préférence issue de l'historique des séances).
        var histo = (await db.Seances.Select(s => new { s.MatiereId, s.EnseignantId }).ToListAsync())
            .GroupBy(x => x.MatiereId)
            .ToDictionary(g => g.Key,
                g => g.GroupBy(y => y.EnseignantId).OrderByDescending(z => z.Count()).First().Key);

        // Tables d'occupation (par jour 1..6). Clé enseignant/salle = (id, jour).
        var occEns = new Dictionary<(int, int), List<(TimeOnly, TimeOnly)>>();
        var occSalle = new Dictionary<(int, int), List<(TimeOnly, TimeOnly)>>();
        var occGroupe = new Dictionary<int, List<(TimeOnly, TimeOnly)>>();

        static void Ajouter(Dictionary<(int, int), List<(TimeOnly, TimeOnly)>> map, int id, int jour, TimeOnly d, TimeOnly f)
        {
            if (!map.TryGetValue((id, jour), out var l)) { l = []; map[(id, jour)] = l; }
            l.Add((d, f));
        }
        void AjouterGroupe(int jour, TimeOnly d, TimeOnly f)
        {
            if (!occGroupe.TryGetValue(jour, out var l)) { l = []; occGroupe[jour] = l; }
            l.Add((d, f));
        }

        foreach (var s in existantes)
        {
            int jour = (int)s.DateCours.DayOfWeek; // Lundi=1..Samedi=6, Dimanche=0
            if (jour is < 1 or > 6) continue;
            Ajouter(occEns, s.EnseignantId, jour, s.HeureDebut, s.HeureFin);
            Ajouter(occSalle, s.SalleId, jour, s.HeureDebut, s.HeureFin);
            if (s.GroupeId == groupeId) AjouterGroupe(jour, s.HeureDebut, s.HeureFin);
        }

        bool Libre(Dictionary<(int, int), List<(TimeOnly, TimeOnly)>> map, int id, int jour, TimeOnly d, TimeOnly f)
            => !(map.TryGetValue((id, jour), out var l) && l.Any(iv => Chevauche(d, f, iv.Item1, iv.Item2)));
        bool GroupeLibre(int jour, TimeOnly d, TimeOnly f)
            => !(occGroupe.TryGetValue(jour, out var l) && l.Any(iv => Chevauche(d, f, iv.Item1, iv.Item2)));

        bool EnseignantDisponible(int ensId, JourSemaine jour, DateOnly date, TimeOnly d, TimeOnly f)
        {
            // Seuls les créneaux dont la période de validité couvre la date de la séance comptent.
            var duJour = dispos.Where(x => x.EnseignantId == ensId && x.JourSemaine == jour
                && (x.DateDebut == null || x.DateDebut <= date)
                && (x.DateFin == null || x.DateFin >= date)).ToList();
            if (duJour.Count == 0) return true; // aucune contrainte déclarée
            if (duJour.Any(x => !x.Disponible && Chevauche(d, f, x.HeureDebut, x.HeureFin))) return false;
            var creneaux = duJour.Where(x => x.Disponible).ToList();
            if (creneaux.Count == 0) return true;
            return creneaux.Any(x => d >= x.HeureDebut && f <= x.HeureFin);
        }

        // Candidats valides pour une matière, avec score (plus haut = meilleur).
        List<Candidat> Candidats(Matiere m)
        {
            // Si des enseignants sont déclarés pour la matière, on s'y restreint ; sinon on prend tout le monde.
            var candidatsEns = profsDe.TryGetValue(m.Id, out var profs) && profs.Count > 0 ? profs : enseignants;
            var res = new List<Candidat>();
            for (int jour = 1; jour <= 5; jour++)
            {
                for (var deb = Ouverture; deb.Add(duree) <= Fermeture; deb = deb.AddHours(1))
                {
                    var fin = deb.Add(duree);
                    if (!GroupeLibre(jour, deb, fin)) continue;
                    foreach (var ens in candidatsEns)
                    {
                        if (!Libre(occEns, ens.Id, jour, deb, fin)) continue;
                        if (!EnseignantDisponible(ens.Id, (JourSemaine)jour, lundi.AddDays(jour - 1), deb, fin)) continue;
                        foreach (var salle in salles)
                        {
                            if (effectif > 0 && salle.Capacite < effectif) continue;                    // salle trop petite pour l'effectif
                            if (!Libre(occSalle, salle.Id, jour, deb, fin)) continue;

                            double score = 0;
                            if (histo.TryGetValue(m.Id, out var pref) && pref == ens.Id) score += 100; // enseignant habituel
                            score += 17 - deb.Hour;                                                     // matinées préférées
                            int charge = occGroupe.TryGetValue(jour, out var lj) ? lj.Count : 0;
                            score -= charge * 3;                                                        // répartir sur la semaine
                            if (occGroupe.TryGetValue(jour, out var lj2)
                                && lj2.Any(iv => iv.Item2 == deb || iv.Item1 == fin)) score += 5;       // journée compacte
                            score -= salle.Capacite * 0.05;                                             // préfère la plus petite salle qui suffit

                            res.Add(new Candidat(jour, deb, fin, ens.Id, salle.Id, score));
                        }
                    }
                }
            }
            return res;
        }

        var propositions = new List<PropositionSeance>();
        var nonPlacees = new List<string>();
        var restantes = matieres.ToList();

        while (restantes.Count > 0)
        {
            // MRV : la matière ayant le moins de créneaux valides est placée en premier.
            Matiere choisie = restantes[0];
            List<Candidat> meilleursCandidats = Candidats(choisie);
            foreach (var m in restantes.Skip(1))
            {
                var c = Candidats(m);
                if (c.Count < meilleursCandidats.Count) { choisie = m; meilleursCandidats = c; }
            }
            restantes.Remove(choisie);

            if (meilleursCandidats.Count == 0)
            {
                nonPlacees.Add($"{choisie.CodeMatiere} — {choisie.Nom}");
                continue;
            }

            var best = meilleursCandidats.OrderByDescending(x => x.Score).First();
            Ajouter(occEns, best.EnsId, best.Jour, best.Deb, best.Fin);
            Ajouter(occSalle, best.SalleId, best.Jour, best.Deb, best.Fin);
            AjouterGroupe(best.Jour, best.Deb, best.Fin);

            var ens = enseignants.First(e => e.Id == best.EnsId);
            var salle = salles.First(s => s.Id == best.SalleId);
            propositions.Add(new PropositionSeance(
                ((JourSemaine)best.Jour).ToString(),
                best.Deb.ToString("HH\\:mm"), best.Fin.ToString("HH\\:mm"),
                choisie.Id, choisie.Nom,
                ens.Id, $"{ens.Nom} {ens.Prenoms}".Trim(),
                salle.Id, LabelSalle(salle),
                TypeSeance.Cours));
        }

        propositions = propositions
            .OrderBy(p => Enum.Parse<JourSemaine>(p.Jour))
            .ThenBy(p => p.HeureDebut).ToList();

        return new ResultatGeneration(propositions, nonPlacees);
    }

    private readonly record struct Candidat(int Jour, TimeOnly Deb, TimeOnly Fin, int EnsId, int SalleId, double Score);
}
