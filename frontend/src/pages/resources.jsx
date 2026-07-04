import CrudResource, { capitaliserMots } from '../components/CrudResource';
import { Tag } from '../components/ui';

// ---------- Listes de valeurs ----------
const opt = (arr) => arr.map((v) => ({ value: v, label: v }));
const SEXE = opt(['Masculin', 'Feminin']);
const STATUT = opt(['Passant', 'Redoublant', 'Suspendu', 'Renvoi']);
const TYPE_SALLE = [
  { value: 'Bureau', label: 'Bureau' },
  { value: 'Amphitheatre', label: 'Amphithéâtre' },
  { value: 'SalleDeClasse', label: 'Salle de classe' },
  { value: 'SalleDeReunion', label: 'Salle de réunion' },
  { value: 'Studio', label: 'Studio' },
  { value: 'SalleDeSoutenance', label: 'Salle de soutenance' },
];
const GRADE = [
  { value: 'Vacataire', label: 'Vacataire' },
  { value: 'Assistant', label: 'Assistant' },
  { value: 'MaitreAssistant', label: 'Maître-assistant' },
  { value: 'MaitreDeConferences', label: 'Maître de conférences' },
  { value: 'Professeur', label: 'Professeur' },
  { value: 'Docteur', label: 'Docteur' },
];
const GROUPE_LETTRES = opt(['A', 'B', 'C']);
const SEMESTRES_NIVEAU = { L1: [1, 2], L2: [3, 4], L3: [4, 5], M1: [6, 7], M2: [8, 9] };
const PREFIXES_TEL = ['032', '033', '034', '037', '038'];

// ---------- Validateurs ----------
const valTelephone = (v) => (!v ? null :
  (/^\d{10}$/.test(v) && PREFIXES_TEL.some((p) => v.startsWith(p)) ? null
    : 'Téléphone : 10 chiffres commençant par 032, 033, 034, 037 ou 038.'));
const valEmail = (v) => (v && v.includes('@') && v.includes('.') && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)
  ? null : 'Email invalide — doit contenir « @ » et « . » (ex : nom@gmail.com).');
const valLettre = (v) => (/^[A-Z]$/.test(v || '') ? null : 'Une seule lettre majuscule (ex : I).');
const valMatricule = (v) => (/^\d{3}[A-Z]\d{2}$/.test(v || '') ? null : 'Format attendu : 3 chiffres + lettre + 2 chiffres (ex : 130I24).');

const ageDe = (d) => {
  if (!d) return null;
  const n = new Date(d), t = new Date();
  let a = t.getFullYear() - n.getFullYear();
  const m = t.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < n.getDate())) a--;
  return a;
};
const estMajeur = (d) => { const a = ageDe(d); return a != null && a >= 18; };
const genreDepuisCin = (cin) => (/^\d{12}$/.test(cin || '')
  ? (cin[5] === '1' ? 'Masculin' : cin[5] === '2' ? 'Feminin' : null) : null);

const majUn = (v) => (v ? v.charAt(0).toUpperCase() + v.slice(1) : v);
const nomFiliere = (f) => `${f.codeFiliere} — ${f.nom}`;
const nomPersonne = (p) => `${p.nom} ${p.prenoms || ''}`.trim();
const hhmm = (t) => (t ? String(t).slice(0, 5) : '');

// ======================================================================
export function FilieresPage() {
  return (
    <div className="page-enter">
      <CrudResource
        sousTitre="Filières de formation de l'EMIT" endpoint="filieres"
        libelleAjout="Nouvelle filière" rechercheKeys={['codeFiliere', 'nom']}
        columns={[
          { key: 'codeFiliere', label: 'Code', render: (r) => <span className="badge badge-blue">{r.codeFiliere}</span> },
          { key: 'lettreSpecifique', label: 'Lettre', render: (r) => <span className="badge badge-amber">{r.lettreSpecifique}</span> },
          { key: 'nom', label: 'Intitulé' },
          { key: 'description', label: 'Description', render: (r) => <span className="muted">{r.description || '—'}</span> },
        ]}
        fields={[
          { name: 'codeFiliere', label: 'Code', required: true, placeholder: 'INFO', transform: (v) => v.toUpperCase(), maxLength: 20 },
          { name: 'lettreSpecifique', label: 'Lettre spécifique', required: true, mask: 'upperletter', placeholder: 'I', validate: valLettre, hint: 'Une seule lettre majuscule, utilisée dans le matricule.' },
          { name: 'nom', label: 'Intitulé', required: true },
          { name: 'description', label: 'Description', type: 'textarea', full: true },
        ]}
      />
    </div>
  );
}

