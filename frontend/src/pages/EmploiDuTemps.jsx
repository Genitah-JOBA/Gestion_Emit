import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { messageErreur } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../lib/toast';
import Icon from '../lib/icons';
import { ConflitModal, Field, Loading, Modal } from '../components/ui';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const NOMS_JOUR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const TYPES = ['Cours', 'TD', 'TP', 'Examen'];

const lundiDe = (d) => {
  const x = new Date(d);
  const j = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - j);
  x.setHours(0, 0, 0, 0);
  return x;
};
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const hhmm = (t) => (t ? String(t).slice(0, 5) : '');
// Durée (en minutes) entre deux heures « HH:MM ».
const minutesEntre = (debut, fin) => {
  const [hd, md] = String(debut).split(':').map(Number);
  const [hf, mf] = String(fin).split(':').map(Number);
  return (hf * 60 + mf) - (hd * 60 + md);
};
// Affichage d'une salle dans l'emploi du temps : « numéro — bâtiment » (repli sur le nom si pas de numéro).
const labelSalle = (s) => {
  if (!s) return '';
  const num = s.numero || s.nom;
  return s.batiment?.nom ? `${num} — ${s.batiment.nom}` : num;
};
const ajouter = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const jourNomDe = (dateStr) => (dateStr ? NOMS_JOUR[new Date(dateStr).getDay()] : '');
const demainIso = () => iso(ajouter(new Date(), 1));

// ---------- Variants d'animation ----------
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: 'easeOut' }
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25 }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
};

const eventVariants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -10 },
  transition: { duration: 0.2, ease: 'easeOut' }
};

// ---------- Feuille d'impression ----------
const EP_JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
const EP_DEBUT = 7;
const EP_NB = 11;
const EP_PALETTE = ['#f4c33f', '#e6a0c4', '#bfe5cc', '#4caf7d', '#5c6e57', '#f6b8a0', '#3f6d84', '#9fb8c4', '#c8b6e2', '#d8c07a'];

