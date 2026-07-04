using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EmitGestion.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace EmitGestion.Api.Services;

public class JwtOptions
{
    public string Cle { get; set; } = string.Empty;
    public string Emetteur { get; set; } = "EmitGestion";
    public string Audience { get; set; } = "EmitGestion";
    public int DureeHeures { get; set; } = 12;
}

public class TokenService
{
    private readonly JwtOptions _opt;

    public TokenService(IConfiguration config)
    {
        _opt = config.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
        if (string.IsNullOrWhiteSpace(_opt.Cle))
            _opt.Cle = "CLE_DEV_PAR_DEFAUT_A_CHANGER_EN_PRODUCTION_0123456789";
    }

    public string GenererToken(Utilisateur u)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, u.Id.ToString()),
            new(ClaimTypes.NameIdentifier, u.Id.ToString()),
            new(ClaimTypes.Name, u.Login),
            new("nomComplet", u.NomComplet),
            new(ClaimTypes.Role, u.Role.ToString()),
        };
        if (u.EnseignantId.HasValue)
            claims.Add(new Claim("enseignantId", u.EnseignantId.Value.ToString()));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opt.Cle));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _opt.Emetteur,
            audience: _opt.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(_opt.DureeHeures),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public JwtOptions Options => _opt;
}
