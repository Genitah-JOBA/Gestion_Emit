# Cadence — Le bon rythme des cours, sans conflit

Application web de gestion pédagogique et de **planification des emplois du temps** — *le bon rythme des cours, sans conflits* — destinée à l'administration, au secrétariat et aux enseignants de l'**EMIT** (École de Management et d'Innovation Technologique).

## Aperçu

Cadence centralise la gestion des structures pédagogiques (filières, niveaux, parcours, matières), des acteurs (étudiants, enseignants, groupes) et des locaux (salles, bâtiments). Son cœur est la **planification** : emplois du temps et **examens**, avec **détection automatique des conflits**, prise en compte des **disponibilités des enseignants**, **génération automatique par algorithme d'optimisation**, et **impression au format institutionnel** (emploi du temps et avis d'examen). Chaque enseignant dispose d'un espace pour consulter son propre emploi du temps.

---

## Fonctionnalités

### Espace Administration & Secrétariat
- **Tableau de bord** animé : effectifs et répartition des étudiants par filière et par niveau.
- **Structures pédagogiques** : filières, niveaux, **parcours multi-niveaux**, matières (par filière + niveau).
- **Acteurs** : étudiants (**rattachés à un groupe**), enseignants (avec leurs **matières enseignées**), groupes à **nom auto-généré** (niveau + code + acronyme du parcours + division A/B).
- **Locaux** : salles (**numéro unique par bâtiment**, capacité, type) et bâtiments.
- **Emploi du temps** : séances récurrentes ; vues **par groupe, enseignant ou salle** ; **enseignant filtré par matière**, **salle proposée automatiquement** (libre + assez grande pour l'effectif).
- **Détection des conflits** (salle, enseignant, groupe/étudiants, disponibilité, horaires) — messages consolidés, possibilité de forcer.
- **Génération automatique** d'un emploi du temps par optimisation sous contraintes (revue avant application).
- **Disponibilités des enseignants** : créneaux hebdomadaires avec **période de validité optionnelle** (ex. un cours de 3 semaines).
- **Examens** : planification (session **Normale / Rattrapage**, **salles multiples + surveillants**), règle « pas de cours et d'examen au même créneau », **archivage**, et **avis imprimable par niveau**.
- **Impression / export PDF** : emploi du temps (matrice horaires × jours) et avis d'examen (format institutionnel).
- **Contrôle des doublons** et recherche « sous tous les angles » sur toutes les listes.
- **Administration** : années académiques et comptes utilisateurs (réservé à l'Admin).

### Espace Enseignant
- « Mon emploi du temps » filtré automatiquement sur le compte connecté, consultation par semaine, avec impression.
- « Mes matières » : les unités d'enseignement attribuées à l'enseignant connecté, regroupées par niveau.

### Fonctionnalités communes
- Authentification sécurisée par **JWT** (mots de passe hachés BCrypt).
- Interface moderne et **animée** (Framer Motion), responsive.
- Documentation API interactive via **Swagger**.
- Fonctionnement **100 % local**.

---

## Architecture

Backend **ASP.NET Core (.NET 10)** en couches + frontend **React (Vite)**.

```
backend/
├── Models/          # Entités (Filiere, Matiere, Seance, Examen, Enseignant…)
├── Data/            # DbContext EF Core + seed
├── Services/        # SeanceService (conflits), PlanificateurService (optimisation),
│                    #   TokenService (JWT), Validations, AnneeAcademiqueHelper
├── Controllers/     # CrudController générique + Seances/Examens/Auth…
├── DTOs/            # Auth, conflits, génération, examens, stats
├── Migrations/      # Migrations EF Core
└── appsettings.json # Chaîne de connexion + clé JWT

frontend/src/
├── api/         # Client Axios + intercepteurs JWT
├── auth/        # Contexte d'authentification
├── components/  # Layout, modales, CrudResource générique (pills + recherche)
├── lib/         # Icônes, toasts
└── pages/       # dashboard, emploi du temps, examens, disponibilités, ressources…
```

**Gestion d'état** : React Context API + hooks. **Persistance** : PostgreSQL via EF Core (migrations appliquées au démarrage).

---

## Filières et niveaux

| Filières | Niveaux |
|----------|---------|
| Informatique | L1 |
| Management   | L2 |
| Communication| L3 |
|              | M1 / M2 |

> Filières, niveaux et parcours sont entièrement gérables depuis l'interface.

---

## Prérequis

- [.NET SDK](https://dotnet.microsoft.com/download) ≥ 10.0
- [Node.js](https://nodejs.org/) ≥ 20
- [PostgreSQL](https://www.postgresql.org/download/) 16/17/18 (service démarré)
- Un navigateur récent — (recommandé) VS Code + C# Dev Kit + ESLint

---

## Installation

```bash
git clone <url-du-repo>
cd "Gestion Emit"
cd backend && dotnet restore
cd ../frontend && npm install
```

## Configuration

Dans `backend/appsettings.json` :

```jsonc
"ConnectionStrings": {
  "Default": "Host=localhost;Port=5432;Database=emit_gestion;Username=postgres;Password=CHANGEZ_MOI"
}
```

## Lancement

**Développement** (deux terminaux) :
```bash
cd backend  && dotnet run     # API + Swagger : http://localhost:5043
cd frontend && npm run dev     # Interface : http://localhost:5173
```

**Un clic** : le dossier `app/` contient la version publiée ; double-cliquez sur **`Lancer-EMIT.bat`** (tout sur http://localhost:5043).

---

## Comptes de démonstration

| Rôle | Identifiant | Mot de passe |
|------|-------------|--------------|
| Administrateur | `admin` | `admin123` |
| Secrétariat | `secretariat` | `secret123` |
| Enseignant | *(créé par l'admin)* | — |

---

## Structure des pages

| Page | Route | Description |
|------|-------|-------------|
| Connexion | `/login` | Authentification |
| Tableau de bord | `/dashboard` | Statistiques et répartitions |
| Mon emploi du temps | `/mon-edt` | EDT de l'enseignant connecté |
| Mes matières | `/mes-matieres` | Matières attribuées à l'enseignant connecté |
| Filières / Niveaux / Parcours / Matières | `/filieres` … | Structures pédagogiques |
| Étudiants / Enseignants / Groupes | `/etudiants` … | Acteurs |
| Salles / Bâtiments | `/salles`, `/batiments` | Locaux |
| Emploi du temps | `/emploi-du-temps` | Planification, génération auto, impression |
| **Examens** | `/examens` | Planification des examens + avis imprimable + archive |
| Disponibilités | `/disponibilites` | Créneaux hebdomadaires (avec période) |
| Années académiques | `/annees` | Gestion des années (Admin / Secrétariat) |
| Utilisateurs | `/utilisateurs` | Comptes et rôles (Admin) |

---

## Base de données (PostgreSQL / EF Core)

| Table | Description |
|-------|-------------|
| `Utilisateurs` | Comptes (Admin, Secrétariat, Enseignant) |
| `Filieres`, `Niveaux` | Filières et niveaux |
| `Parcours`, `ParcoursNiveaux` | Parcours et association Parcours ↔ Niveaux (N:N) |
| `Matieres` | Matières (filière + niveau + parcours) |
| `Enseignants`, `EnseignantMatieres` | Enseignants et association Enseignant ↔ Matières (N:N) |
| `Etudiants` | Étudiants (filière, niveau, parcours, groupe) |
| `Groupes` | Groupes / classes |
| `Batiments`, `Salles` | Locaux (salle = numéro unique par bâtiment) |
| `Seances` | Séances de l'emploi du temps |
| `Examens`, `ExamenSalles` | Examens et leurs salles + surveillants |
| `Disponibilites` | Créneaux de disponibilité des enseignants (période optionnelle) |
| `AnneesAcademiques` | Années académiques (une seule active) |

---

## Notes

- **Sécurité** : mots de passe hachés BCrypt, JWT signés (clé dans `appsettings.json`).
- **Migrations** : appliquées au démarrage ; nouvelle migration → `cd backend && dotnet ef migrations add NomMigration`.
- **Impression** : activez « Graphismes d'arrière-plan » dans la boîte d'impression pour les couleurs.
