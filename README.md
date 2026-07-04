# EMIT — Gestion des salles, emplois du temps et disponibilités

Application web de gestion pédagogique pour l'**École de Management et d'Innovation Technologique (EMIT)** :
gestion des filières, niveaux, parcours, matières, étudiants, enseignants, groupes, salles, **emplois du temps
avec détection automatique des conflits** et **disponibilités des enseignants**.

- **Backend** : ASP.NET Core Web API (.NET 10) + Entity Framework Core + PostgreSQL — architecture en couches (Models / Data / Services / Controllers).
- **Frontend** : React (Vite) — interface élégante, moderne et responsive, sans dégradés.
- **Authentification** : JWT, avec trois rôles — **Admin**, **Secrétariat**, **Enseignant**.

---

## 1. Fonctionnalités

### Conformes au cahier des charges
- **Structures pédagogiques** : filières, niveaux, parcours, matières (liées à une filière + niveau).
- **Acteurs** : étudiants (inscrits par filière), enseignants, groupes.
- **Locaux** : salles (amphi, TD, TP, labo) et bâtiments.
- **Emploi du temps** : création/modification des séances ; visualisation **par groupe, par enseignant ou par salle** ; **détection des conflits** (salle occupée, enseignant occupé, groupe occupé).
- **Recherche** des étudiants par filière / niveau, consultation des matières d'une filière.
- **Authentification par rôles** (Admin, Secrétariat, Enseignant).
- Base **PostgreSQL**, normalisation 3NF, **gestion des années académiques**, exécution **100 % locale**.

### Améliorations ajoutées
- **Disponibilités des enseignants** (présent dans le titre du projet mais absent du cahier des charges) : créneaux hebdomadaires récurrents, **pris en compte lors de la planification** (une séance hors créneau ou sur une indisponibilité déclenche un avertissement de conflit).
- **Détection de conflits enrichie** : en plus de la salle, de l'enseignant et du groupe, l'application vérifie la disponibilité de l'enseignant et la cohérence des horaires. Possibilité de **forcer** un enregistrement en connaissance de cause.
- **Année académique** modélisée comme une entité dédiée, avec une **année active** unique.
- **Tableau de bord** avec statistiques et répartition des étudiants par filière et par niveau.
- **Espace enseignant** : « Mon emploi du temps » filtré sur le compte connecté.
- **Documentation API interactive** via Swagger.

---

## 2. Prérequis

Installez ces outils (versions testées entre parenthèses) :

