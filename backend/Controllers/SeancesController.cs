using EmitGestion.Api.Data;
using EmitGestion.Api.DTOs;
using EmitGestion.Api.Models;
using EmitGestion.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmitGestion.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SeancesController(AppDbContext db, SeanceService service, PlanificateurService planificateur) : ControllerBase
{
    private IQueryable<Seance> Base() =>
        db.Seances
            .Include(s => s.Matiere)
            .Include(s => s.Enseignant)
            .Include(s => s.Salle).ThenInclude(s => s!.Batiment)
            .Include(s => s.Groupe)
            .Include(s => s.AnneeAcademique);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Seance>>> GetAll(
        [FromQuery] int? groupeId, [FromQuery] int? enseignantId, [FromQuery] int? salleId,
        [FromQuery] int? anneeId, [FromQuery] DateOnly? du, [FromQuery] DateOnly? au)
    {
        var q = Base();
        if (groupeId is not null) q = q.Where(s => s.GroupeId == groupeId);
        if (enseignantId is not null) q = q.Where(s => s.EnseignantId == enseignantId);
        if (salleId is not null) q = q.Where(s => s.SalleId == salleId);
        if (anneeId is not null) q = q.Where(s => s.AnneeAcademiqueId == anneeId);
        if (du is not null) q = q.Where(s => s.DateCours >= du);
        if (au is not null) q = q.Where(s => s.DateCours <= au);
        return await q.OrderBy(s => s.DateCours).ThenBy(s => s.HeureDebut).AsNoTracking().ToListAsync();
    }

    [HttpGet("mon-edt")]
    public async Task<ActionResult<IEnumerable<Seance>>> MonEdt([FromQuery] DateOnly? du, [FromQuery] DateOnly? au)
    {
        var idClaim = User.FindFirst("enseignantId")?.Value;
        if (!int.TryParse(idClaim, out var enseignantId))
            return BadRequest(new { message = "Aucune fiche enseignant n'est liée à ce compte." });
        var q = Base().Where(s => s.EnseignantId == enseignantId);
        if (du is not null) q = q.Where(s => s.DateCours >= du);
        if (au is not null) q = q.Where(s => s.DateCours <= au);
        return await q.OrderBy(s => s.DateCours).ThenBy(s => s.HeureDebut).AsNoTracking().ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Seance>> GetById(int id)
    {
        var s = await Base().AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return s is null ? NotFound() : s;
    }

    [HttpPost("verifier")]
    public async Task<ActionResult<VerificationSeance>> Verifier([FromBody] Seance input, [FromQuery] int? exclureId)
        => await service.VerifierAsync(input, exclureId);

    /// <summary>
    /// Génère automatiquement une proposition d'emploi du temps pour un groupe et une semaine
    /// (algorithme d'optimisation sous contraintes). Rien n'est enregistré : la proposition est
    /// renvoyée pour revue avant application via <c>appliquer</c>.
    /// </summary>
    [HttpPost("generer")]
    [Authorize(Roles = Roles.Gestion)]
    public async Task<ActionResult<ResultatGeneration>> Generer(
        [FromQuery] int groupeId, [FromQuery] DateOnly lundi, [FromQuery] int dureeMinutes = 120)
    {
        try { return await planificateur.GenererAsync(groupeId, lundi, dureeMinutes); }
        catch (ValidationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    /// <summary>Applique une proposition générée : crée les séances (récurrentes ou non), en ignorant les conflits.</summary>
    [HttpPost("appliquer")]
    [Authorize(Roles = Roles.Gestion)]
    public async Task<ActionResult> Appliquer([FromBody] AppliquerGenerationRequest req)
    {
        var groupe = await db.Groupes.FindAsync(req.GroupeId);
        if (groupe is null) return NotFound(new { message = "Groupe introuvable." });

        var demain = DateOnly.FromDateTime(DateTime.Today).AddDays(1);

        // Option « refaire » : on efface l'emploi du temps futur du groupe avant de reconstruire.
        if (req.Remplacer)
            await db.Seances.Where(s => s.GroupeId == req.GroupeId && s.DateCours >= req.Lundi).ExecuteDeleteAsync();

        var creees = 0;
        var ignorees = new List<string>();

        foreach (var p in req.Propositions)
        {
            var jour = Enum.Parse<JourSemaine>(p.Jour);
            var date = req.Lundi.AddDays((int)jour - 1);
            while (date < demain) date = date.AddDays(7); // première occurrence au plus tôt demain

            var annee = await AnneeAcademiqueHelper.PourDateAsync(db, date);
            if (annee is null) { ignorees.Add($"{p.MatiereNom} ({p.Jour}) : aucune année académique ne couvre cette date."); continue; }

            var serie = req.Recurrent ? Guid.NewGuid() : (Guid?)null;
            var horizon = req.Recurrent ? annee.DateFin : date;
            if (horizon < date) horizon = date;
            var deb = TimeOnly.Parse(p.HeureDebut);
            var fin = TimeOnly.Parse(p.HeureFin);
            var placee = false;

            for (var d = date; d <= horizon; d = d.AddDays(7))
            {
                var occ = new Seance
                {
                    DateCours = d, HeureDebut = deb, HeureFin = fin, TypeSeance = p.TypeSeance,
                    MatiereId = p.MatiereId, EnseignantId = p.EnseignantId, SalleId = p.SalleId,
                    GroupeId = req.GroupeId, AnneeAcademiqueId = annee.Id, SerieId = serie,
                };
                var v = await service.VerifierAsync(occ);
                if (!v.Ok) continue; // on ignore les semaines en conflit
                db.Seances.Add(occ);
                creees++;
                placee = true;
                if (!req.Recurrent) break;
            }
            if (!placee) ignorees.Add($"{p.MatiereNom} ({p.Jour} {p.HeureDebut}) : conflit non résolu.");
        }

        await db.SaveChangesAsync();
        return Ok(new { creees, ignorees });
    }

    /// <summary>
    /// Crée une séance. Par défaut récurrente chaque semaine : génère une occurrence par semaine
    /// depuis la date de cours jusqu'à <paramref name="dateFin"/> (ou la fin de l'année académique).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = Roles.Gestion)]
    public async Task<ActionResult> Create([FromBody] Seance input,
        [FromQuery] bool forcer = false, [FromQuery] bool recurrent = true, [FromQuery] DateOnly? dateFin = null)
    {
        var demain = DateOnly.FromDateTime(DateTime.Today).AddDays(1);
        if (input.DateCours < demain)
            return BadRequest(new { message = "La date de la séance doit être au minimum demain (au moins un jour à l'avance)." });

        if (await ValiderReferencesAsync(input) is string erreur)
            return BadRequest(new { message = erreur });

        var annee = await AnneeAcademiqueHelper.PourDateAsync(db, input.DateCours);
        if (annee is null)
            return BadRequest(new { message = "Aucune année académique ne couvre cette date." });
        input.AnneeAcademiqueId = annee.Id;

        // Vérifie la séance de base (1re occurrence).
        var verif = await service.VerifierAsync(input);
        if (!verif.Ok && !forcer) return Conflict(verif);

        var horizon = dateFin ?? annee.DateFin;
        if (horizon < input.DateCours) horizon = input.DateCours;

        var serie = recurrent ? Guid.NewGuid() : (Guid?)null;
        var creees = new List<Seance>();
        var ignorees = new List<string>();

        for (var d = input.DateCours; d <= horizon; d = d.AddDays(7))
        {
            var occ = Cloner(input, d, annee.Id, serie);
            var v = await service.VerifierAsync(occ);
            if (!v.Ok && !forcer) { ignorees.Add($"{d:dd/MM/yyyy}"); continue; }
            db.Seances.Add(occ);
            creees.Add(occ);
            if (!recurrent) break;
        }

        await db.SaveChangesAsync();
        return Ok(new { creees = creees.Count, ignorees, serieId = serie });
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.Gestion)]
    public async Task<ActionResult<Seance>> Update(int id, [FromBody] Seance input,
        [FromQuery] bool forcer = false, [FromQuery] DateOnly? tronquerSerieApres = null)
    {
        var existant = await db.Seances.FindAsync(id);
        if (existant is null) return NotFound();

        if (await ValiderReferencesAsync(input) is string erreur)
            return BadRequest(new { message = erreur });

        var annee = await AnneeAcademiqueHelper.PourDateAsync(db, input.DateCours);
        if (annee is not null) input.AnneeAcademiqueId = annee.Id;

        var verif = await service.VerifierAsync(input, id);
        if (!verif.Ok && !forcer) return Conflict(verif);

        Map(existant, input);
        if (annee is not null) existant.AnneeAcademiqueId = annee.Id;

        // Fin de série : supprime les occurrences suivantes de la même série.
        if (tronquerSerieApres is DateOnly fin && existant.SerieId is Guid sid)
        {
            await db.Seances.Where(s => s.SerieId == sid && s.DateCours > fin).ExecuteDeleteAsync();
        }

        await db.SaveChangesAsync();
        var maj = await Base().AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return Ok(maj);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.Gestion)]
    public async Task<IActionResult> Delete(int id, [FromQuery] bool serieEntiere = false)
    {
        var s = await db.Seances.FindAsync(id);
        if (s is null) return NotFound();

        if (serieEntiere && s.SerieId is Guid sid)
            await db.Seances.Where(x => x.SerieId == sid && x.DateCours >= s.DateCours).ExecuteDeleteAsync();
        else
            db.Seances.Remove(s);

        await db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>Vérifie que les entités liées (matière, enseignant, salle, groupe) sont bien sélectionnées et existent.</summary>
    private async Task<string?> ValiderReferencesAsync(Seance s)
    {
        if (s.MatiereId <= 0 || !await db.Matieres.AnyAsync(x => x.Id == s.MatiereId))
            return "Veuillez sélectionner une matière.";
        if (s.EnseignantId <= 0 || !await db.Enseignants.AnyAsync(x => x.Id == s.EnseignantId))
            return "Veuillez sélectionner un enseignant.";
        if (s.SalleId <= 0 || !await db.Salles.AnyAsync(x => x.Id == s.SalleId))
            return "Veuillez sélectionner une salle.";
        if (s.GroupeId <= 0 || !await db.Groupes.AnyAsync(x => x.Id == s.GroupeId))
            return "Veuillez sélectionner un groupe.";
        return null;
    }

    private static Seance Cloner(Seance src, DateOnly date, int anneeId, Guid? serie) => new()
    {
        DateCours = date,
        HeureDebut = src.HeureDebut,
        HeureFin = src.HeureFin,
        TypeSeance = src.TypeSeance,
        MatiereId = src.MatiereId,
        EnseignantId = src.EnseignantId,
        SalleId = src.SalleId,
        GroupeId = src.GroupeId,
        AnneeAcademiqueId = anneeId,
        SerieId = serie,
    };

    private static void Map(Seance c, Seance s)
    {
        c.DateCours = s.DateCours;
        c.HeureDebut = s.HeureDebut;
        c.HeureFin = s.HeureFin;
        c.TypeSeance = s.TypeSeance;
        c.MatiereId = s.MatiereId;
        c.EnseignantId = s.EnseignantId;
        c.SalleId = s.SalleId;
        c.GroupeId = s.GroupeId;
    }
}
