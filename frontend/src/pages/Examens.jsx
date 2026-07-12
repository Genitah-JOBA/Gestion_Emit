import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import api, { messageErreur } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../lib/toast';
import Icon from '../lib/icons';
import { ConflitModal, Confirm, Empty, Field, Loading, Modal, Tag } from '../components/ui';
import { appliquerMask, capitaliserMots } from '../components/CrudResource';

// Nom de surveillant : lettres/espaces/tirets uniquement (blocage automatique) + capitalisation.
const maskNom = (v) => capitaliserMots(appliquerMask('letters', v));

const SESSIONS = ['Normale', 'Rattrapage'];
// Nom par défaut du chef de service de la Scolarité (repris de l'avis officiel) si l'utilisateur n'en saisit pas.
const CHEF_DEFAUT = 'RAKOTOARISOA Rindra Heliosa Bakoliniaina';
const pad2 = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const demainIso = () => { const d = new Date(); d.setDate(d.getDate() + 1); return iso(d); };
const hhmm = (t) => (t ? String(t).slice(0, 5) : '');
const minutesEntre = (debut, fin) => {
  const [hd, md] = String(debut).split(':').map(Number);
  const [hf, mf] = String(fin).split(':').map(Number);
  return (hf * 60 + mf) - (hd * 60 + md);
};
const nomPersonne = (p) => `${p?.nom || ''} ${p?.prenoms || ''}`.trim();
const labelSalle = (s) => (s ? `${s.numero || s.nom}${s.batiment ? ` — ${s.batiment.nom}` : ''}` : '');
const dateLongue = (d) => (d ? new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '');
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const pageVariants = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 } };

