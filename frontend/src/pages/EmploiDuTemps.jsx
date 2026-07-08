import { useEffect, useMemo, useState } from 'react';
import api, { messageErreur } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../lib/toast';
import Icon from '../lib/icons';
import { Field, Loading, Modal } from '../components/ui';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const NOMS_JOUR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const TYPES = ['Cours', 'TD', 'TP'];

const lundiDe = (d) => {
  const x = new Date(d);
  const j = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - j);
  x.setHours(0, 0, 0, 0);
  return x;
};
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const hhmm = (t) => (t ? String(t).slice(0, 5) : '');
const ajouter = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const jourNomDe = (dateStr) => (dateStr ? NOMS_JOUR[new Date(dateStr).getDay()] : '');
const demainIso = () => iso(ajouter(new Date(), 1));

// ---------- Feuille d'impression (format institutionnel) ----------
const EP_JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
const EP_DEBUT = 7;   // première tranche : 7h - 8h
const EP_NB = 11;     // 11 tranches horaires jusqu'à 18h
const EP_PALETTE = ['#f4c33f', '#e6a0c4', '#bfe5cc', '#4caf7d', '#5c6e57', '#f6b8a0', '#3f6d84', '#9fb8c4', '#c8b6e2', '#d8c07a'];

// Couleur stable déduite de la matière (même matière => même couleur).
function couleurMatiere(m) {
  if (!m) return '#e5e7eb';
  const s = String(m.id ?? m.nom ?? '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return EP_PALETTE[h % EP_PALETTE.length];
}
// Texte noir ou blanc selon la luminosité du fond, pour rester lisible.
function texteSur(bg) {
  const c = bg.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#1f2937' : '#ffffff';
}

// Construit, pour un jour, la liste des N tranches : vide / début de séance (avec span) / couverte par un span.
function colonneDuJour(seancesJour) {
  const col = Array.from({ length: EP_NB }, () => ({ type: 'vide' }));
  (seancesJour || []).forEach((s) => {
    const hd = parseInt(hhmm(s.heureDebut).slice(0, 2), 10);
    const mf = parseInt(hhmm(s.heureFin).slice(3, 5), 10);
    const hf = parseInt(hhmm(s.heureFin).slice(0, 2), 10);
    const debut = Math.max(0, hd - EP_DEBUT);
    const fin = Math.min(EP_NB, hf - EP_DEBUT + (mf > 0 ? 1 : 0)); // arrondi à l'heure supérieure
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

  useEffect(() => { if (refs) charger(); /* eslint-disable-next-line */ }, [vue, cibleId, lundi, refs]);

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
  const labelCible = (o) => vue === 'enseignant' ? `${o.nom} ${o.prenoms}` : o.nom;
  const cibleNom = (() => { const o = listeCible.find((x) => String(x.id) === String(cibleId)); return o ? labelCible(o) : ''; })();

  return (
    <>
      <div className="page-head no-print">
        <div>
          <p>Visualisation par groupe, enseignant ou salle — du {lundi.toLocaleDateString('fr-FR')} au {samedi.toLocaleDateString('fr-FR')}.</p>
        </div>
        {peutGerer && (
          <button className="btn btn-primary" onClick={() => setForm(nouvelleSeance(lundi))}>
            <Icon.plus width={16} height={16} /> Planifier une séance
          </button>
        )}
      </div>

      <div className="toolbar no-print">
        <select className="select" style={{ maxWidth: 180 }} value={vue} onChange={(e) => setVue(e.target.value)}>
          <option value="groupe">Par groupe</option>
          <option value="enseignant">Par enseignant</option>
          <option value="salle">Par salle</option>
        </select>
        <select className="select" style={{ maxWidth: 280 }} value={cibleId} onChange={(e) => setCibleId(e.target.value)}>
          {listeCible.map((o) => <option key={o.id} value={o.id}>{labelCible(o)}</option>)}
        </select>
        <div className="spacer" />
        <button className="btn btn-ghost btn-sm" onClick={() => setLundi(ajouter(lundi, -7))}>‹ Semaine précédente</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setLundi(lundiDe(new Date()))}>Aujourd'hui</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setLundi(ajouter(lundi, 7))}>Semaine prochaine ›</button>
        <button className="btn btn-ghost btn-sm" onClick={() => window.print()} title="Imprimer l'emploi du temps de la semaine">
          <Icon.print width={15} height={15} /> Imprimer
        </button>
      </div>

      {!loading && (
        <FeuilleImpression
          vue={vue}
          cibleNom={cibleNom}
          groupe={vue === 'groupe' ? listeCible.find((x) => String(x.id) === String(cibleId)) : null}
          annee={(refs.annees.find((a) => a.active) || refs.annees[0])?.libelle || ''}
          salles={[...new Set(seances.map((s) => s.salle?.nom).filter(Boolean))]}
          lundi={lundi}
          samedi={samedi}
          parJour={parJour}
        />
      )}

      {loading ? <Loading /> : (
        <div className="edt-grid no-print" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
          {JOURS.map((j, i) => (
            <div className="cell edt-head" key={`h${i}`}>
              {j}<br /><span style={{ fontWeight: 400, fontSize: 11 }}>{ajouter(lundi, i).getDate()}/{ajouter(lundi, i).getMonth() + 1}</span>
            </div>
          ))}
          {JOURS.map((j, i) => (
            <div className="cell" key={`c${i}`} style={{ minHeight: 220 }}>
              {parJour[i].length === 0 ? <div className="muted" style={{ fontSize: 11, textAlign: 'center', paddingTop: 16 }}>—</div> :
                parJour[i].map((s) => (
                  <div key={s.id} className={`edt-event t-${s.typeSeance}`}
                    onClick={() => peutGerer && setForm(toForm(s))} title={peutGerer ? 'Cliquer pour modifier' : ''}>
                    <strong>{hhmm(s.heureDebut)}–{hhmm(s.heureFin)}</strong>
                    <span>{s.matiere?.nom}</span>
                    <div className="ev-meta">
                      {vue !== 'enseignant' && s.enseignant && <div>{s.enseignant.nom} {s.enseignant.prenoms}</div>}
                      {vue !== 'salle' && s.salle && <div>📍 {s.salle.nom}</div>}
                      {vue !== 'groupe' && s.groupe && <div>👥 {s.groupe.nom}</div>}
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}

      {form && (
        <SeanceForm refs={refs} valeur={form} onClose={() => setForm(null)} onSaved={() => { setForm(null); charger(); }} />
      )}
    </>
  );
}

// Feuille imprimable : matrice horaires (lignes) × jours (colonnes), au format institutionnel.
function FeuilleImpression({ vue, cibleNom, groupe, annee, salles, lundi, samedi, parJour }) {
  const colonnes = EP_JOURS.map((_, i) => colonneDuJour(parJour[i]));
  const salleAffichee = vue === 'salle' ? cibleNom : salles.join(' / ');

  return (
    <div className="edt-print" aria-hidden="true">
      <div className="ep-header">
        <div className="ep-left">
          {vue === 'groupe' ? (
            <>
              <div>MENTION : {groupe?.filiere?.nom || '—'}</div>
              <div>PARCOURS : {groupe?.parcours?.nom || 'TRONC COMMUN'}</div>
              <div>NIVEAU : {groupe?.niveau?.nom || '—'}</div>
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

  const jour = jourNomDe(f.dateCours);

  // Créneau de disponibilité de l'enseignant pour le jour choisi.
  const creneauDe = (ensId) => refs.dispos.find((d) =>
    String(d.enseignantId) === String(ensId) && d.jourSemaine === jour && d.disponible);

  // Enseignants disponibles le jour de la date sélectionnée.
  const enseignantsDispo = refs.enseignants.filter((e) => !!creneauDe(e.id));

  function appliquerHeures(next) {
    const cr = next.enseignantId ? creneauDe(next.enseignantId) : null;
    next.heureDebut = cr ? hhmm(cr.heureDebut) : '';
    next.heureFin = cr ? hhmm(cr.heureFin) : '';
    return next;
  }

  function setDate(v) {
    setConflits(null);
    setF((s) => {
      const next = { ...s, dateCours: v };
      // Si l'enseignant n'est plus disponible ce jour-là, on le réinitialise.
      const nj = jourNomDe(v);
      const cr = next.enseignantId && refs.dispos.find((d) => String(d.enseignantId) === String(next.enseignantId) && d.jourSemaine === nj && d.disponible);
      if (!cr) { next.enseignantId = ''; next.heureDebut = ''; next.heureFin = ''; }
      else { next.heureDebut = hhmm(cr.heureDebut); next.heureFin = hhmm(cr.heureFin); }
      return next;
    });
  }

  function setEnseignant(v) {
    setConflits(null);
    setF((s) => appliquerHeures({ ...s, enseignantId: v }));
  }

  const set = (k, v) => { setF((s) => ({ ...s, [k]: v })); setConflits(null); };

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
    if (!f.enseignantId || !f.heureDebut) { toast.error('Sélectionnez une date puis un enseignant disponible.'); return; }
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
          {f.id && <button className="btn btn-danger" onClick={() => supprimer(false)} disabled={busy} style={{ marginRight: 'auto' }}>Supprimer</button>}
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Annuler</button>
          {conflits
            ? <button className="btn btn-danger" onClick={() => enregistrer(true)} disabled={busy}>Forcer l'enregistrement</button>
            : <button className="btn btn-primary" onClick={() => enregistrer(false)} disabled={busy}>{busy ? 'Vérification…' : 'Enregistrer'}</button>}
        </>
      }
    >
      {conflits && (
        <div className="alert alert-warn">
          <strong><Icon.warning width={15} height={15} /> Conflit(s) détecté(s)</strong>
          <ul>{conflits.map((c, i) => <li key={i}>{c.message}</li>)}</ul>
          <div style={{ marginTop: 6, fontSize: 12 }}>Corrigez les informations ou forcez l'enregistrement.</div>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Matière" required>
            <select className="select" value={f.matiereId} onChange={(e) => set('matiereId', e.target.value)} required>
              <option value="">— Sélectionner —</option>
              {refs.matieres.map((m) => <option key={m.id} value={m.id}>{m.codeMatiere} — {m.nom}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Date" required hint={!f.id ? 'Au moins demain. La séance se répète chaque semaine.' : 'Au moins demain.'}>
          <input className="input" type="date" min={demainIso()} value={f.dateCours} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field label="Type" required>
          <select className="select" value={f.typeSeance} onChange={(e) => set('typeSeance', e.target.value)}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>

        <Field label="Enseignant (disponible ce jour)" required hint={f.dateCours ? `${enseignantsDispo.length} disponible(s) le ${jour}.` : 'Choisissez d\'abord la date.'}>
          <select className="select" value={f.enseignantId} onChange={(e) => setEnseignant(e.target.value)} disabled={!f.dateCours} required>
            <option value="">— Sélectionner —</option>
            {enseignantsDispo.map((o) => <option key={o.id} value={o.id}>{o.nom} {o.prenoms}</option>)}
          </select>
        </Field>
        <Field label="Horaire (selon disponibilité)" hint="Déterminé automatiquement par l'enseignant.">
          <input className="input" type="text" readOnly value={f.heureDebut && f.heureFin ? `${f.heureDebut} – ${f.heureFin}` : '—'} />
        </Field>

        <Field label="Salle" required>
          <select className="select" value={f.salleId} onChange={(e) => set('salleId', e.target.value)} required>
            <option value="">— Sélectionner —</option>
            {refs.salles.map((o) => <option key={o.id} value={o.id}>{o.nom} ({o.capacite} pl.)</option>)}
          </select>
        </Field>
        <Field label="Nom du groupe" required>
          <select className="select" value={f.groupeId} onChange={(e) => set('groupeId', e.target.value)} required>
            <option value="">— Sélectionner —</option>
            {refs.groupes.map((o) => <option key={o.id} value={o.id}>{o.nom}</option>)}
          </select>
        </Field>

        {!f.id && (
          <Field label="Fin de la répétition (optionnel)" hint="Sans date, la séance se répète jusqu'à la fin de l'année académique.">
            <input className="input" type="date" min={f.dateCours || demainIso()} value={f.dateFin || ''} onChange={(e) => set('dateFin', e.target.value)} />
          </Field>
        )}
        {f.id && (
          <Field label="Fin de série après le (optionnel)" hint="Supprime les occurrences suivantes de la même série.">
            <input className="input" type="date" value={f.finSerie || ''} onChange={(e) => set('finSerie', e.target.value)} />
          </Field>
        )}
      </div>
    </Modal>
  );
}

function nouvelleSeance(lundi) {
  // Première date proposée : au moins demain.
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
