using System.Text;
using System.Text.Json.Serialization;
using EmitGestion.Api.Controllers;
using EmitGestion.Api.Data;
using EmitGestion.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// ---------- Base de données ----------
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

// ---------- Services applicatifs ----------
builder.Services.AddSingleton<TokenService>();
builder.Services.AddScoped<SeanceService>();
builder.Services.AddScoped<PlanificateurService>();

// ---------- Contrôleurs + JSON ----------
builder.Services.AddControllers().AddJsonOptions(o =>
{
    // Enums sérialisés en texte (Actif, Amphi, Cours...) plutôt qu'en nombre.
    o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    o.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});

// ---------- Authentification JWT ----------
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
if (string.IsNullOrWhiteSpace(jwt.Cle))
    jwt.Cle = "CLE_DEV_PAR_DEFAUT_A_CHANGER_EN_PRODUCTION_0123456789";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Emetteur,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Cle))
        };
    });
builder.Services.AddAuthorization();

// ---------- CORS (frontend React en local) ----------
const string CorsPolicy = "FrontendLocal";
builder.Services.AddCors(o => o.AddPolicy(CorsPolicy, p => p
    .WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
    .AllowAnyHeader()
    .AllowAnyMethod()));

// ---------- Swagger ----------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "EMIT - Gestion des études", Version = "v1" });
    var scheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Saisir le token JWT (sans le préfixe 'Bearer ')."
    };
    c.AddSecurityDefinition("Bearer", scheme);
    c.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer")] = new List<string>()
    });
});

var app = builder.Build();

// ---------- Gestion centralisée des erreurs ----------
app.UseExceptionHandler(handler => handler.Run(async context =>
{
    var feature = context.Features.Get<IExceptionHandlerFeature>();
    if (feature?.Error is ValidationException validation)
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        await context.Response.WriteAsJsonAsync(new { message = validation.Message });
    }
    else if (feature?.Error is ConflitException conflit)
    {
        context.Response.StatusCode = StatusCodes.Status409Conflict;
        await context.Response.WriteAsJsonAsync(new { message = conflit.Message });
    }
    else
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await context.Response.WriteAsJsonAsync(new { message = "Une erreur interne est survenue." });
    }
}));

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "EMIT API v1"));
}

// Sert l'interface web (build React placé dans wwwroot) sur la même origine que l'API.
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors(CorsPolicy);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Toute route non-API renvoie l'application React (routage côté client : /login, /dashboard, ...).
app.MapFallbackToFile("index.html");

// ---------- Migration + données de démonstration ----------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        await DbSeeder.SeedAsync(db);
        app.Logger.LogInformation("Base de données prête. Comptes : admin/admin123 et secretariat/secret123.");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(
            "\n========================================================================\n" +
            "ÉCHEC DE LA CONNEXION À POSTGRESQL.\n" +
            "Vérifiez la chaîne de connexion 'ConnectionStrings:Default' dans\n" +
            "backend/appsettings.json (hôte, port, base, utilisateur, MOT DE PASSE).\n" +
            "Détail : {Message}\n" +
            "========================================================================", ex.Message);
    }
}

app.Run();