export default function Examens() {
  const { peutGerer } = useAuth();
  const toast = useToast();
  const [refs, setRefs] = useState(null);
  const [examens, setExamens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filiereId, setFiliereId] = useState('');
  const [niveauId, setNiveauId] = useState('');
  const [vue, setVue] = useState('avenir'); // 'avenir' | 'archive' (passés) | 'tous'
  const [form, setForm] = useState(null);
  const [aSupprimer, setASupprimer] = useState(null);
  const [busy, setBusy] = useState(false);

  async function charger() {
    setLoading(true);
    try {
      const [m, e, s, f, n, a, ex] = await Promise.all([
        api.get('/matieres'), api.get('/enseignants'), api.get('/salles'),
        api.get('/filieres'), api.get('/niveaux'), api.get('/anneesacademiques'),
        api.get('/examens'),
      ]);
      setRefs({ matieres: m.data, enseignants: e.data, salles: s.data, filieres: f.data, niveaux: n.data, annees: a.data });
      setExamens(ex.data);
    } catch (err) {
      toast.error(messageErreur(err));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { charger(); /* eslint-disable-next-line */ }, []);

  const filtres = useMemo(() => {
    const auj = iso(new Date());
    return examens.filter((x) => {
      if (filiereId && String(x.matiere?.filiereId) !== String(filiereId)) return false;
      if (niveauId && String(x.matiere?.niveauId) !== String(niveauId)) return false;
      const d = String(x.date).slice(0, 10);
      if (vue === 'avenir') return d >= auj;   // aujourd'hui et à venir
      if (vue === 'archive') return d < auj;   // examens passés
      return true;                             // tous
    });
  }, [examens, filiereId, niveauId, vue]);

  // Groupes (filière + niveau) pour l'impression des avis.
  const avis = useMemo(() => {
    const map = new Map();
    filtres.forEach((x) => {
      const key = `${x.matiere?.filiereId}-${x.matiere?.niveauId}`;
      if (!map.has(key)) map.set(key, { filiere: x.matiere?.filiere, niveau: x.matiere?.niveau, examens: [] });
      map.get(key).examens.push(x);
    });
    const arr = [...map.values()];
    arr.forEach((g) => g.examens.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : hhmm(a.heureDebut).localeCompare(hhmm(b.heureDebut)))));
    return arr;
  }, [filtres]);

  async function supprimer() {
    setBusy(true);
    try {
      await api.delete(`/examens/${aSupprimer.id}`);
      toast.success('Examen supprimé.');
      setASupprimer(null);
      charger();
    } catch (e) {
      toast.error(messageErreur(e));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loading />;
  const anneeActive = (refs.annees.find((a) => a.active) || refs.annees[0])?.libelle || '';

  return (
    <motion.div className="page-enter" initial="initial" animate="animate" exit="exit" variants={pageVariants}>
      <div className="examens-screen">
        <div className="page-head">
          <div><p>Planification des examens (par niveau). Sélectionnez une filière et un niveau pour imprimer l'avis.</p></div>
          {peutGerer && (
            <button className="btn btn-primary" onClick={() => setForm(nouvelExamen())}>
              <Icon.plus width={16} height={16} /> Planifier un examen
            </button>
          )}
        </div>

        <div className="toolbar">
          <div className="row" style={{ gap: 6 }}>
            <button className={`btn btn-sm ${vue === 'avenir' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setVue('avenir')}>À venir</button>
            <button className={`btn btn-sm ${vue === 'archive' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setVue('archive')}>Archive</button>
            <button className={`btn btn-sm ${vue === 'tous' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setVue('tous')}>Tous</button>
          </div>
          <select className="select" style={{ maxWidth: 220 }} value={filiereId} onChange={(e) => setFiliereId(e.target.value)}>
            <option value="">Toutes les filières</option>
            {refs.filieres.map((o) => <option key={o.id} value={o.id}>{o.nom}</option>)}
          </select>
          <select className="select" style={{ maxWidth: 160 }} value={niveauId} onChange={(e) => setNiveauId(e.target.value)}>
            <option value="">Tous les niveaux</option>
            {refs.niveaux.map((o) => <option key={o.id} value={o.id}>{o.nom}</option>)}
          </select>
          <div className="spacer" />
          <span className="muted">{filtres.length} examen(s)</span>
          <button className="btn btn-ghost btn-sm" onClick={() => window.print()} disabled={filtres.length === 0}
            title="Imprimer l'avis aux étudiants">
            <Icon.print width={15} height={15} /> Imprimer l'avis
          </button>
        </div>

        <div className="card">
          {filtres.length === 0 ? <Empty label="Aucun examen planifié." /> : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Date</th><th>Horaire</th><th>Filière / Niveau</th><th>Matière (EC)</th>
                    <th>Enseignant</th><th>Session</th><th>Salles</th>
                    {peutGerer && <th className="text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtres.map((x) => (
                    <tr key={x.id}>
                      <td className="nowrap">{cap(dateLongue(x.date))}</td>
                      <td className="nowrap">{hhmm(x.heureDebut)} – {hhmm(x.heureFin)}</td>
                      <td className="nowrap">{x.matiere?.filiere?.nom} {x.matiere?.niveau?.nom}</td>
                      <td><strong>{x.matiere?.nom}</strong></td>
                      <td>{nomPersonne(x.enseignant)}</td>
                      <td><Tag value={x.session} className={x.session === 'Rattrapage' ? 'badge-amber' : 'badge-green'} /></td>
                      <td>
                        <span className="niveaux-tags">
                          {(x.salles || []).map((es) => <Tag key={es.id} value={es.salle?.numero || es.salle?.nom} className="badge-blue" />)}
                        </span>
                      </td>
                      {peutGerer && (
                        <td className="text-right nowrap">
                          <button className="btn btn-ghost btn-sm" onClick={() => setForm(toForm(x))}><Icon.edit width={15} height={15} /></button>{' '}
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setASupprimer(x)}><Icon.trash width={15} height={15} /></button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Feuille(s) imprimable(s) : un avis par filière + niveau */}
      <div className="examens-print" aria-hidden="true">
        {avis.map((g, i) => <AvisSheet key={i} groupe={g} annee={anneeActive} />)}
      </div>

      {form && (
        <ExamenForm refs={refs} valeur={form} onClose={() => setForm(null)} onSaved={() => { setForm(null); charger(); }} />
      )}
      {aSupprimer && (
        <Confirm message={`Supprimer l'examen de « ${aSupprimer.matiere?.nom} » du ${dateLongue(aSupprimer.date)} ?`}
          onConfirm={supprimer} onCancel={() => setASupprimer(null)} loading={busy} />
      )}
    </motion.div>
  );
}

// ---------- Avis imprimable (format institutionnel) ----------
function AvisSheet({ groupe, annee }) {
  const chef = groupe.examens.map((x) => x.chefScolarite).find(Boolean) || CHEF_DEFAUT;
  return (
    <div className="avis">
      <div className="avis-entete">
        <div className="avis-etab">
          <strong>UNIVERSITÉ DE FIANARANTSOA</strong><br />
          ÉCOLE DE MANAGEMENT ET D'INNOVATION TECHNOLOGIQUE<br />
          <strong>E.M.I.T.</strong><br />
          <span className="avis-contact">renseignement@emit.mg — www.emit.mg</span>
        </div>
        <img src="/logoNoir.png" alt="EMIT" className="avis-logo" />
      </div>

      <div className="avis-annee">ANNÉE UNIVERSITAIRE : {annee}</div>
      <h1 className="avis-titre">AVIS AUX ÉTUDIANTS {groupe.filiere?.codeFiliere || groupe.filiere?.nom} {groupe.niveau?.nom}</h1>
      <div className="avis-sous">EXAMEN :</div>

      <table className="avis-table">
        <thead>
          <tr><th>DATE</th><th>HEURE</th><th>EC</th><th>ENSEIGNANT</th><th>SALLE</th><th>SESSION</th></tr>
        </thead>
        <tbody>
          {groupe.examens.map((x) => (
            <tr key={x.id}>
              <td>{cap(dateLongue(x.date))}</td>
              <td>{hhmm(x.heureDebut)} – {hhmm(x.heureFin)}</td>
              <td>{x.matiere?.nom}</td>
              <td>{nomPersonne(x.enseignant)}</td>
              <td>{(x.salles || []).map((es) => es.salle?.numero || es.salle?.nom).join(', ')}</td>
              <td>{x.session}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="avis-nb">
        <strong>NB :</strong>
        <ul>
          <li>L'appel se fera une demi-heure avant le début de l'épreuve.</li>
          <li>Se munir de la CIN, de la Carte d'étudiant et de l'attestation d'inscription durant toutes les épreuves.</li>
          <li>Le retard de plus de 15 mn est inadmissible.</li>
          <li>Veuillez respecter les consignes vestimentaires et coupe de cheveux.</li>
        </ul>
      </div>

      <div className="avis-signature">
        <div>Fait à Fianarantsoa, le {new Date().toLocaleDateString('fr-FR')}</div>
        <div className="avis-chef">Le chef de service de la Scolarité</div>
        <div className="avis-nom">{chef}</div>
      </div>
    </div>
  );
}

// ---------- Formulaire d'examen ----------
function nouvelExamen() {
  return {
    matiereId: '', date: demainIso(), heureDebut: '08:00', heureFin: '10:00',
    enseignantId: '', session: 'Normale', chefScolarite: '',
    salles: [nouvelleSalleLigne()],
  };
}
function nouvelleSalleLigne() { return { salleId: '', surveillant1: '', surveillant2: '', surveillant3: '' }; }

function toForm(x) {
  return {
    id: x.id, matiereId: String(x.matiereId), date: String(x.date).slice(0, 10),
    heureDebut: hhmm(x.heureDebut), heureFin: hhmm(x.heureFin),
    enseignantId: String(x.enseignantId), session: x.session, chefScolarite: x.chefScolarite || '',
    salles: (x.salles || []).map((es) => ({
      salleId: String(es.salleId), surveillant1: es.surveillant1 || '', surveillant2: es.surveillant2 || '', surveillant3: es.surveillant3 || '',
    })),
  };
}

function ExamenForm({ refs, valeur, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState(valeur);
  const [conflits, setConflits] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k, v) => { setF((s) => ({ ...s, [k]: v })); setConflits(null); };
  const setMatiere = (v) => setF((s) => ({ ...s, matiereId: v, enseignantId: '' }));

  // Enseignants qui enseignent la matière (sans filtre de disponibilité pour un examen).
  const enseignants = refs.enseignants.filter((e) =>
    String(e.id) === String(f.enseignantId) || (f.matiereId && (e.matieresIds || []).map(String).includes(String(f.matiereId))));

  const setSalle = (i, k, v) => { setConflits(null); setF((s) => ({ ...s, salles: s.salles.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)) })); };
  const setSurveillant = (i, k, v) => setSalle(i, k, maskNom(v));
  const ajouterSalle = () => setF((s) => ({ ...s, salles: [...s.salles, nouvelleSalleLigne()] }));
  const retirerSalle = (i) => setF((s) => ({ ...s, salles: s.salles.filter((_, idx) => idx !== i) }));

  function valider() {
    if (!f.matiereId) return 'Sélectionnez la matière.';
    if (!f.enseignantId) return 'Sélectionnez l\'enseignant.';
    if (!f.date) return 'Choisissez la date.';
    if (!f.heureDebut || !f.heureFin || f.heureFin <= f.heureDebut) return 'L\'heure de fin doit être après le début.';
    if (minutesEntre(f.heureDebut, f.heureFin) < 30) return 'Un examen doit durer au moins 30 minutes.';
    if (f.heureDebut < '07:00' || f.heureFin > '18:00') return 'Les examens ont lieu entre 07:00 et 18:00.';
    if (f.salles.length === 0) return 'Ajoutez au moins une salle.';
    for (const l of f.salles) {
      if (!l.salleId) return 'Chaque salle doit être sélectionnée.';
      if (!l.surveillant1.trim() || !l.surveillant2.trim()) return 'Chaque salle a besoin d\'au moins 2 surveillants.';
    }
    if (new Set(f.salles.map((l) => l.salleId)).size !== f.salles.length) return 'Une salle ne peut pas être choisie deux fois.';
    return null;
  }

  function payload() {
    return {
      matiereId: Number(f.matiereId), date: f.date,
      heureDebut: `${f.heureDebut}:00`, heureFin: `${f.heureFin}:00`,
      enseignantId: Number(f.enseignantId), session: f.session,
      chefScolarite: f.chefScolarite || null,
      salles: f.salles.map((l) => ({
        salleId: Number(l.salleId), surveillant1: l.surveillant1.trim(),
        surveillant2: l.surveillant2.trim(), surveillant3: l.surveillant3.trim() || null,
      })),
    };
  }

  async function enregistrer(forcer = false) {
    const err = valider();
    if (err) { toast.error(err); return; }
    setBusy(true); setConflits(null);
    try {
      if (f.id) await api.put(`/examens/${f.id}`, payload(), { params: { forcer } });
      else await api.post('/examens', payload(), { params: { forcer } });
      toast.success(f.id ? 'Examen modifié.' : 'Examen planifié.');
      onSaved();
    } catch (err) {
      if (err.response?.status === 409 && err.response.data?.conflits) setConflits(err.response.data.conflits);
      else toast.error(messageErreur(err, "Échec de l'enregistrement."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      wide
      title={f.id ? 'Modifier l\'examen' : 'Planifier un examen'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Annuler</button>
          <button className="btn btn-primary" onClick={() => enregistrer(false)} disabled={busy}>{busy ? 'Vérification…' : 'Enregistrer'}</button>
        </>
      }
    >
      {conflits && (
        <ConflitModal conflits={conflits} onCorriger={() => setConflits(null)} />
      )}

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Matière (EC)" required>
            <select className="select" value={f.matiereId} onChange={(e) => setMatiere(e.target.value)} required>
              <option value="">— Sélectionner —</option>
              {refs.matieres.map((m) => <option key={m.id} value={m.id}>{m.codeMatiere} — {m.nom} · {m.filiere?.nom} {m.niveau?.nom}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Date" required hint="Un examen ne peut pas chevaucher un cours ou un autre examen.">
          <input className="input" type="date" min={demainIso()} value={f.date} onChange={(e) => set('date', e.target.value)} required />
        </Field>
        <Field label="Session" required>
          <select className="select" value={f.session} onChange={(e) => set('session', e.target.value)}>
            {SESSIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>

        <Field label="Enseignant (de la matière)" required hint={!f.matiereId ? 'Choisissez d\'abord la matière.' : `${enseignants.length} enseignant(s) de cette matière.`}>
          <select className="select" value={f.enseignantId} onChange={(e) => set('enseignantId', e.target.value)} disabled={!f.matiereId} required>
            <option value="">— Sélectionner —</option>
            {enseignants.map((o) => <option key={o.id} value={o.id}>{nomPersonne(o)}</option>)}
          </select>
        </Field>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Heure de début" required>
            <input className="input" type="time" min="07:00" max="18:00" value={f.heureDebut} onChange={(e) => set('heureDebut', e.target.value)} required />
          </Field>
          <Field label="Heure de fin" required>
            <input className="input" type="time" min="07:00" max="18:00" value={f.heureFin} onChange={(e) => set('heureFin', e.target.value)} required />
          </Field>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Chef de service de la Scolarité" hint="Nom qui figurera sur l'avis imprimé.">
            <input className="input" type="text" value={f.chefScolarite} onChange={(e) => set('chefScolarite', e.target.value)} placeholder="RAKOTOARISOA Rindra Heliosa Bakoliniaina" />
          </Field>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ fontWeight: 600, fontSize: 13, margin: '4px 0 6px' }}>Salles & surveillants</div>
          <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
            Les étudiants peuvent être répartis dans plusieurs salles. 2 surveillants obligatoires + 1 facultatif par salle.
          </div>
          {f.salles.map((l, i) => (
            <div className="examen-salle-bloc" key={i}>
              <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <select className="select" value={l.salleId} onChange={(e) => setSalle(i, 'salleId', e.target.value)} style={{ flex: 1 }}>
                  <option value="">— Salle —</option>
                  {refs.salles.map((s) => <option key={s.id} value={s.id}>{labelSalle(s)} ({s.capacite} pl.)</option>)}
                </select>
                <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                  onClick={() => retirerSalle(i)} disabled={f.salles.length === 1} title="Retirer cette salle"><Icon.close width={15} height={15} /></button>
              </div>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <input className="input" placeholder="Surveillant 1 *" value={l.surveillant1} onChange={(e) => setSurveillant(i, 'surveillant1', e.target.value)} />
                <input className="input" placeholder="Surveillant 2 *" value={l.surveillant2} onChange={(e) => setSurveillant(i, 'surveillant2', e.target.value)} />
                <input className="input" placeholder="Surveillant 3 (optionnel)" value={l.surveillant3} onChange={(e) => setSurveillant(i, 'surveillant3', e.target.value)} />
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={ajouterSalle}><Icon.plus width={14} height={14} /> Ajouter une salle</button>
        </div>
      </div>
    </Modal>
  );
}
