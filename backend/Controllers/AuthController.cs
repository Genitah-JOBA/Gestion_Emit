using System.Security.Claims;
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
public class AuthController(AppDbContext db, TokenService tokens) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest req)
    {
        var u = await db.Utilisateurs.FirstOrDefaultAsync(x => x.Login == req.Login);
        if (u is null || !u.Actif || !BCrypt.Net.BCrypt.Verify(req.MotDePasse, u.MotDePasseHash))
            return Unauthorized(new { message = "Identifiants invalides." });

        var token = tokens.GenererToken(u);
        return new LoginResponse(token, ToInfo(u));
    }

    [Authorize]
    [HttpGet("moi")]
    public async Task<ActionResult<UtilisateurInfo>> Moi()
    {
        var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var u = await db.Utilisateurs.FindAsync(id);
        return u is null ? NotFound() : ToInfo(u);
    }

    // ---------- Gestion des comptes (Admin uniquement) ----------

    [Authorize(Roles = Roles.Admin)]
    [HttpGet("utilisateurs")]
    public async Task<ActionResult<IEnumerable<UtilisateurInfo>>> Liste()
        => await db.Utilisateurs.OrderBy(u => u.Login)
            .Select(u => new UtilisateurInfo(u.Id, u.Login, u.NomComplet, u.Role.ToString(), u.EnseignantId))
            .ToListAsync();

    [Authorize(Roles = Roles.Admin)]
    [HttpPost("utilisateurs")]
    public async Task<ActionResult<UtilisateurInfo>> Creer([FromBody] CreateUtilisateurRequest req)
    {
        if (await db.Utilisateurs.AnyAsync(u => u.Login == req.Login))
            return Conflict(new { message = "Ce login est déjà utilisé." });

        var u = new Utilisateur
        {
            Login = req.Login.Trim(),
            NomComplet = req.NomComplet,
            MotDePasseHash = BCrypt.Net.BCrypt.HashPassword(req.MotDePasse),
            Role = req.Role,
            EnseignantId = req.Role == RoleUtilisateur.Enseignant ? req.EnseignantId : null
        };
        db.Utilisateurs.Add(u);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(Liste), ToInfo(u));
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPut("utilisateurs/{id:int}")]
    public async Task<ActionResult<UtilisateurInfo>> Modifier(int id, [FromBody] UpdateUtilisateurRequest req)
    {
        var u = await db.Utilisateurs.FindAsync(id);
        if (u is null) return NotFound();

        u.NomComplet = req.NomComplet;
        u.Role = req.Role;
        u.Actif = req.Actif;
        u.EnseignantId = req.Role == RoleUtilisateur.Enseignant ? req.EnseignantId : null;
        if (!string.IsNullOrWhiteSpace(req.NouveauMotDePasse))
            u.MotDePasseHash = BCrypt.Net.BCrypt.HashPassword(req.NouveauMotDePasse);

        await db.SaveChangesAsync();
        return ToInfo(u);
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpDelete("utilisateurs/{id:int}")]
    public async Task<IActionResult> Supprimer(int id)
    {
        var u = await db.Utilisateurs.FindAsync(id);
        if (u is null) return NotFound();
        if (u.Login == "admin") return BadRequest(new { message = "Le compte administrateur principal ne peut pas être supprimé." });
        db.Utilisateurs.Remove(u);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static UtilisateurInfo ToInfo(Utilisateur u)
        => new(u.Id, u.Login, u.NomComplet, u.Role.ToString(), u.EnseignantId);
}