export function NiveauxPage() {
  return (
    <div className="page-enter">
      <CrudResource
        titre="Niveaux" sousTitre="Niveaux d'études (L1 à M2)" endpoint="niveaux"
        libelleAjout="Nouveau niveau" rechercheKeys={['nom']}
        columns={[
          { key: 'nom', label: 'Niveau', render: (r) => <strong>{r.nom}</strong> },
          { key: 'ordre', label: "Ordre d'affichage" },
        ]}
        fields={[
          { name: 'nom', label: 'Nom', required: true, placeholder: 'L1', transform: majUn, hint: 'Commence par une majuscule.' },
          { name: 'ordre', label: 'Ordre', type: 'number', numeric: true, required: true, min: 1, mask: 'digits', hint: 'Chiffres uniquement.' },
        ]}
      />
    </div>
  );
}

export function ParcoursPage() {
  return (
    <div className="page-enter">
      <CrudResource
        titre="Parcours" sousTitre="Parcours / spécialités au sein des filières" endpoint="parcours"
        libelleAjout="Nouveau parcours" rechercheKeys={['nom', 'filiere.nom']}
        columns={[
          { key: 'nom', label: 'Parcours' },
          { key: 'filiere.nom', label: 'Filière' },
        ]}
        fields={[
          { name: 'nom', label: 'Nom du parcours', required: true, full: true },
          { name: 'filiereId', label: 'Filière', type: 'select', ref: 'filieres', optionLabel: nomFiliere, required: true, full: true },
        ]}
      />
    </div>
  );
}

export function MatieresPage() {
  return (
    <div className="page-enter">
      <CrudResource
        titre="Matières" sousTitre="Unités d'enseignement par filière et niveau" endpoint="matieres"
        libelleAjout="Nouvelle matière" rechercheKeys={['codeMatiere', 'nom']}
        derive={(form, ref) => {
          const niv = (ref.niveaux || []).find((n) => String(n.id) === String(form.niveauId));
          const allowed = SEMESTRES_NIVEAU[niv?.nom] || [];
          if (form.semestre && !allowed.includes(Number(form.semestre))) return { semestre: '' };
          return {};
        }}
        columns={[
          { key: 'codeMatiere', label: 'Code', render: (r) => <span className="badge badge-blue">{r.codeMatiere}</span> },
          { key: 'nom', label: 'Intitulé' },
          { key: 'filiere.nom', label: 'Filière' },
          { key: 'niveau.nom', label: 'Niveau' },
          { key: 'semestre', label: 'Sem.', render: (r) => `S${r.semestre}` },
          { key: 'coefficient', label: 'Coef.' },
          { key: 'creditsEcts', label: 'ECTS', render: (r) => r.creditsEcts ?? '—' },
        ]}
        fields={[
          { name: 'codeMatiere', label: 'Code', required: true, placeholder: 'INFO101', transform: (v) => v.toUpperCase(), hint: 'Doit commencer par le code de la filière.',
            validate: (v, form, ref) => { const f = (ref.filieres || []).find((x) => String(x.id) === String(form.filiereId)); return f && !String(v).toUpperCase().startsWith(f.codeFiliere) ? `Doit commencer par « ${f.codeFiliere} ».` : null; } },
          { name: 'nom', label: 'Intitulé', required: true },
          { name: 'filiereId', label: 'Filière', type: 'select', ref: 'filieres', optionLabel: nomFiliere, required: true },
          { name: 'niveauId', label: 'Niveau', type: 'select', ref: 'niveaux', required: true },
          { name: 'coefficient', label: 'Coefficient', type: 'number', numeric: true, required: true, min: 1, step: 1, mask: 'digits', hint: 'Entier (pas de décimale).' },
          { name: 'creditsEcts', label: 'Crédits ECTS (optionnel)', type: 'number', numeric: true, min: 0, mask: 'digits' },
          { name: 'semestre', label: 'Semestre', type: 'select', numeric: true, required: true,
            options: (form, ref) => { const niv = (ref.niveaux || []).find((n) => String(n.id) === String(form.niveauId)); return (SEMESTRES_NIVEAU[niv?.nom] || []).map((s) => ({ value: s, label: `S${s}` })); },
            disabled: (form) => !form.niveauId, hint: 'Dépend du niveau choisi.' },
          { name: 'parcoursId', label: 'Parcours (optionnel)', type: 'select', ref: 'parcours' },
        ]}
      />
    </div>
  );
}

