namespace EmitGestion.Api.Models;

public enum Sexe { Masculin, Feminin }

/// <summary>Statut de l'étudiant. « Passant » est le statut par défaut.</summary>
public enum StatutEtudiant { Passant, Redoublant, Suspendu, Renvoi }

/// <summary>Types de salles de l'EMIT.</summary>
public enum TypeSalle { Bureau, Amphitheatre, SalleDeClasse, SalleDeReunion, Studio, SalleDeSoutenance }

public enum TypeSeance { Cours, TD, TP }

/// <summary>Grades enseignants (Docteur ajouté).</summary>
public enum GradeEnseignant { Vacataire, Assistant, MaitreAssistant, MaitreDeConferences, Professeur, Docteur }

public enum RoleUtilisateur { Admin, Secretariat, Enseignant }

/// <summary>Jour de la semaine (1 = Lundi ... 6 = Samedi). Le dimanche n'est pas utilisé.</summary>
public enum JourSemaine { Lundi = 1, Mardi = 2, Mercredi = 3, Jeudi = 4, Vendredi = 5, Samedi = 6 }
