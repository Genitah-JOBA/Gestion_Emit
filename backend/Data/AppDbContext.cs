using EmitGestion.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EmitGestion.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Filiere> Filieres => Set<Filiere>();
    public DbSet<Niveau> Niveaux => Set<Niveau>();
    public DbSet<Parcours> Parcours => Set<Parcours>();
    public DbSet<Matiere> Matieres => Set<Matiere>();
    public DbSet<Batiment> Batiments => Set<Batiment>();
    public DbSet<Salle> Salles => Set<Salle>();
    public DbSet<Enseignant> Enseignants => Set<Enseignant>();
    public DbSet<Groupe> Groupes => Set<Groupe>();
    public DbSet<Etudiant> Etudiants => Set<Etudiant>();
    public DbSet<AnneeAcademique> AnneesAcademiques => Set<AnneeAcademique>();
    public DbSet<Seance> Seances => Set<Seance>();
    public DbSet<DisponibiliteEnseignant> Disponibilites => Set<DisponibiliteEnseignant>();
    public DbSet<Utilisateur> Utilisateurs => Set<Utilisateur>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        // Contraintes d'unicité
        b.Entity<Filiere>().HasIndex(f => f.CodeFiliere).IsUnique();
        b.Entity<Filiere>().HasIndex(f => f.LettreSpecifique).IsUnique();
        b.Entity<Matiere>().HasIndex(m => m.CodeMatiere).IsUnique();
        b.Entity<Etudiant>().HasIndex(e => e.Matricule).IsUnique();
        b.Entity<Utilisateur>().HasIndex(u => u.Login).IsUnique();
        b.Entity<AnneeAcademique>().HasIndex(a => a.Libelle).IsUnique();

        // Relation plusieurs-à-plusieurs Parcours <-> Niveau (table de jointure ParcoursNiveaux).
        b.Entity<Parcours>()
            .HasMany(p => p.Niveaux)
            .WithMany(n => n.Parcours)
            .UsingEntity(j => j.ToTable("ParcoursNiveaux"));

        // Relation plusieurs-à-plusieurs Enseignant <-> Matiere (table de jointure EnseignantMatieres).
        b.Entity<Enseignant>()
            .HasMany(e => e.Matieres)
            .WithMany(m => m.Enseignants)
            .UsingEntity(j => j.ToTable("EnseignantMatieres"));

        // On évite les suppressions en cascade destructrices : restriction par défaut.
        foreach (var fk in b.Model.GetEntityTypes().SelectMany(t => t.GetForeignKeys()))
        {
            if (fk.DeleteBehavior == DeleteBehavior.Cascade)
                fk.DeleteBehavior = DeleteBehavior.Restrict;
        }

        // Un compte enseignant supprimé ne supprime pas la fiche enseignant.
        b.Entity<Utilisateur>()
            .HasOne(u => u.Enseignant)
            .WithMany()
            .HasForeignKey(u => u.EnseignantId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
