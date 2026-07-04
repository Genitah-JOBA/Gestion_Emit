using EmitGestion.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmitGestion.Api.Controllers;

/// <summary>Rôles autorisés à modifier les données de gestion.</summary>
public static class Roles
{
    public const string Admin = "Admin";
    public const string Gestion = "Admin,Secretariat"; // création / modification / suppression
}

/// <summary>
/// Contrôleur CRUD générique. Les lectures sont ouvertes à tout utilisateur
/// authentifié ; les écritures sont réservées aux rôles Admin et Secrétariat.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public abstract class CrudController<T> : ControllerBase where T : class, new()
{
    protected readonly AppDbContext Db;
    protected CrudController(AppDbContext db) => Db = db;

    /// <summary>Requête de base (à surcharger pour inclure les entités liées).</summary>
    protected virtual IQueryable<T> Query() => Db.Set<T>();

    /// <summary>Copie les champs modifiables de <paramref name="source"/> vers <paramref name="cible"/>.</summary>
    protected abstract void Map(T cible, T source);

    /// <summary>Hook appelé juste avant la création.</summary>
    protected virtual void OnCreate(T entite) { }

    /// <summary>Validation métier avant enregistrement (lève ValidationException si invalide).</summary>
    protected virtual Task ValidateAsync(T entite, bool modification) => Task.CompletedTask;

    private static int IdOf(T e) => (int)typeof(T).GetProperty("Id")!.GetValue(e)!;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<T>>> GetAll() => await Query().AsNoTracking().ToListAsync();

    [HttpGet("{id:int}")]
    public async Task<ActionResult<T>> GetById(int id)
    {
        var e = await Query().AsNoTracking().FirstOrDefaultAsync(x => EF.Property<int>(x, "Id") == id);
        return e is null ? NotFound() : e;
    }

    [HttpPost]
    [Authorize(Roles = Roles.Gestion)]
    public async Task<ActionResult<T>> Create([FromBody] T input)
    {
        var entite = new T();
        Map(entite, input);
        OnCreate(entite);
        await ValidateAsync(entite, false);
        Db.Add(entite);
        await SaveAsync();

        var cree = await Query().AsNoTracking().FirstOrDefaultAsync(x => EF.Property<int>(x, "Id") == IdOf(entite));
        return CreatedAtAction(nameof(GetById), new { id = IdOf(entite) }, cree);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.Gestion)]
    public async Task<ActionResult<T>> Update(int id, [FromBody] T input)
    {
        var existant = await Db.Set<T>().FirstOrDefaultAsync(x => EF.Property<int>(x, "Id") == id);
        if (existant is null) return NotFound();

        Map(existant, input);
        await ValidateAsync(existant, true);
        await SaveAsync();

        var maj = await Query().AsNoTracking().FirstOrDefaultAsync(x => EF.Property<int>(x, "Id") == id);
        return Ok(maj);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.Gestion)]
    public virtual async Task<IActionResult> Delete(int id)
    {
        var existant = await Db.Set<T>().FirstOrDefaultAsync(x => EF.Property<int>(x, "Id") == id);
        if (existant is null) return NotFound();

        Db.Remove(existant);
        try
        {
            await Db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new { message = "Suppression impossible : cet élément est utilisé par d'autres données." });
        }
        return NoContent();
    }

    /// <summary>Sauvegarde en convertissant les violations d'unicité en erreur 409.</summary>
    protected async Task SaveAsync()
    {
        try
        {
            await Db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("duplicate", StringComparison.OrdinalIgnoreCase) == true
                                           || ex.InnerException?.Message.Contains("unique", StringComparison.OrdinalIgnoreCase) == true)
        {
            throw new ConflitException("Un enregistrement avec une valeur unique identique existe déjà (code, matricule ou libellé).");
        }
    }
}

public class ConflitException(string message) : Exception(message);

/// <summary>Erreur de validation métier -> renvoyée en 400 (Bad Request).</summary>
public class ValidationException(string message) : Exception(message);
