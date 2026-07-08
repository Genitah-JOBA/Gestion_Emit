import CrudResource, { capitaliserMots } from '../components/CrudResource';
import { Tag } from '../components/ui';
import { motion } from 'framer-motion';
import { useState, useMemo, useCallback } from 'react';

// ---------- Animation d'entrée ----------
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const pageTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  duration: 0.3
};

// ---------- Composant de recherche avancée ----------
const SearchBar = ({ onSearch, onFilter, filters, columns, placeholder = "Rechercher..." }) => {
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterType, setFilterType] = useState('contains');
  const [selectedColumn, setSelectedColumn] = useState('');

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  const handleFilterChange = (column, value) => {
    const newFilters = { ...activeFilters, [column]: value };
    if (!value) delete newFilters[column];
    setActiveFilters(newFilters);
    onFilter(newFilters);
  };

  const clearFilters = () => {
    setActiveFilters({});
    setQuery('');
    onSearch('');
    onFilter({});
  };

  const filterOptions = {
    contains: 'Contient',
    startsWith: 'Commence par',
    endsWith: 'Se termine par',
    equals: 'Égal à',
    notEquals: 'Différent de',
    greaterThan: 'Supérieur à',
    lessThan: 'Inférieur à',
    between: 'Entre',
    in: 'Dans la liste',
    notIn: 'Pas dans la liste'
  };

  return (
    <div className="search-container">
      <div className="search-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder={placeholder}
            value={query}
            onChange={handleSearch}
          />
          {query && (
            <button className="clear-search" onClick={() => { setQuery(''); onSearch(''); }}>
              ✕
            </button>
          )}
        </div>
        <div className="search-actions">
          <button 
            className={`btn btn-ghost btn-sm ${showAdvanced ? 'active' : ''}`}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Masquer' : 'Filtres avancés'} ⚙️
          </button>
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
            Effacer tout
          </button>
        </div>
      </div>

      {showAdvanced && (
        <div className="advanced-filters">
          <div className="filter-row">
            <select 
              className="filter-select"
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
            >
              <option value="">Sélectionner une colonne</option>
              {columns.map(col => (
                <option key={col.key} value={col.key}>{col.label}</option>
              ))}
            </select>
            
            <select 
              className="filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              {Object.entries(filterOptions).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <input
              type="text"
              className="filter-input"
              placeholder="Valeur..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const value = e.target.value;
                  if (selectedColumn && value) {
                    handleFilterChange(selectedColumn, { type: filterType, value });
                    e.target.value = '';
                  }
                }
              }}
            />
            <button className="btn btn-primary btn-sm">Appliquer</button>
          </div>

          <div className="active-filters">
            {Object.entries(activeFilters).map(([key, filter]) => (
              <span key={key} className="filter-tag">
                {columns.find(c => c.key === key)?.label || key}: {filter.value}
                <button onClick={() => handleFilterChange(key, null)}>×</button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- Hook de recherche et filtrage ----------
const useSearchAndFilter = (data, searchKeys, filters = {}) => {
  return useMemo(() => {
    if (!data) return [];

    let result = [...data];

    Object.entries(filters).forEach(([key, filter]) => {
      result = result.filter(item => {
        const value = getNestedValue(item, key);
        if (value === undefined || value === null) return false;

        const strValue = String(value).toLowerCase();
        const strFilter = String(filter.value).toLowerCase();

        switch (filter.type) {
          case 'contains':
            return strValue.includes(strFilter);
          case 'startsWith':
            return strValue.startsWith(strFilter);
          case 'endsWith':
            return strValue.endsWith(strFilter);
          case 'equals':
            return strValue === strFilter;
          case 'notEquals':
            return strValue !== strFilter;
          case 'greaterThan':
            return parseFloat(value) > parseFloat(filter.value);
          case 'lessThan':
            return parseFloat(value) < parseFloat(filter.value);
          case 'between':
            const [min, max] = filter.value.split(',').map(v => parseFloat(v.trim()));
            return parseFloat(value) >= min && parseFloat(value) <= max;
          case 'in':
            const values = filter.value.split(',').map(v => v.trim().toLowerCase());
            return values.some(v => strValue.includes(v));
          case 'notIn':
            const notValues = filter.value.split(',').map(v => v.trim().toLowerCase());
            return !notValues.some(v => strValue.includes(v));
          default:
            return true;
        }
      });
    });

    return result;
  }, [data, filters]);
};

// Fonction utilitaire
const getNestedValue = (obj, path) => {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
};

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
    <motion.div
      className="page-enter"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
    >
      <CrudResource
        sousTitre="Filières de formation de l'EMIT" 
        endpoint="filieres"
        libelleAjout="Filière" 
        rechercheKeys={['codeFiliere', 'nom']}
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
        searchPlaceholder="Rechercher par code ou nom..."
        filterableColumns={['codeFiliere', 'nom', 'lettreSpecifique']}
      />
    </motion.div>
  );
}

export function NiveauxPage() {
  return (
    <motion.div
      className="page-enter"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
    >
      <CrudResource
        sousTitre="Niveaux d'études" 
        endpoint="niveaux"
        libelleAjout="Niveau" 
        rechercheKeys={['nom']}
        columns={[
          { key: 'nom', label: 'Niveau', render: (r) => <strong>{r.nom}</strong> },
          { key: 'ordre', label: "Ordre d'affichage" },
        ]}
        fields={[
          { name: 'nom', label: 'Nom', required: true, placeholder: 'L1', transform: majUn, hint: 'Commence par une majuscule.' },
          { name: 'ordre', label: 'Ordre', type: 'number', numeric: true, required: true, min: 1, mask: 'digits', hint: 'Chiffres uniquement.' },
        ]}
        searchPlaceholder="Rechercher un niveau..."
        filterableColumns={['nom', 'ordre']}
      />
    </motion.div>
  );
}

export function ParcoursPage() {
  return (
    <motion.div
      className="page-enter"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
    >
      <CrudResource
        sousTitre="Parcours / spécialités au sein des filières" 
        endpoint="parcours"
        libelleAjout="Parcours" 
        rechercheKeys={['nom', 'filiere.nom', 'niveaux.nom']}
        columns={[
          { key: 'nom', label: 'Parcours' },
          { key: 'filiere.nom', label: 'Filière' },
          { 
            key: 'niveaux', 
            label: 'Niveaux', 
            render: (r) => (
              <span className="niveaux-tags">
                {r.niveaux && r.niveaux.length > 0 
                  ? r.niveaux.map(n => (
                      <Tag key={n.id} value={n.nom} className="badge-blue" />
                    ))
                  : '—'
                }
              </span>
            )
          },
        ]}
        fields={[
          { name: 'nom', label: 'Nom du parcours', required: true, full: true },
          { 
            name: 'filiereId', 
            label: 'Filière', 
            type: 'select', 
            ref: 'filieres', 
            optionLabel: nomFiliere, 
            required: true, 
            full: true 
          },
          { 
            name: 'niveauxIds', 
            label: 'Niveaux disponibles', 
            type: 'pills',
            ref: 'niveaux',
            optionLabel: (n) => n.nom,
            required: true,
            full: true,
            hint: 'Cliquez sur les niveaux pour les sélectionner/désélectionner'
          },
        ]}
        searchPlaceholder="Rechercher par parcours, filière ou niveaux..."
        filterableColumns={['nom', 'filiere.nom', 'niveaux.nom']}
      />
    </motion.div>
  );
}

export function MatieresPage() {
  return (
    <motion.div
      className="page-enter"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
    >
      <CrudResource
        sousTitre="Unités d'enseignement par filière et niveau" 
        endpoint="matieres"
        libelleAjout="Matière" 
        rechercheKeys={['codeMatiere', 'nom']}
        derive={(form, ref) => {
          const patch = {};
          const niv = (ref.niveaux || []).find((n) => String(n.id) === String(form.niveauId));
          const allowed = SEMESTRES_NIVEAU[niv?.nom] || [];
          if (form.semestre && !allowed.includes(Number(form.semestre))) patch.semestre = '';
          // Vide le parcours s'il ne correspond plus à la filière/niveau sélectionnés.
          if (form.parcoursId) {
            const p = (ref.parcours || []).find((x) => String(x.id) === String(form.parcoursId));
            const okFiliere = !form.filiereId || (p && String(p.filiereId) === String(form.filiereId));
            const okNiveau = !form.niveauId || !p || (
              Array.isArray(p.niveaux) ? p.niveaux.some((n) => String(n.id) === String(form.niveauId))
              : Array.isArray(p.niveauxIds) ? p.niveauxIds.some((id) => String(id) === String(form.niveauId))
              : true
            );
            if (!p || !okFiliere || !okNiveau) patch.parcoursId = '';
          }
          return patch;
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
          {
            name: 'parcoursId',
            label: 'Parcours (optionnel)',
            type: 'select',
            ref: 'parcours',
            options: (form, ref) => {
              const parcours = ref.parcours || [];
              const filiereId = form.filiereId;
              const niveauId = form.niveauId;

              let filtered = parcours;
              if (filiereId) {
                filtered = filtered.filter(p => String(p.filiereId) === String(filiereId));
              }
              if (niveauId && filtered.length > 0) {
                filtered = filtered.filter(p => {
                  if (p.niveaux && Array.isArray(p.niveaux)) {
                    return p.niveaux.some(n => String(n.id) === String(niveauId));
                  }
                  if (p.niveauxIds && Array.isArray(p.niveauxIds)) {
                    return p.niveauxIds.some(id => String(id) === String(niveauId));
                  }
                  if (p.niveauId) {
                    return String(p.niveauId) === String(niveauId);
                  }
                  return true;
                });
              }
              return filtered.map(p => ({ value: p.id, label: p.nom }));
            },
            disabled: (form) => !form.filiereId || !form.niveauId,
            hint: 'Seuls les parcours disponibles pour la filière et le niveau sélectionnés sont affichés.'
          },
        ]}
        searchPlaceholder="Rechercher par code ou intitulé..."
        filterableColumns={['codeMatiere', 'nom', 'filiere.nom', 'niveau.nom', 'semestre', 'coefficient', 'creditsEcts']}
      />
    </motion.div>
  );
}

export function SallesPage() {
  return (
    <motion.div
      className="page-enter"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
    >
      <CrudResource
        sousTitre="Salles, amphithéâtres et studios" 
        endpoint="salles"
        libelleAjout="Salle" 
        rechercheKeys={['nom', 'numero']}
        columns={[
          { key: 'numero', label: 'N°', render: (r) => <Tag value={r.numero || '—'} className="badge-blue" /> },
          { key: 'nom', label: 'Salle', render: (r) => <strong>{r.nom}</strong> },
          { key: 'typeSalle', label: 'Type', render: (r) => <Tag value={r.typeSalle} /> },
          { key: 'capacite', label: 'Capacité', render: (r) => `${r.capacite} places` },
          { key: 'batiment.nom', label: 'Bâtiment', render: (r) => r.batiment?.nom || '—' },
        ]}
        fields={[
          { name: 'numero', label: 'Numéro', required: true, placeholder: '001', hint: 'Unique au sein du bâtiment (ex : 001, 404).' },
          { name: 'nom', label: 'Nom', required: true, placeholder: 'Amphi A' },
          { name: 'typeSalle', label: 'Type de salle', type: 'select', options: TYPE_SALLE, required: true },
          { name: 'capacite', label: 'Capacité', type: 'number', numeric: true, required: true, min: 1, mask: 'digits' },
          { name: 'batimentId', label: 'Bâtiment', type: 'select', ref: 'batiments', required: true },
        ]}
        searchPlaceholder="Rechercher par numéro ou nom de salle..."
        filterableColumns={['numero', 'nom', 'typeSalle', 'capacite', 'batiment.nom']}
      />
    </motion.div>
  );
}

export function BatimentsPage() {
  return (
    <motion.div
      className="page-enter"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
    >
      <CrudResource
        sousTitre="Bâtiments de l'école" 
        endpoint="batiments"
        libelleAjout="Bâtiment" 
        rechercheKeys={['nom', 'adresse']}
        columns={[
          { key: 'nom', label: 'Bâtiment', render: (r) => <strong>{r.nom}</strong> },
          { key: 'adresse', label: 'Adresse', render: (r) => <span className="muted">{r.adresse || '—'}</span> },
        ]}
        fields={[
          { name: 'nom', label: 'Nom', required: true, placeholder: 'Bâtiment B' },
          { name: 'adresse', label: 'Adresse', full: true },
        ]}
        searchPlaceholder="Rechercher par nom ou adresse..."
        filterableColumns={['nom', 'adresse']}
      />
    </motion.div>
  );
}

export function EnseignantsPage() {
  return (
    <motion.div
      className="page-enter"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
    >
      <CrudResource
        sousTitre="Corps enseignant de l'EMIT" 
        endpoint="enseignants"
        libelleAjout="Enseignant" 
        rechercheKeys={['nom', 'prenoms', 'email']}
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
        searchPlaceholder="Rechercher par nom, prénom ou email..."
        filterableColumns={['nom', 'prenoms', 'grade', 'email', 'telephone']}
      />
    </motion.div>
  );
}

export function GroupesPage() {
  return (
    <motion.div
      className="page-enter"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
    >
      <CrudResource
        sousTitre="Groupes d'étudiants par niveau" 
        endpoint="groupes"
        libelleAjout="Groupe" 
        rechercheKeys={['nom']}
        derive={(form, ref) => {
          const niv = (ref.niveaux || []).find((n) => String(n.id) === String(form.niveauId));
          const fil = (ref.filieres || []).find((f) => String(f.id) === String(form.filiereId));
          if (niv && fil && form.groupeLettre) {
            // Nom composé : Niveau + Code-Filière + Lettre de groupe (ex : L2 INFO A).
            return { nom: `${niv.nom} ${fil.codeFiliere} ${form.groupeLettre}` };
          }
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
          { 
            name: 'parcoursId', 
            label: 'Parcours (optionnel)', 
            type: 'select', 
            ref: 'parcours',
            options: (form, ref) => {
              const parcours = ref.parcours || [];
              const filiereId = form.filiereId;
              const niveauId = form.niveauId;
              
              let filtered = parcours;
              if (filiereId) {
                filtered = filtered.filter(p => String(p.filiereId) === String(filiereId));
              }
              if (niveauId && filtered.length > 0) {
                filtered = filtered.filter(p => {
                  if (p.niveaux && Array.isArray(p.niveaux)) {
                    return p.niveaux.some(n => String(n.id) === String(niveauId));
                  }
                  if (p.niveauxIds && Array.isArray(p.niveauxIds)) {
                    return p.niveauxIds.some(id => String(id) === String(niveauId));
                  }
                  if (p.niveauId) {
                    return String(p.niveauId) === String(niveauId);
                  }
                  return true;
                });
              }
              return filtered.map(p => ({
                value: p.id,
                label: p.nom
              }));
            },
            disabled: (form) => !form.filiereId || !form.niveauId,
            hint: 'Seuls les parcours disponibles pour cette filière et ce niveau sont affichés.'
          },
          { name: 'groupeLettre', label: 'Groupe', type: 'select', options: GROUPE_LETTRES, required: true, formOnly: true },
          { name: 'nom', label: 'Nom du groupe (généré)', readOnly: true, full: true, hint: 'Composé automatiquement : Niveau Code-Filière Groupe (ex : L2 INFO A).' },
        ]}
        searchPlaceholder="Rechercher un groupe..."
        filterableColumns={['nom', 'filiere.nom', 'niveau.nom', 'parcours.nom']}
      />
    </motion.div>
  );
}

export function EtudiantsPage() {
  return (
    <motion.div
      className="page-enter"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
    >
      <CrudResource
        sousTitre="Étudiants inscrits par filière et niveau" 
        endpoint="etudiants"
        libelleAjout="Étudiant" 
        rechercheKeys={['matricule', 'nom', 'prenoms', 'email']}
        makeDefaults={(ref) => {
          const l1 = (ref.niveaux || []).find((n) => n.nom === 'L1');
          const active = (ref.anneesacademiques || []).find((a) => a.active);
          return { 
            niveauId: l1 ? l1.id : '', 
            statut: 'Passant', 
            sexe: 'Masculin', 
            anneeAcademiqueId: active ? active.id : '' 
          };
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
          { 
            name: 'parcoursId', 
            label: 'Parcours (optionnel)', 
            type: 'select', 
            ref: 'parcours',
            options: (form, ref) => {
              const parcours = ref.parcours || [];
              const filiereId = form.filiereId;
              const niveauId = form.niveauId;
              
              let filtered = parcours;
              if (filiereId) {
                filtered = filtered.filter(p => String(p.filiereId) === String(filiereId));
              }
              if (niveauId && filtered.length > 0) {
                filtered = filtered.filter(p => {
                  if (p.niveaux && Array.isArray(p.niveaux)) {
                    return p.niveaux.some(n => String(n.id) === String(niveauId));
                  }
                  if (p.niveauxIds && Array.isArray(p.niveauxIds)) {
                    return p.niveauxIds.some(id => String(id) === String(niveauId));
                  }
                  if (p.niveauId) {
                    return String(p.niveauId) === String(niveauId);
                  }
                  return true;
                });
              }
              return filtered.map(p => ({
                value: p.id,
                label: p.nom
              }));
            },
            disabled: (form) => !form.filiereId || !form.niveauId,
            hint: 'Seuls les parcours disponibles pour la filière et le niveau sélectionnés sont affichés.'
          },
          { name: 'statut', label: 'Statut', type: 'select', options: STATUT, required: true },
          { name: 'anneeAcademiqueId', label: 'Année académique', type: 'select', ref: 'anneesacademiques', optionLabel: (a) => a.libelle, hidden: true },
        ]}
        searchPlaceholder="Rechercher par matricule, nom, prénom ou email..."
        filterableColumns={['matricule', 'nom', 'prenoms', 'filiere.nom', 'niveau.nom', 'statut', 'email', 'telephone']}
      />
    </motion.div>
  );
}

export function DisponibilitesPage() {
  return (
    <motion.div
      className="page-enter"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
    >
      <CrudResource
        titre="Disponibilités des enseignants"
        sousTitre="Créneaux hebdomadaires (7h–19h) utilisés pour planifier les séances et détecter les conflits"
        endpoint="disponibilites" 
        libelleAjout="Créneau" 
        rechercheKeys={['enseignant.nom', 'enseignant.prenoms']}
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
        searchPlaceholder="Rechercher par nom d'enseignant..."
        filterableColumns={['enseignant.nom', 'enseignant.prenoms', 'jourSemaine', 'disponible']}
      />
    </motion.div>
  );
}