function couleurMatiere(m) {
  if (!m) return '#e5e7eb';
  const s = String(m.id ?? m.nom ?? '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return EP_PALETTE[h % EP_PALETTE.length];
}

function texteSur(bg) {
  const c = bg.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#1f2937' : '#ffffff';
}

function colonneDuJour(seancesJour) {
  const col = Array.from({ length: EP_NB }, () => ({ type: 'vide' }));
  (seancesJour || []).forEach((s) => {
    const hd = parseInt(hhmm(s.heureDebut).slice(0, 2), 10);
    const mf = parseInt(hhmm(s.heureFin).slice(3, 5), 10);
    const hf = parseInt(hhmm(s.heureFin).slice(0, 2), 10);
    const debut = Math.max(0, hd - EP_DEBUT);
    const fin = Math.min(EP_NB, hf - EP_DEBUT + (mf > 0 ? 1 : 0));
    const span = Math.max(1, fin - debut);
    if (debut < EP_NB && col[debut].type === 'vide') {
      col[debut] = { type: 'debut', seance: s, span };
      for (let r = debut + 1; r < debut + span && r < EP_NB; r++) col[r] = { type: 'couverte' };
    }
  });
  return col;
}

export default function EmploiDuTemps() {
  const { peutGerer } = useAuth();
  const toast = useToast();

  const [refs, setRefs] = useState(null);
  const [vue, setVue] = useState('groupe');
  const [cibleId, setCibleId] = useState('');
  const [lundi, setLundi] = useState(lundiDe(new Date()));
  const [seances, setSeances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(null);
  const [genResult, setGenResult] = useState(null);
  const [genLoading, setGenLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/groupes'), api.get('/enseignants'), api.get('/salles'),
      api.get('/matieres'), api.get('/anneesacademiques'), api.get('/disponibilites'),
    ]).then(([g, e, s, m, a, d]) => {
      const data = { groupes: g.data, enseignants: e.data, salles: s.data, matieres: m.data, annees: a.data, dispos: d.data };
      setRefs(data);
      if (data.groupes[0]) setCibleId(String(data.groupes[0].id));
    }).catch((err) => toast.error(messageErreur(err)));
  }, []);

  const samedi = useMemo(() => ajouter(lundi, 5), [lundi]);

  async function charger() {
    if (!cibleId) { setSeances([]); return; }
    setLoading(true);
    try {
      const param = { groupe: 'groupeId', enseignant: 'enseignantId', salle: 'salleId' }[vue];
      const { data } = await api.get('/seances', { params: { [param]: cibleId, du: iso(lundi), au: iso(samedi) } });
      setSeances(data);
    } catch (e) {
      toast.error(messageErreur(e));
    } finally {
      setLoading(false);
    }
  }

  async function genererAuto() {
    setGenLoading(true);
    try {
      const { data } = await api.post('/seances/generer', null, {
        params: { groupeId: cibleId, lundi: iso(lundi), dureeMinutes: 120 },
      });
      if (!data.propositions.length && data.nonPlacees.length) {
        toast.error(data.nonPlacees[0]);
        return;
      }
      setGenResult(data);
    } catch (e) {
      toast.error(messageErreur(e));
    } finally {
      setGenLoading(false);
    }
  }

  useEffect(() => { if (refs) charger(); }, [vue, cibleId, lundi, refs]);

  useEffect(() => {
    if (!refs) return;
    const liste = { groupe: refs.groupes, enseignant: refs.enseignants, salle: refs.salles }[vue];
    setCibleId(liste[0] ? String(liste[0].id) : '');
  }, [vue]);

  const parJour = useMemo(() => {
    const map = {};
    JOURS.forEach((_, i) => { map[i] = []; });
    seances.forEach((s) => {
      const d = new Date(s.dateCours);
      const idx = (d.getDay() + 6) % 7;
      if (idx >= 0 && idx < 6) map[idx].push(s);
    });
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.heureDebut.localeCompare(b.heureDebut)));
    return map;
  }, [seances]);

  if (!refs) return <Loading />;

  const listeCible = { groupe: refs.groupes, enseignant: refs.enseignants, salle: refs.salles }[vue];
  const labelCible = (o) => vue === 'enseignant' ? `${o.nom} ${o.prenoms}` : vue === 'salle' ? labelSalle(o) : o.nom;
  const cibleNom = (() => { const o = listeCible.find((x) => String(x.id) === String(cibleId)); return o ? labelCible(o) : ''; })();

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeIn}
    >
      <div className="page-head no-print">
        <motion.div variants={fadeInUp}>
          <p>Visualisation par groupe, enseignant ou salle — du {lundi.toLocaleDateString('fr-FR')} au {samedi.toLocaleDateString('fr-FR')}.</p>
        </motion.div>
        {peutGerer && (
          <motion.div className="row" style={{ gap: 8 }} variants={fadeInUp}>
            {vue === 'groupe' && (
              <button className="btn btn-ghost" onClick={genererAuto} disabled={genLoading || !cibleId}
                title="Générer automatiquement l'emploi du temps de ce groupe (algorithme d'optimisation)">
                <Icon.calendar width={16} height={16} /> {genLoading ? 'Génération…' : 'Générer automatiquement'}
              </button>
            )}
            <button className="btn btn-primary" onClick={() => setForm(nouvelleSeance(lundi))}>
              <Icon.plus width={16} height={16} /> Planifier une séance
            </button>
          </motion.div>
        )}
      </div>

      <motion.div className="toolbar no-print" variants={fadeInUp}>
        <select className="select" style={{ maxWidth: 180 }} value={vue} onChange={(e) => setVue(e.target.value)}>
          <option value="groupe">Par groupe</option>
          <option value="enseignant">Par enseignant</option>
          <option value="salle">Par salle</option>
        </select>
        <select className="select" style={{ maxWidth: 280 }} value={cibleId} onChange={(e) => setCibleId(e.target.value)}>
          {listeCible.map((o) => <option key={o.id} value={o.id}>{labelCible(o)}</option>)}
        </select>
        <div className="spacer" />
        <motion.button 
          className="btn btn-ghost btn-sm" 
          onClick={() => setLundi(ajouter(lundi, -7))}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ‹ Semaine précédente
        </motion.button>
        <motion.button 
          className="btn btn-ghost btn-sm" 
          onClick={() => setLundi(lundiDe(new Date()))}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Aujourd'hui
        </motion.button>
        <motion.button 
          className="btn btn-ghost btn-sm" 
          onClick={() => setLundi(ajouter(lundi, 7))}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Semaine prochaine ›
        </motion.button>
        <motion.button 
          className="btn btn-ghost btn-sm" 
          onClick={() => window.print()} 
          title="Imprimer l'emploi du temps de la semaine"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Icon.print width={15} height={15} /> Imprimer
        </motion.button>
      </motion.div>

      {!loading && (
        <FeuilleImpression
          vue={vue}
          cibleNom={cibleNom}
          groupe={vue === 'groupe' ? listeCible.find((x) => String(x.id) === String(cibleId)) : null}
          annee={(refs.annees.find((a) => a.active) || refs.annees[0])?.libelle || ''}
          salles={[...new Set(seances.map((s) => labelSalle(s.salle)).filter(Boolean))]}
          lundi={lundi}
          samedi={samedi}
          parJour={parJour}
        />
      )}

      {loading ? <Loading /> : (
        <motion.div 
          className="edt-grid no-print" 
          style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {JOURS.map((j, i) => (
            <motion.div 
              className="cell edt-head" 
              key={`h${i}`}
              variants={fadeInUp}
            >
              {j}<br /><span style={{ fontWeight: 400, fontSize: 11 }}>{ajouter(lundi, i).getDate()}/{ajouter(lundi, i).getMonth() + 1}</span>
            </motion.div>
          ))}
          {JOURS.map((j, i) => (
            <motion.div 
              className="cell" 
              key={`c${i}`} 
              style={{ minHeight: 220 }}
              variants={fadeIn}
            >
              <AnimatePresence>
                {parJour[i].length === 0 ? (
                  <motion.div 
                    className="muted" 
                    style={{ fontSize: 11, textAlign: 'center', paddingTop: 16 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    —
                  </motion.div>
                ) : (
                  parJour[i].map((s, idx) => (
                    <motion.div 
                      key={s.id} 
                      className={`edt-event t-${s.typeSeance}`}
                      onClick={() => peutGerer && setForm(toForm(s))} 
                      title={peutGerer ? 'Cliquer pour modifier' : ''}
                      variants={eventVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ delay: idx * 0.03 }}
                      whileHover={{ scale: 1.02, boxShadow: '0 4px 15px rgba(0,0,0,0.12)' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <strong>{hhmm(s.heureDebut)}–{hhmm(s.heureFin)}</strong>
                      <span>{s.matiere?.nom}</span>
                      <div className="ev-meta">
                        {vue !== 'enseignant' && s.enseignant && <div>{s.enseignant.nom} {s.enseignant.prenoms}</div>}
                        {vue !== 'salle' && s.salle && <div><Icon.pin width={13} height={13} style={{ verticalAlign: '-2px' }} /> {labelSalle(s.salle)}</div>}
                        {vue !== 'groupe' && s.groupe && <div><Icon.groupe width={13} height={13} style={{ verticalAlign: '-2px' }} /> {s.groupe.nom}</div>}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {form && (
          <SeanceForm refs={refs} valeur={form} onClose={() => setForm(null)} onSaved={() => { setForm(null); charger(); }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {genResult && (
          <GenerationModal
            result={genResult}
            groupeId={cibleId}
            groupeNom={cibleNom}
            lundi={lundi}
            onClose={() => setGenResult(null)}
            onApplied={() => { setGenResult(null); charger(); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Revue de la proposition générée avant application.
function GenerationModal({ result, groupeId, groupeNom, lundi, onClose, onApplied }) {
  const toast = useToast();
  const [recurrent, setRecurrent] = useState(true);
  const [remplacer, setRemplacer] = useState(false);
  const [busy, setBusy] = useState(false);

  async function appliquer() {
    setBusy(true);
    try {
      const { data } = await api.post('/seances/appliquer', {
        groupeId: Number(groupeId),
        lundi: iso(lundi),
        recurrent,
        remplacer,
        propositions: result.propositions,
      });
      toast.success(`${data.creees} séance(s) créée(s)${data.ignorees?.length ? `, ${data.ignorees.length} ignorée(s) pour conflit` : ''}.`);
      onApplied();
    } catch (e) {
      toast.error(messageErreur(e, "Échec de l'application."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      wide
      title={`Proposition d'emploi du temps — ${groupeNom}`}
      onClose={onClose}
      footer={
        <>
          <motion.button 
            className="btn btn-ghost" 
            onClick={onClose} 
            disabled={busy}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
          >
            Annuler
          </motion.button>
          <motion.button 
            className="btn btn-primary" 
            onClick={appliquer} 
            disabled={busy || result.propositions.length === 0}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
          >
            {busy ? 'Application…' : 'Appliquer'}
          </motion.button>
        </>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="muted" style={{ marginTop: 0 }}>
          Générée par optimisation sous contraintes (aucun conflit, disponibilités respectées).
          Rien n'est enregistré tant que vous n'avez pas cliqué sur « Appliquer ».
        </p>

        <div className="table-wrap" style={{ maxHeight: 320, overflowY: 'auto' }}>
          <table className="data">
            <thead>
              <tr><th>Jour</th><th>Horaire</th><th>Matière</th><th>Enseignant</th><th>Salle</th></tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {result.propositions.map((p, i) => (
                  <motion.tr 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <td>{p.jour}</td>
                    <td className="nowrap">{p.heureDebut} – {p.heureFin}</td>
                    <td><strong>{p.matiereNom}</strong></td>
                    <td>{p.enseignantNom}</td>
                    <td>{p.salleNom}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {result.nonPlacees.length > 0 && (
          <motion.div 
            className="alert alert-warn" 
            style={{ marginTop: 12 }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <strong><Icon.warning width={15} height={15} /> {result.nonPlacees.length} matière(s) non placée(s)</strong>
            <ul>{result.nonPlacees.map((n, i) => <li key={i}>{n}</li>)}</ul>
            <div style={{ fontSize: 12 }}>Ajoutez des créneaux de disponibilité, des salles ou des enseignants, puis relancez.</div>
          </motion.div>
        )}

        <div className="row" style={{ gap: 18, marginTop: 14, flexWrap: 'wrap' }}>
          <motion.label 
            className="row" 
            style={{ gap: 6, alignItems: 'center', cursor: 'pointer' }}
            whileHover={{ scale: 1.02 }}
          >
            <input type="checkbox" checked={recurrent} onChange={(e) => setRecurrent(e.target.checked)} />
            <span>Répéter chaque semaine (jusqu'à la fin de l'année)</span>
          </motion.label>
          <motion.label 
            className="row" 
            style={{ gap: 6, alignItems: 'center', cursor: 'pointer' }}
            whileHover={{ scale: 1.02 }}
          >
            <input type="checkbox" checked={remplacer} onChange={(e) => setRemplacer(e.target.checked)} />
            <span style={{ color: 'var(--danger)' }}>Remplacer l'emploi du temps existant du groupe</span>
          </motion.label>
        </div>
      </motion.div>
    </Modal>
  );
}

// Feuille imprimable
function FeuilleImpression({ vue, cibleNom, groupe, annee, salles, lundi, samedi, parJour }) {
  const colonnes = EP_JOURS.map((_, i) => colonneDuJour(parJour[i]));
  const salleAffichee = vue === 'salle' ? cibleNom : salles.join(' / ');

  // Division (A / B…) : dernière lettre isolée du nom du groupe, sinon aucune (niveau non divisé).
  const dernierMot = String(groupe?.nom || '').trim().split(/\s+/).pop();
  const division = /^[A-Za-z]$/.test(dernierMot) ? dernierMot.toUpperCase() : null;

  return (
    <div className="edt-print" aria-hidden="true">
      <div className="ep-header">
        <div className="ep-left">
          {vue === 'groupe' ? (
            <>
              <div>MENTION : {groupe?.filiere?.nom || '—'}</div>
              <div>PARCOURS : {groupe?.parcours?.nom || 'TRONC COMMUN'}</div>
              <div>NIVEAU : {groupe?.niveau?.nom || '—'}{division && <span style={{ marginLeft: 24 }}>GROUPE : {division}</span>}</div>
            </>
          ) : vue === 'enseignant' ? (
            <div>ENSEIGNANT : {cibleNom}</div>
          ) : (
            <div>SALLE : {cibleNom}</div>
          )}
        </div>
        <div className="ep-center">
          <div className="ep-annee">ANNÉE UNIVERSITAIRE : {annee}</div>
          <div className="ep-title">EMPLOI DU TEMPS</div>
          <div className="ep-week">
            Semaine du {lundi.toLocaleDateString('fr-FR')} au {samedi.toLocaleDateString('fr-FR')}
          </div>
        </div>
        <div className="ep-right">
          {salleAffichee && <div className="ep-salle">SALLE {salleAffichee}</div>}
        </div>
      </div>

      <table className="ep-table">
        <thead>
          <tr>
            <th className="ep-hr">HORAIRES</th>
            {EP_JOURS.map((j) => <th key={j}>{j}</th>)}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: EP_NB }).map((_, r) => (
            <tr key={r}>
              <th className="ep-hr">{`${EP_DEBUT + r}h00 - ${EP_DEBUT + r + 1}h00`}</th>
              {colonnes.map((col, ci) => {
                const cell = col[r];
                if (cell.type === 'couverte') return null;
                if (cell.type === 'debut') {
                  const s = cell.seance;
                  const bg = couleurMatiere(s.matiere);
                  return (
                    <td key={ci} rowSpan={cell.span} className="ep-course" style={{ background: bg, color: texteSur(bg) }}>
                      <div className="ep-course-nom">{s.matiere?.nom}</div>
                      {s.enseignant && (
                        <div className="ep-course-ens">{s.enseignant.nom} {s.enseignant.prenoms || ''}</div>
                      )}
                    </td>
                  );
                }
                return <td key={ci} className="ep-empty" />;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SeanceForm({ refs, valeur, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState(valeur);
  const [conflits, setConflits] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sallesDispo, setSallesDispo] = useState([]);
  const [effectif, setEffectif] = useState(0);

  const jour = jourNomDe(f.dateCours);

  const dansPeriode = (d, dateStr) => {
    if (!dateStr) return true;
    const dd = d.dateDebut ? String(d.dateDebut).slice(0, 10) : null;
    const df = d.dateFin ? String(d.dateFin).slice(0, 10) : null;
    return (!dd || dateStr >= dd) && (!df || dateStr <= df);
  };

  // Créneaux de disponibilité de l'enseignant pour le jour ET la période de la date choisie.
  const creneauxDe = (ensId) => refs.dispos.filter((d) =>
    String(d.enseignantId) === String(ensId) && d.jourSemaine === jour && d.disponible && dansPeriode(d, f.dateCours));

  const enseignePar = (e) => (e.matieresIds || []).map(String).includes(String(f.matiereId));

  // Enseignants qui enseignent la matière choisie ET sont disponibles ce jour-là
  // (on garde aussi l'enseignant déjà sélectionné, utile en modification).
  const enseignantsDispo = refs.enseignants.filter((e) =>
    String(e.id) === String(f.enseignantId) || (f.matiereId && enseignePar(e) && creneauxDe(e.id).length > 0));

  // Fenêtre(s) de disponibilité de l'enseignant sélectionné (pour guider les heures saisies).
  const fenetre = f.enseignantId ? creneauxDe(f.enseignantId) : [];

  // La matière porte déjà filière + niveau : le groupe se limite à la division (A / B) de cette classe.
  const matiere = refs.matieres.find((m) => String(m.id) === String(f.matiereId));
  const divGroupe = (nom) => { const last = String(nom || '').trim().split(/\s+/).pop(); return /^[A-Za-z]$/.test(last) ? last : nom; };
  const groupesPourMatiere = matiere
    ? refs.groupes.filter((g) => String(g.filiereId) === String(matiere.filiereId) && String(g.niveauId) === String(matiere.niveauId))
    : [];

  function setMatiere(v) {
    setConflits(null);
    // Si la filière+niveau de la matière n'a qu'un seul groupe (niveau non divisé), on le sélectionne d'office.
    const m = refs.matieres.find((x) => String(x.id) === String(v));
    const grps = m ? refs.groupes.filter((g) => String(g.filiereId) === String(m.filiereId) && String(g.niveauId) === String(m.niveauId)) : [];
    setF((s) => ({
      ...s, matiereId: v, enseignantId: '', heureDebut: '', heureFin: '',
      groupeId: grps.length === 1 ? String(grps[0].id) : '',
    }));
  }

  function setDate(v) {
    setConflits(null);
    setF((s) => ({ ...s, dateCours: v, enseignantId: '', heureDebut: '', heureFin: '' }));
  }

  function setEnseignant(v) {
    setConflits(null);
    setF((s) => {
      const cr = v ? creneauxDe(v)[0] : null;
      // Par défaut on propose la fenêtre de dispo ; l'utilisateur peut ensuite réduire les heures.
      return { ...s, enseignantId: v, heureDebut: cr ? hhmm(cr.heureDebut) : '', heureFin: cr ? hhmm(cr.heureFin) : '' };
    });
  }

  const set = (k, v) => { setF((s) => ({ ...s, [k]: v })); setConflits(null); };

  // Propose automatiquement les salles libres et assez grandes dès que date + heures + groupe sont connus.
  useEffect(() => {
    if (!f.dateCours || !f.heureDebut || !f.heureFin || !f.groupeId) { setSallesDispo([]); return; }
    let annule = false;
    api.get('/seances/salles-disponibles', {
      params: {
        date: f.dateCours, debut: `${f.heureDebut}:00`, fin: `${f.heureFin}:00`,
        groupeId: f.groupeId, exclureId: f.id || undefined,
      },
    }).then(({ data }) => {
      if (annule) return;
      const dispo = Array.isArray(data?.salles) ? data.salles : [];
      setSallesDispo(dispo);
      setEffectif(data?.effectif ?? 0);
      setF((s) => (dispo.some((x) => String(x.id) === String(s.salleId))
        ? s : { ...s, salleId: dispo[0] ? String(dispo[0].id) : '' }));
    }).catch(() => { if (!annule) setSallesDispo([]); });
    return () => { annule = true; };
  }, [f.dateCours, f.heureDebut, f.heureFin, f.groupeId, f.id]);

  function payload() {
    return {
      dateCours: f.dateCours,
      heureDebut: f.heureDebut.length === 5 ? `${f.heureDebut}:00` : f.heureDebut,
      heureFin: f.heureFin.length === 5 ? `${f.heureFin}:00` : f.heureFin,
      typeSeance: f.typeSeance,
      matiereId: Number(f.matiereId),
      enseignantId: Number(f.enseignantId),
      salleId: Number(f.salleId),
      groupeId: Number(f.groupeId),
    };
  }

  async function enregistrer(forcer = false) {
    if (!f.matiereId) { toast.error('Sélectionnez une matière.'); return; }
    if (!f.enseignantId || !f.heureDebut) { toast.error('Sélectionnez une date puis un enseignant disponible.'); return; }
    if (!f.heureFin || minutesEntre(f.heureDebut, f.heureFin) < 60) { toast.error('Un cours doit durer au moins 1 heure.'); return; }
    if (!f.salleId) { toast.error('Sélectionnez une salle.'); return; }
    if (!f.groupeId) { toast.error('Sélectionnez un groupe.'); return; }
    setBusy(true);
    setConflits(null);
    try {
      if (f.id) {
        const params = { forcer };
        if (f.finSerie) params.tronquerSerieApres = f.finSerie;
        await api.put(`/seances/${f.id}`, payload(), { params });
        toast.success('Séance modifiée.');
      } else {
        const params = { forcer, recurrent: true };
        if (f.dateFin) params.dateFin = f.dateFin;
        const { data } = await api.post('/seances', payload(), { params });
        toast.success(`${data.creees} séance(s) planifiée(s)${data.ignorees?.length ? `, ${data.ignorees.length} ignorée(s) pour conflit` : ''}.`);
      }
      onSaved();
    } catch (err) {
      if (err.response?.status === 409 && err.response.data?.conflits) setConflits(err.response.data.conflits);
      else toast.error(messageErreur(err, "Échec de l'enregistrement."));
    } finally {
      setBusy(false);
    }
  }

  async function supprimer(serieEntiere = false) {
    setBusy(true);
    try {
      await api.delete(`/seances/${f.id}`, { params: { serieEntiere } });
      toast.success(serieEntiere ? 'Série supprimée.' : 'Séance supprimée.');
      onSaved();
    } catch (err) {
      toast.error(messageErreur(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      wide
      title={f.id ? 'Modifier la séance' : 'Planifier une séance'}
      onClose={onClose}
      footer={
        <>
          {f.id && (
            <motion.button 
              className="btn btn-danger" 
              onClick={() => supprimer(false)} 
              disabled={busy} 
              style={{ marginRight: 'auto' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
            >
              Supprimer
            </motion.button>
          )}
          <motion.button 
            className="btn btn-ghost" 
            onClick={onClose} 
            disabled={busy}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
          >
            Annuler
          </motion.button>
          <motion.button
            className="btn btn-primary"
            onClick={() => enregistrer(false)}
            disabled={busy}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
          >
            {busy ? 'Vérification…' : 'Enregistrer'}
          </motion.button>
        </>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <motion.div 
            style={{ gridColumn: '1 / -1' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Field label="Matière" required>
              <select className="select" value={f.matiereId} onChange={(e) => setMatiere(e.target.value)} required>
                <option value="">— Sélectionner —</option>
                {refs.matieres.map((m) => <option key={m.id} value={m.id}>{m.codeMatiere} — {m.nom} · {m.filiere?.nom} {m.niveau?.nom}</option>)}
              </select>
            </Field>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Field label="Date" required hint={!f.id ? 'Au moins demain. La séance se répète chaque semaine.' : 'Au moins demain.'}>
              <input className="input" type="date" min={demainIso()} value={f.dateCours} onChange={(e) => setDate(e.target.value)} required />
            </Field>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Field label="Type" required>
              <select className="select" value={f.typeSeance} onChange={(e) => set('typeSeance', e.target.value)}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </motion.div>

          <motion.div
            style={{ gridColumn: '1 / -1' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Field label="Enseignant (de la matière, disponible ce jour)" required
              hint={!f.matiereId ? 'Choisissez d\'abord la matière.' : !f.dateCours ? 'Choisissez la date.' : `${enseignantsDispo.length} enseignant(s) de cette matière disponible(s) le ${jour}.`}>
              <select className="select" value={f.enseignantId} onChange={(e) => setEnseignant(e.target.value)} disabled={!f.matiereId || !f.dateCours} required>
                <option value="">— Sélectionner —</option>
                {enseignantsDispo.map((o) => <option key={o.id} value={o.id}>{o.nom} {o.prenoms}</option>)}
              </select>
            </Field>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Field label="Heure de début" required
              hint={fenetre.length ? `Disponible : ${fenetre.map((c) => `${hhmm(c.heureDebut)}–${hhmm(c.heureFin)}`).join(', ')}` : 'Choisissez l\'enseignant.'}>
              <input className="input" type="time" min="07:00" max="18:30" value={f.heureDebut} disabled={!f.enseignantId}
                onChange={(e) => set('heureDebut', e.target.value)} required />
            </Field>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Field label="Heure de fin" required hint="Ajustez selon la durée réelle du cours.">
              <input className="input" type="time" min="07:00" max="18:30" value={f.heureFin} disabled={!f.enseignantId}
                onChange={(e) => set('heureFin', e.target.value)} required />
            </Field>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Field label="Groupe / classe" required
              hint={!f.matiereId ? 'Choisissez d\'abord la matière.'
                : groupesPourMatiere.length ? `Division (A / B) de ${matiere.filiere?.nom} ${matiere.niveau?.nom}.`
                : 'Aucun groupe pour cette filière et ce niveau.'}>
              <select className="select" value={f.groupeId} onChange={(e) => set('groupeId', e.target.value)} disabled={!f.matiereId} required>
                <option value="">— Sélectionner —</option>
                {groupesPourMatiere.map((o) => <option key={o.id} value={o.id}>{divGroupe(o.nom)}</option>)}
              </select>
            </Field>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Field label="Salle (proposée automatiquement)" required
              hint={!f.groupeId || !f.heureDebut || !f.heureFin ? 'Choisissez le groupe et les heures.'
                : sallesDispo.length ? `${sallesDispo.length} salle(s) libre(s) pour ${effectif} étudiant(s).`
                : 'Aucune salle libre assez grande à ce créneau.'}>
              <select className="select" value={f.salleId} onChange={(e) => set('salleId', e.target.value)} required disabled={!sallesDispo.length}>
                <option value="">— Sélectionner —</option>
                {sallesDispo.map((o) => (
                  <option key={o.id} value={o.id}>
                    {(o.numero || o.nom)}{o.batiment ? ` — ${o.batiment.nom}` : ''} ({o.capacite} pl.)
                  </option>
                ))}
              </select>
            </Field>
          </motion.div>

          {!f.id && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Field label="Fin de la répétition (optionnel)" hint="Sans date, la séance se répète jusqu'à la fin de l'année académique.">
                <input className="input" type="date" min={f.dateCours || demainIso()} value={f.dateFin || ''} onChange={(e) => set('dateFin', e.target.value)} />
              </Field>
            </motion.div>
          )}
          {f.id && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Field label="Fin de série après le (optionnel)" hint="Supprime les occurrences suivantes de la même série.">
                <input className="input" type="date" value={f.finSerie || ''} onChange={(e) => set('finSerie', e.target.value)} />
              </Field>
            </motion.div>
          )}
        </div>
      </motion.div>

      {conflits && (
        <ConflitModal conflits={conflits} onCorriger={() => setConflits(null)} />
      )}
    </Modal>
  );
}

function nouvelleSeance(lundi) {
  const base = ajouter(new Date(), 1);
  const d = base > lundi ? base : lundi;
  return {
    dateCours: iso(d), heureDebut: '', heureFin: '', typeSeance: 'Cours',
    matiereId: '', enseignantId: '', salleId: '', groupeId: '', dateFin: '',
  };
}

function toForm(s) {
  return {
    id: s.id, dateCours: String(s.dateCours).slice(0, 10),
    heureDebut: hhmm(s.heureDebut), heureFin: hhmm(s.heureFin), typeSeance: s.typeSeance,
    matiereId: String(s.matiereId), enseignantId: String(s.enseignantId),
    salleId: String(s.salleId), groupeId: String(s.groupeId), finSerie: '',
  };
}