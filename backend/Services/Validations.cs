using System.Text.RegularExpressions;
using EmitGestion.Api.Models;

namespace EmitGestion.Api.Services;

/// <summary>Règles de validation propres au contexte malgache (téléphone, CIN, matricule, email).</summary>
public static partial class Validations
{
    // Préfixes mobiles malgaches autorisés.
    public static readonly string[] PrefixesTelephone = { "032", "033", "034", "037", "038" };

    [GeneratedRegex(@"^\d{10}$")] private static partial Regex DixChiffres();
    [GeneratedRegex(@"^\d{3}[A-Z]\d{2}$")] private static partial Regex FormatMatricule();
    [GeneratedRegex(@"^\d{12}$")] private static partial Regex FormatCin();

    /// <summary>Téléphone : exactement 10 chiffres, préfixe malgache valide.</summary>
    public static bool TelephoneValide(string? tel)
    {
        if (string.IsNullOrWhiteSpace(tel)) return false;
        return DixChiffres().IsMatch(tel) && PrefixesTelephone.Any(p => tel.StartsWith(p));
    }

    /// <summary>Email : contient « @ » et « . » et structure de base valide.</summary>
    public static bool EmailValide(string? email)
    {
        if (string.IsNullOrWhiteSpace(email)) return false;
        return email.Contains('@') && email.Contains('.')
            && Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$");
    }

    /// <summary>CIN malgache : 12 chiffres. Le 6e chiffre code le genre (1 = Masculin, 2 = Féminin).</summary>
    public static bool CinValide(string? cin) => !string.IsNullOrWhiteSpace(cin) && FormatCin().IsMatch(cin);

    /// <summary>Genre déduit du 6e chiffre du CIN (1 = Masculin, 2 = Féminin), sinon null.</summary>
    public static Sexe? GenreDepuisCin(string? cin)
    {
        if (!CinValide(cin)) return null;
        return cin![5] switch { '1' => Sexe.Masculin, '2' => Sexe.Feminin, _ => null };
    }

    /// <summary>Matricule : 3 chiffres + lettre spécifique de la filière + 2 derniers chiffres de l'année. Ex : 130I24.</summary>
    public static bool MatriculeFormatValide(string? matricule) =>
        !string.IsNullOrWhiteSpace(matricule) && FormatMatricule().IsMatch(matricule);

    /// <summary>Âge (en années révolues) à une date donnée.</summary>
    public static int AgeA(DateOnly naissance, DateOnly reference)
    {
        var age = reference.Year - naissance.Year;
        if (naissance > reference.AddYears(-age)) age--;
        return age;
    }
}