| Outil | Version conseillée | Vérifier avec |
|-------|--------------------|---------------|
| [.NET SDK](https://dotnet.microsoft.com/download) | 10.x (≥ 8.0 fonctionne) | `dotnet --version` |
| [Node.js](https://nodejs.org/) (npm inclus) | 20.x ou plus récent | `node --version` |
| [PostgreSQL](https://www.postgresql.org/download/) | 16, 17 ou 18 | service `postgresql-*` démarré |
| [Visual Studio Code](https://code.visualstudio.com/) | — | — |

> PostgreSQL doit être **démarré** et vous devez connaître le **mot de passe** d'un utilisateur (par défaut `postgres`).

### Extensions VS Code recommandées
- **C# Dev Kit** (`ms-dotnettools.csdevkit`) — backend .NET.
- **ESLint** (`dbaeumer.vscode-eslint`) — frontend React.

---

## 3. Configuration de la base de données

L'application **crée automatiquement** la base `emit_gestion`, applique les migrations et insère des
données de démonstration au premier démarrage. Vous n'avez donc **rien à créer manuellement** dans PostgreSQL.

Il suffit de renseigner vos identifiants PostgreSQL dans **`backend/appsettings.json`** :

```jsonc
"ConnectionStrings": {
  "Default": "Host=localhost;Port=5432;Database=emit_gestion;Username=postgres;Password=CHANGEZ_MOI"
}
```

➡️ **Remplacez `CHANGEZ_MOI` par le mot de passe de votre utilisateur PostgreSQL.**
Adaptez aussi `Username`, `Port` ou `Host` si nécessaire.

> Si le mot de passe est incorrect, l'API démarre quand même mais affiche un message d'erreur explicite
> dans la console (« ÉCHEC DE LA CONNEXION À POSTGRESQL »).

---

## 4. Lancement du projet

Ouvrez le dossier `D:\Gestion Emit` dans VS Code, puis ouvrez **deux terminaux** (menu *Terminal → Nouveau terminal*).

### Terminal 1 — Backend (API)

```powershell
cd backend
dotnet restore        # une seule fois
dotnet run
```

L'API démarre sur **http://localhost:5043**.
Documentation interactive : **http://localhost:5043/swagger**

### Terminal 2 — Frontend (React)

```powershell
cd frontend
npm install           # une seule fois
npm run dev
```

L'interface démarre sur **http://localhost:5173** — ouvrez cette adresse dans votre navigateur.

> L'ordre conseillé : démarrer d'abord le backend, puis le frontend.

---

## 5. Comptes de démonstration

Créés automatiquement au premier lancement :

| Rôle | Identifiant | Mot de passe | Accès |
|------|-------------|--------------|-------|
| Administrateur | `admin` | `admin123` | Tous les droits, gestion des utilisateurs |
| Secrétariat | `secretariat` | `secret123` | Gestion des données et des emplois du temps |
| Enseignant | *(à créer par l'admin, lié à une fiche enseignant)* | — | Consultation de son emploi du temps |

> Pour tester le rôle **Enseignant** : connectez-vous en `admin`, allez dans **Utilisateurs**,
> créez un compte de rôle *Enseignant* et liez-le à une fiche enseignant existante.

---

## 6. Structure du projet

```
Gestion Emit/
├── backend/                      # API ASP.NET Core (.NET 10)
│   ├── Models/                   # Entités du domaine (MLD)
│   ├── Data/                     # DbContext + initialisation/seed
│   ├── Services/                 # Logique métier (JWT, conflits d'EDT)
│   ├── Controllers/              # Points d'entrée REST (CRUD générique + spécifiques)
│   ├── DTOs/                     # Objets de transfert (auth, conflits, stats)
│   ├── Migrations/               # Migrations EF Core
│   └── appsettings.json          # ⚙️ Chaîne de connexion + clé JWT
│
└── frontend/                     # Application React (Vite)
    └── src/
        ├── api/                  # Client Axios + intercepteurs JWT
        ├── auth/                 # Contexte d'authentification
        ├── components/           # Layout, modale, table CRUD générique…
        ├── lib/                  # Icônes, notifications (toasts)
        └── pages/                # Écrans (dashboard, EDT, ressources…)
```

---

## 7. Aperçu de l'API

| Domaine | Endpoints (préfixe `/api`) |
|---------|----------------------------|
| Authentification | `POST /auth/login`, `GET /auth/moi`, `…/auth/utilisateurs` (Admin) |
| Structures | `/filieres`, `/niveaux`, `/parcours`, `/matieres` |
| Acteurs | `/etudiants`, `/enseignants`, `/groupes` |
| Locaux | `/salles`, `/batiments` |
| Planification | `/seances` (+ `?groupeId/enseignantId/salleId/du/au`), `/seances/verifier`, `/seances/mon-edt`, `/disponibilites` |
| Années | `/anneesacademiques`, `POST /anneesacademiques/{id}/activer` |
| Tableau de bord | `/dashboard/stats` |

Les lectures sont accessibles à tout utilisateur connecté ; les **écritures** sont réservées aux rôles
**Admin** et **Secrétariat**. La gestion des comptes est réservée à l'**Admin**.

---

## 8. Dépannage

| Problème | Solution |
|----------|----------|
| `password authentication failed` | Mot de passe PostgreSQL incorrect dans `backend/appsettings.json`. |
| `Npgsql … connection refused` | Le service PostgreSQL n'est pas démarré. |
| Le frontend affiche une erreur réseau | Vérifiez que le backend tourne sur le port 5043 (sinon ajustez `VITE_API_URL`, voir `frontend/.env.example`). |
| Port 5043 déjà utilisé | Modifiez `applicationUrl` dans `backend/Properties/launchSettings.json` **et** `VITE_API_URL`. |
| Réinitialiser les données | Supprimez la base `emit_gestion` dans PostgreSQL puis relancez le backend. |

---

## 9. Notes techniques

- **Sécurité** : mots de passe hachés avec BCrypt, jetons JWT signés (clé dans `appsettings.json`,
  à modifier pour un usage réel).
- **Migrations** : appliquées automatiquement au démarrage (`Database.Migrate()`).
  Pour en créer une nouvelle : `cd backend && dotnet ef migrations add NomDeLaMigration`.
- **Tout est local** : aucune dépendance à un service externe.