export function SallesPage() {
  return (
    <div className="page-enter">
      <CrudResource
        titre="Salles" sousTitre="Salles, amphithéâtres et studios" endpoint="salles"
        libelleAjout="Nouvelle salle" rechercheKeys={['nom']}
        columns={[
          { key: 'nom', label: 'Salle', render: (r) => <strong>{r.nom}</strong> },
          { key: 'typeSalle', label: 'Type', render: (r) => <Tag value={r.typeSalle} /> },
          { key: 'capacite', label: 'Capacité', render: (r) => `${r.capacite} places` },
          { key: 'batiment.nom', label: 'Bâtiment', render: (r) => r.batiment?.nom || '—' },
        ]}
        fields={[
          { name: 'nom', label: 'Nom', required: true, placeholder: 'Amphi A' },
          { name: 'typeSalle', label: 'Type de salle', type: 'select', options: TYPE_SALLE, required: true },
          { name: 'capacite', label: 'Capacité', type: 'number', numeric: true, required: true, min: 1, mask: 'digits' },
          { name: 'batimentId', label: 'Bâtiment', type: 'select', ref: 'batiments', required: true },
        ]}
      />
    </div>
  );
}

export function BatimentsPage() {
  return (
    <div className="page-enter">
      <CrudResource
        titre="Bâtiments" sousTitre="Bâtiments du campus" endpoint="batiments"
        libelleAjout="Nouveau bâtiment" rechercheKeys={['nom', 'adresse']}
        columns={[
          { key: 'nom', label: 'Bâtiment', render: (r) => <strong>{r.nom}</strong> },
          { key: 'adresse', label: 'Adresse', render: (r) => <span className="muted">{r.adresse || '—'}</span> },
        ]}
        fields={[
          { name: 'nom', label: 'Nom', required: true, placeholder: 'Bâtiment B' },
          { name: 'adresse', label: 'Adresse', full: true },
        ]}
      />
    </div>
  );
}

export function EnseignantsPage() {
  return (
    <div className="page-enter">
      <CrudResource
        titre="Enseignants" sousTitre="Corps enseignant de l'EMIT" endpoint="enseignants"
        libelleAjout="Nouvel enseignant" rechercheKeys={['nom', 'prenoms', 'email']}
        columns={[
          { key: 'nom', label: 'Nom', render: (r) => <strong>{r.nom} {r.prenoms}</strong> },
          { key: 'grade', label: 'Grade', render: (r) => <Tag value={r.grade} /> },
          { key: 'email', label: 'Email', render: (r) => r.email || '—' },
          { key: 'telephone', label: 'Téléphone', render: (r) => r.telephone || '—' },
        ]}
        fields={[
          { name: 'nom', label: 'Nom', required: true, mask: 'letters', transform: capitaliserMots },
          { name: 'prenoms', label: 'Prénoms (optionnel)', mask: 'letters', transform: capitaliserMots },
          { name: 'grade', label: 'Grade', type: 'select', options: GRADE, required: true },
          { name: 'email', label: 'Email', type: 'email', required: true, validate: valEmail },
          { name: 'telephone', label: 'Téléphone', mask: 'phone', validate: valTelephone, placeholder: '0341234567' },
        ]}
      />
    </div>
  );
}

