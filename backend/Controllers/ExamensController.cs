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
public class ExamensController(AppDbContext db) : ControllerBase
{
    private IQueryable<Examen> Base() =>
        db.Examens
            .Include(e => e.Matiere).ThenInclude(m => m!.Filiere)
            .Include(e => e.Matiere).ThenInclude(m => m!.Niveau)
            .Include(e => e.Enseignant)
            .Include(e => e.AnneeAcademique)
            .Include(e => e.Salles).ThenInclude(s => s.Salle).ThenInclude(s => s!.Batiment);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Examen>>> GetAll(
        [FromQuery] int? filiereId, [FromQuery] int? niveauId)
    {
        var q = Base();
        if (filiereId is not null) q = q.Where(e => e.Matiere!.FiliereId == filiereId);
        if (niveauId is not null) q = q.Where(e => e.Matiere!.NiveauId == niveauId);
        return await q.OrderBy(e => e.Date).ThenBy(e => e.HeureDebut).AsNoTracking().ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Examen>> GetById(int id)
    {
        var e = await Base().AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return e is null ? NotFound() : e;
    }

    [HttpPost]
    [Authorize(Roles = Roles.Gestion)]
    public async Task<ActionResult> Create([FromBody] ExamenInput input, [FromQuery] bool forcer = false)
    {
        var erreur = await ValiderAsync(input);
        if (erreur is not null) return BadRequest(new { message = erreur });

        var matiere = await db.Matieres.FindAsync(input.MatiereId);
        var annee = await AnneeAcademiqueHelper.PourDateAsync(db, input.Date);
        if (annee is null) return BadRequest(new { message = "Aucune année académique ne couvre cette date." });

        var conflits = await DetecterConflitsAsync(input, matiere!, null);
        if (conflits.Count > 0 && !forcer) return Conflict(new VerificationSeance(false, conflits));

        var examen = new Examen
        {
            MatiereId = input.MatiereId, Date = input.Date,
            HeureDebut = input.HeureDebut, HeureFin = input.HeureFin,
            EnseignantId = input.EnseignantId, Session = input.Session,
            ChefScolarite = string.IsNullOrWhiteSpace(input.ChefScolarite) ? null : input.ChefScolarite.Trim(),
            AnneeAcademiqueId = annee.Id,
            Salles = input.Salles.Select(MapSalle).ToList(),
        };
        db.Examens.Add(examen);
        await db.SaveChangesAsync();

        var cree = await Base().AsNoTracking().FirstOrDefaultAsync(x => x.Id == examen.Id);
        return CreatedAtAction(nameof(GetById), new { id = examen.Id }, cree);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.Gestion)]
    public async Task<ActionResult> Update(int id, [FromBody] ExamenInput input, [FromQuery] bool forcer = false)
    {
        var examen = await db.Examens.Include(e => e.Salles).FirstOrDefaultAsync(e => e.Id == id);
        if (examen is null) return NotFound();

        var erreur = await ValiderAsync(input);
        if (erreur is not null) return BadRequest(new { message = erreur });

        var matiere = await db.Matieres.FindAsync(input.MatiereId);
        var annee = await AnneeAcademiqueHelper.PourDateAsync(db, input.Date);
        if (annee is null) return BadRequest(new { message = "Aucune année académique ne couvre cette date." });

        var conflits = await DetecterConflitsAsync(input, matiere!, id);
        if (conflits.Count > 0 && !forcer) return Conflict(new VerificationSeance(false, conflits));

        examen.MatiereId = input.MatiereId;
        examen.Date = input.Date;
        examen.HeureDebut = input.HeureDebut;
        examen.HeureFin = input.HeureFin;
        examen.EnseignantId = input.EnseignantId;
        examen.Session = input.Session;
        examen.ChefScolarite = string.IsNullOrWhiteSpace(input.ChefScolarite) ? null : input.ChefScolarite.Trim();
        examen.AnneeAcademiqueId = annee.Id;

        db.ExamenSalles.RemoveRange(examen.Salles);
        examen.Salles = input.Salles.Select(MapSalle).ToList();

        await db.SaveChangesAsync();
        var maj = await Base().AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return Ok(maj);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.Gestion)]
    public async Task<IActionResult> Delete(int id)
    {
        var e = await db.Examens.FindAsync(id);
        if (e is null) return NotFound();
        db.Examens.Remove(e);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ---------- Helpers ----------

    private static ExamenSalle MapSalle(ExamenSalleInput s) => new()
    {
        SalleId = s.SalleId,
        Surveillant1 = s.Surveillant1?.Trim() ?? "",
        Surveillant2 = s.Surveillant2?.Trim() ?? "",
        Surveillant3 = string.IsNullOrWhiteSpace(s.Surveillant3) ? null : s.Surveillant3.Trim(),
    };

    private async Task<string?> ValiderAsync(ExamenInput e)
    {
        if (e.MatiereId <= 0 || !await db.Matieres.AnyAsync(x => x.Id == e.MatiereId))
            return "Veuillez sélectionner une matière.";
        if (e.EnseignantId <= 0 || !await db.Enseignants.AnyAsync(x => x.Id == e.EnseignantId))
            return "Veuillez sélectionner l'enseignant.";
        if (e.HeureFin <= e.HeureDebut)
            return "L'heure de fin doit être après l'heure de début.";
        if (e.Salles is null || e.Salles.Count == 0)
            return "Ajoutez au moins une salle.";
        foreach (var s in e.Salles)
        {
            if (s.SalleId <= 0 || !await db.Salles.AnyAsync(x => x.Id == s.SalleId))
                return "Chaque salle doit être sélectionnée.";
            if (string.IsNullOrWhiteSpace(s.Surveillant1) || string.IsNullOrWhiteSpace(s.Surveillant2))
                return "Chaque salle doit avoir au moins 2 surveillants.";
        }
        if (e.Salles.Select(s => s.SalleId).Distinct().Count() != e.Salles.Count)
            return "Une même salle ne peut pas être utilisée deux fois pour le même examen.";
        return null;
    }

    /// <summary>Conflits d'un examen avec les cours et les autres examens : même créneau qui se chevauche.</summary>
    private async Task<List<ConflitInfo>> DetecterConflitsAsync(ExamenInput e, Matiere matiere, int? exclureId)
    {
        var conflits = new List<ConflitInfo>();
        var salleIds = e.Salles.Select(s => s.SalleId).ToHashSet();

        // Cours (séances) du même jour qui chevauchent l'examen.
        var seances = await db.Seances.Include(s => s.Groupe).Include(s => s.Salle)
            .Where(s => s.DateCours == e.Date && s.HeureDebut < e.HeureFin && e.HeureDebut < s.HeureFin)
            .ToListAsync();
        // Un seul message par cours en conflit (motif le plus pertinent).
        foreach (var s in seances)
        {
            string? raison = null;
            if (s.Groupe != null && s.Groupe.FiliereId == matiere.FiliereId && s.Groupe.NiveauId == matiere.NiveauId)
                raison = $"Les étudiants ({s.Groupe.Nom}) ont cours de {s.HeureDebut:HH\\:mm} à {s.HeureFin:HH\\:mm}.";
            else if (salleIds.Contains(s.SalleId))
                raison = $"Salle {s.Salle?.Nom} occupée par un cours de {s.HeureDebut:HH\\:mm} à {s.HeureFin:HH\\:mm}.";
            else if (s.EnseignantId == e.EnseignantId)
                raison = $"L'enseignant a un cours de {s.HeureDebut:HH\\:mm} à {s.HeureFin:HH\\:mm}.";
            if (raison != null) conflits.Add(new ConflitInfo("cours", raison, s.Id));
        }

        // Autres examens du même jour qui chevauchent (un seul message chacun).
        var examens = await db.Examens.Include(x => x.Matiere).Include(x => x.Salles)
            .Where(x => x.Date == e.Date && (exclureId == null || x.Id != exclureId)
                        && x.HeureDebut < e.HeureFin && e.HeureDebut < x.HeureFin)
            .ToListAsync();
        foreach (var x in examens)
        {
            string? raison = null;
            if (x.Matiere != null && x.Matiere.FiliereId == matiere.FiliereId && x.Matiere.NiveauId == matiere.NiveauId)
                raison = $"Ces étudiants ont déjà un examen de {x.HeureDebut:HH\\:mm} à {x.HeureFin:HH\\:mm}.";
            else if (x.Salles.Any(xs => salleIds.Contains(xs.SalleId)))
                raison = $"Salle déjà prise par un autre examen de {x.HeureDebut:HH\\:mm} à {x.HeureFin:HH\\:mm}.";
            else if (x.EnseignantId == e.EnseignantId)
                raison = $"L'enseignant surveille un examen de {x.HeureDebut:HH\\:mm} à {x.HeureFin:HH\\:mm}.";
            if (raison != null) conflits.Add(new ConflitInfo("examen", raison, x.Id));
        }

        // Déduplication des messages.
        return conflits.GroupBy(c => c.Message).Select(g => g.First()).ToList();
    }
}
