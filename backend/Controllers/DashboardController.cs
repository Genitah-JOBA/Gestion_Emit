using EmitGestion.Api.Data;
using EmitGestion.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmitGestion.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController(AppDbContext db) : ControllerBase
{
    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStats>> Stats()
    {
        var anneeActive = await db.AnneesAcademiques.FirstOrDefaultAsync(a => a.Active);

        // On projette dans un type anonyme (traduisible en SQL) puis on convertit en RepartitionItem côté client.
        var parFiliere = (await db.Etudiants
            .GroupBy(e => e.Filiere!.Nom)
            .Select(g => new { Libelle = g.Key, Total = g.Count() })
            .OrderByDescending(x => x.Total)
            .ToListAsync())
            .Select(x => new RepartitionItem(x.Libelle, x.Total))
            .ToList();

        var parNiveau = (await db.Etudiants
            .GroupBy(e => e.Niveau!.Nom)
            .Select(g => new { Libelle = g.Key, Total = g.Count() })
            .ToListAsync())
            .Select(x => new RepartitionItem(x.Libelle, x.Total))
            .ToList();

        return new DashboardStats(
            NbFilieres: await db.Filieres.CountAsync(),
            NbEtudiants: await db.Etudiants.CountAsync(),
            NbEnseignants: await db.Enseignants.CountAsync(),
            NbSalles: await db.Salles.CountAsync(),
            NbMatieres: await db.Matieres.CountAsync(),
            NbGroupes: await db.Groupes.CountAsync(),
            NbSeances: await db.Seances.CountAsync(),
            AnneeActive: anneeActive?.Libelle,
            EtudiantsParFiliere: parFiliere,
            EtudiantsParNiveau: parNiveau);
    }
}