export function GroupesPage() {
  return (
    <div className="page-enter">
      <CrudResource
        titre="Groupes" sousTitre="Groupes d'étudiants par niveau" endpoint="groupes"
        libelleAjout="Nouveau groupe" rechercheKeys={['nom']}
        derive={(form, ref) => {
          const niv = (ref.niveaux || []).find((n) => String(n.id) === String(form.niveauId));
          const fil = (ref.filieres || []).find((f) => String(f.id) === String(form.filiereId));
          if (niv && fil && form.groupeLettre) return { nom: `${niv.nom} ${fil.codeFiliere} ${form.groupeLettre}` };
          return {};
        }}
        columns={[
          { key: 'nom', label: 'Nom du groupe', render: (r) => <strong>{r.nom}</strong> },
          { key: 'filiere.nom', label: 'Filière' },
          { key: 'niveau.nom', label: 'Niveau' },
          { key: 'parcours.nom', label: 'Parcours', render: (r) => r.parcours?.nom || '—' },
        ]}
        fields={[
          { name: 'niveauId', label: 'Niveau', type: 'select', ref: 'niveaux', required: true },
          { name: 'filiereId', label: 'Filière', type: 'select', ref: 'filieres', optionLabel: nomFiliere, required: true },
          { name: 'groupeLettre', label: 'Groupe', type: 'select', options: GROUPE_LETTRES, required: true, formOnly: true },
          { name: 'parcoursId', label: 'Parcours (optionnel)', type: 'select', ref: 'parcours' },
          { name: 'nom', label: 'Nom du groupe (généré)', readOnly: true, full: true, hint: 'Composé automatiquement : Niveau Code-Filière Groupe (ex : L2 INFO A).' },
        ]}
      />
    </div>
  );
}

export function EtudiantsPage() {
  return (
    <div className="page-enter">
      <CrudResource
        titre="Étudiants" sousTitre="Étudiants inscrits par filière et niveau" endpoint="etudiants"
        libelleAjout="Nouvel étudiant" rechercheKeys={['matricule', 'nom', 'prenoms', 'email']}
        makeDefaults={(ref) => {
          const l1 = (ref.niveaux || []).find((n) => n.nom === 'L1');
          const active = (ref.anneesacademiques || []).find((a) => a.active);
          return { niveauId: l1 ? l1.id : '', statut: 'Passant', sexe: 'Masculin', anneeAcademiqueId: active ? active.id : '' };
        }}
        derive={(form, ref) => {
          const patch = {};
          const active = (ref.anneesacademiques || []).find((a) => a.active);
          const anneeId = form.anneeAcademiqueId || active?.id;
          if (!form.anneeAcademiqueId && active) patch.anneeAcademiqueId = active.id;
          if (!form.id) {
            const fil = (ref.filieres || []).find((f) => String(f.id) === String(form.filiereId));
            const an = (ref.anneesacademiques || []).find((a) => String(a.id) === String(anneeId));
            const yy = an ? String(an.libelle).slice(2, 4) : '';
            if (fil && form.numeroMatricule) patch.matricule = `${String(form.numeroMatricule).padStart(3, '0')}${fil.lettreSpecifique}${yy}`;
          }
          if (estMajeur(form.dateNaissance)) {
            const g = genreDepuisCin(form.cin);
            if (g) patch.sexe = g;
          }
          return patch;
        }}
        columns={[
          { key: 'matricule', label: 'Matricule', render: (r) => <span className="badge badge-blue">{r.matricule}</span> },
          { key: 'nom', label: 'Étudiant', render: (r) => <strong>{r.nom} {r.prenoms}</strong> },
          { key: 'filiere.nom', label: 'Filière' },
          { key: 'niveau.nom', label: 'Niveau' },
          { key: 'email', label: 'Email', render: (r) => r.email || '—' },
          { key: 'telephone', label: 'Téléphone', render: (r) => r.telephone || '—' },
          { key: 'statut', label: 'Statut', render: (r) => <Tag value={r.statut} /> },
        ]}
        fields={[
          { name: 'numeroMatricule', label: 'N° matricule (3 chiffres)', mask: 'digits', maxLength: 3, required: true, formOnly: true, hidden: (form) => !!form.id, placeholder: '130', hint: "Numéro d'ordre ; la lettre et l'année sont ajoutées automatiquement." },
          { name: 'matricule', label: 'Matricule', readOnly: true, required: true, validate: valMatricule, hint: 'Généré automatiquement et non modifiable.' },
          { name: 'nom', label: 'Nom', required: true, mask: 'letters', transform: capitaliserMots },
          { name: 'prenoms', label: 'Prénoms (optionnel)', mask: 'letters', transform: capitaliserMots },
          { name: 'dateNaissance', label: 'Date de naissance', type: 'date', required: true, validate: (v) => { const a = ageDe(v); return a != null && a < 13 ? "L'étudiant doit avoir au moins 13 ans." : null; }, hint: 'Au moins 13 ans à l\'inscription.' },
          { name: 'cin', label: 'CIN', mask: 'cin', required: true, hidden: (form) => !estMajeur(form.dateNaissance), hint: '12 chiffres. Le 6e chiffre : 1 = Masculin, 2 = Féminin.', validate: (v) => (/^\d{12}$/.test(v || '') ? (['1', '2'].includes((v || '')[5]) ? null : 'Le 6e chiffre doit être 1 (M) ou 2 (F).') : 'CIN : 12 chiffres.') },
          { name: 'sexe', label: 'Sexe', type: 'select', options: SEXE, required: true, disabled: (form) => estMajeur(form.dateNaissance), hint: 'Automatique pour les majeurs (selon le CIN).' },
          { name: 'email', label: 'Email', type: 'email', required: true, validate: valEmail },
          { name: 'telephone', label: 'Téléphone', mask: 'phone', validate: valTelephone, placeholder: '0331234567' },
          { name: 'filiereId', label: 'Filière', type: 'select', ref: 'filieres', optionLabel: nomFiliere, required: true },
          { name: 'niveauId', label: 'Niveau', type: 'select', ref: 'niveaux', required: true },
          { name: 'parcoursId', label: 'Parcours (optionnel)', type: 'select', ref: 'parcours' },
          { name: 'statut', label: 'Statut', type: 'select', options: STATUT, required: true },
          { name: 'anneeAcademiqueId', label: 'Année académique', type: 'select', ref: 'anneesacademiques', optionLabel: (a) => a.libelle, hidden: true },
        ]}
      />
    </div>
  );
}

