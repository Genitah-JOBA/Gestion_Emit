using EmitGestion.Api.Data;
using EmitGestion.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EmitGestion.Api.Services;

/// <summary>
/// Gestion automatique des années académiques. Une année scolaire démarre en septembre :
/// par exemple le 26/06/2026 appartient à l'année « 2025-2026 ».
/// </summary>
public static class AnneeAcademiqueHelper
{
    public static (int debut, int fin) Bornes(DateOnly d) =>
        d.Month >= 9 ? (d.Year, d.Year + 1) : (d.Year - 1, d.Year);

    public static string Libelle(DateOnly d)
    {
        var (a, b) = Bornes(d);
        return $"{a}-{b}";
    }

    /// <summary>Crée si besoin l'année couvrant la date donnée et garantit qu'une année est active.</summary>
    public static async Task<AnneeAcademique> AssurerAsync(AppDbContext db, DateOnly date)
    {
        var (a, b) = Bornes(date);
        var libelle = $"{a}-{b}";
        var annee = await db.AnneesAcademiques.FirstOrDefaultAsync(x => x.Libelle == libelle);
        if (annee is null)
        {
            annee = new AnneeAcademique
            {
                Libelle = libelle,
                DateDebut = new DateOnly(a, 9, 1),
                DateFin = new DateOnly(b, 7, 31),
                Active = false
            };
            db.AnneesAcademiques.Add(annee);
            await db.SaveChangesAsync();
        }
        return annee;
    }

    /// <summary>
    /// Année courante (couvrant aujourd'hui), créée si besoin et rendue active.
    /// L'année active suit toujours la date du jour (gestion automatique, non sélectionnable).
    /// </summary>
    public static async Task<AnneeAcademique> AssurerCouranteAsync(AppDbContext db)
    {
        var courante = await AssurerAsync(db, DateOnly.FromDateTime(DateTime.Today));
        if (!courante.Active)
        {
            await db.AnneesAcademiques.Where(a => a.Active && a.Id != courante.Id)
                .ExecuteUpdateAsync(s => s.SetProperty(a => a.Active, false));
            courante.Active = true;
            await db.SaveChangesAsync();
        }
        return courante;
    }

    /// <summary>Retourne l'année académique couvrant une date (par bornes), sinon l'active.</summary>
    public static async Task<AnneeAcademique?> PourDateAsync(AppDbContext db, DateOnly date)
    {
        var an = await db.AnneesAcademiques.FirstOrDefaultAsync(x => x.DateDebut <= date && date <= x.DateFin);
        return an ?? await db.AnneesAcademiques.FirstOrDefaultAsync(x => x.Active);
    }
}
