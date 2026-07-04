using EmitGestion.Api.Data;
using EmitGestion.Api.Models;
using EmitGestion.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmitGestion.Api.Controllers;

public class AnneesAcademiquesController(AppDbContext db) : CrudController<AnneeAcademique>(db)
{
    protected override IQueryable<AnneeAcademique> Query() => Db.AnneesAcademiques.OrderByDescending(a => a.Libelle);

    protected override void Map(AnneeAcademique c, AnneeAcademique s)
    {
        c.Libelle = s.Libelle;
        c.DateDebut = s.DateDebut;
        c.DateFin = s.DateFin;
        // L'activation se fait via l'endpoint dédié pour garantir l'unicité.
    }

    protected override void OnCreate(AnneeAcademique e)
    {
        if (!Db.AnneesAcademiques.Any()) e.Active = true;
        else e.Active = false;
    }

    protected override Task ValidateAsync(AnneeAcademique e, bool modification)
    {
        if (e.DateFin <= e.DateDebut)
            throw new ValidationException("La date de fin doit être postérieure à la date de début.");
        var mois = (e.DateFin.Year - e.DateDebut.Year) * 12 + (e.DateFin.Month - e.DateDebut.Month);
        if (mois < 9) throw new ValidationException("Une année académique doit durer au moins 9 mois.");
        if (mois > 24) throw new ValidationException("Une année académique ne peut pas dépasser 24 mois.");
        return Task.CompletedTask;
    }

    /// <summary>Année académique courante (créée/activée automatiquement selon la date du jour).</summary>
    [HttpGet("courante")]
    public async Task<ActionResult<AnneeAcademique>> Courante()
        => await AnneeAcademiqueHelper.AssurerCouranteAsync(Db);

    /// <summary>Définit l'année académique active (désactive toutes les autres).</summary>
    [HttpPost("{id:int}/activer")]
    [Authorize(Roles = Roles.Gestion)]
    public async Task<IActionResult> Activer(int id)
    {
        var annee = await Db.AnneesAcademiques.FindAsync(id);
        if (annee is null) return NotFound();

        await Db.AnneesAcademiques.Where(a => a.Active).ExecuteUpdateAsync(s => s.SetProperty(a => a.Active, false));
        annee.Active = true;
        await Db.SaveChangesAsync();
        return Ok(annee);
    }
}