export function DisponibilitesPage() {
  return (
    <div className="page-enter">
      <CrudResource
        titre="Disponibilités des enseignants"
        sousTitre="Créneaux hebdomadaires (7h–19h) utilisés pour planifier les séances et détecter les conflits"
        endpoint="disponibilites" libelleAjout="Nouveau créneau" rechercheKeys={['enseignant.nom', 'enseignant.prenoms']}
        columns={[
          { key: 'enseignant', label: 'Enseignant', render: (r) => <strong>{r.enseignant ? nomPersonne(r.enseignant) : '—'}</strong> },
          { key: 'jourSemaine', label: 'Jour' },
          { key: 'creneau', label: 'Créneau', render: (r) => `${hhmm(r.heureDebut)} – ${hhmm(r.heureFin)}` },
          { key: 'disponible', label: 'État', render: (r) => <Tag value={r.disponible ? 'Disponible' : 'Indisponible'} /> },
          { key: 'commentaire', label: 'Note', render: (r) => <span className="muted">{r.commentaire || '—'}</span> },
        ]}
        fields={[
          { name: 'enseignantId', label: 'Enseignant', type: 'select', ref: 'enseignants', optionLabel: nomPersonne, required: true, full: true },
          { name: 'jourSemaine', label: 'Jour de la semaine', type: 'select', options: opt(['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']), required: true },
          { name: 'disponible', label: 'Disponible sur ce créneau', type: 'checkbox', default: true },
          { name: 'heureDebut', label: 'Heure de début', type: 'time', required: true, min: '07:00', max: '19:00', hint: 'Entre 07:00 et 19:00.' },
          { name: 'heureFin', label: 'Heure de fin', type: 'time', required: true, min: '07:00', max: '19:00',
            validate: (v, form) => { if (!form.heureDebut) return null; if (v <= form.heureDebut) return "Doit être après l'heure de début."; const [h1, m1] = form.heureDebut.split(':').map(Number); const [h2, m2] = v.split(':').map(Number); if ((h2 * 60 + m2) - (h1 * 60 + m1) < 60) return 'Durée minimale : 1 heure.'; return null; } },
          { name: 'commentaire', label: 'Commentaire', full: true },
        ]}
      />
    </div>
  );
}