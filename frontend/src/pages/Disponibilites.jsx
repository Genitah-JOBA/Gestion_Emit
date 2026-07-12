import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import api, { messageErreur } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../lib/toast';
import Icon from '../lib/icons';
import { Confirm, Empty, Field, Loading, Modal, Tag } from '../components/ui';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const ORDRE = { Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6 };
const hhmm = (t) => (t ? String(t).slice(0, 5) : '');
const nomPersonne = (p) => `${p?.nom || ''} ${p?.prenoms || ''}`.trim();
const pad2 = (n) => String(n).padStart(2, '0');
const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };

const pageVariants = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 } };

const jourFr = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '');

// État d'un créneau selon sa période de validité (facultative).
function etatPeriode(c) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (c.dateFin) { const f = new Date(c.dateFin); f.setHours(0, 0, 0, 0); if (f < today) return 'ecoule'; }
  if (c.dateDebut) { const d = new Date(c.dateDebut); d.setHours(0, 0, 0, 0); if (d > today) return 'avenir'; }
  return 'actif';
}
function libellePeriode(c) {
  if (!c.dateDebut && !c.dateFin) return 'Toujours';
  return `${c.dateDebut ? jourFr(c.dateDebut) : '…'} → ${c.dateFin ? jourFr(c.dateFin) : '…'}`;
}

const nouvelleLigne = () => ({ jourSemaine: 'Lundi', heureDebut: '08:00', heureFin: '10:00', dateDebut: '', dateFin: '', disponible: true });

export default function DisponibilitesPage() {
  const { peutGerer } = useAuth();
  const toast = useToast();
  const [enseignants, setEnseignants] = useState([]);
  const [dispos, setDispos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [ouvert, setOuvert] = useState(null);   // enseignantId déplié
  const [saisie, setSaisie] = useState(null);   // modal multi-créneaux
  const [edition, setEdition] = useState(null); // modal édition d'un créneau
  const [aSupprimer, setASupprimer] = useState(null);
  const [busy, setBusy] = useState(false);

  async function charger() {
    setLoading(true);
    try {
      const [e, d] = await Promise.all([api.get('/enseignants'), api.get('/disponibilites')]);
      setEnseignants(e.data);
      setDispos(d.data);
    } catch (err) {
      toast.error(messageErreur(err));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { charger(); /* eslint-disable-next-line */ }, []);

  // Regroupe les créneaux par enseignant.
  const groupes = useMemo(() => {
    const map = new Map();
    dispos.forEach((d) => {
      if (!map.has(d.enseignantId)) map.set(d.enseignantId, { enseignant: d.enseignant, creneaux: [] });
      map.get(d.enseignantId).creneaux.push(d);
    });
    const arr = [...map.values()];
    arr.forEach((g) => g.creneaux.sort((a, b) =>
      (ORDRE[a.jourSemaine] - ORDRE[b.jourSemaine]) || hhmm(a.heureDebut).localeCompare(hhmm(b.heureDebut))));
    arr.sort((a, b) => nomPersonne(a.enseignant).localeCompare(nomPersonne(b.enseignant)));
    return arr;
  }, [dispos]);

  const filtres = useMemo(() => {
    if (!q.trim()) return groupes;
    const t = q.toLowerCase();
    return groupes.filter((g) => nomPersonne(g.enseignant).toLowerCase().includes(t));
  }, [groupes, q]);

  async function supprimer() {
    setBusy(true);
    try {
      await api.delete(`/disponibilites/${aSupprimer.id}`);
      toast.success('Créneau supprimé.');
      setASupprimer(null);
      charger();
    } catch (err) {
      toast.error(messageErreur(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div className="page-enter" initial="initial" animate="animate" exit="exit" variants={pageVariants}>
      <div className="page-head">
        <div>
          <p>Disponibilités hebdomadaires des enseignants (7h–19h). Cliquez sur un enseignant pour voir tous ses créneaux.</p>
        </div>
        {peutGerer && (
          <button className="btn btn-primary" onClick={() => setSaisie({ enseignantId: '', lignes: [nouvelleLigne()] })}>
            <Icon.plus width={16} height={16} /> Disponibilités
          </button>
        )}
      </div>

      <div className="toolbar">
        <div className="search">
          <Icon.search />
          <input className="input" placeholder="Rechercher un enseignant…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <span className="muted">{filtres.length} enseignant(s)</span>
      </div>

      <div className="card">
        {loading ? <Loading /> : filtres.length === 0 ? <Empty label="Aucune disponibilité enregistrée." /> : (
          <div>
            {filtres.map((g) => {
              const id = g.enseignant?.id;
              const open = ouvert === id;
              return (
                <div className="dispo-groupe" key={id}>
                  <button className="dispo-groupe-head" onClick={() => setOuvert(open ? null : id)}>
                    <span className={`dispo-caret ${open ? 'open' : ''}`}>▸</span>
                    <span className="dispo-groupe-nom">{nomPersonne(g.enseignant)}</span>
                    <span className="muted">{g.creneaux.length} créneau(x)</span>
                  </button>

                  {open && (
                    <div className="dispo-creneaux">
                      <div className="table-wrap">
                        <table className="data">
                          <thead>
                            <tr>
                              <th>Jour</th><th>Créneau</th><th>Période</th><th>État</th>
                              {peutGerer && <th className="text-right">Actions</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {g.creneaux.map((c) => {
                              const etat = etatPeriode(c);
                              return (
                                <tr key={c.id} style={etat === 'ecoule' ? { opacity: 0.5 } : undefined}>
                                  <td>{c.jourSemaine}</td>
                                  <td className="nowrap">{hhmm(c.heureDebut)} – {hhmm(c.heureFin)}</td>
                                  <td className="nowrap">
                                    <span className="muted">{libellePeriode(c)}</span>
                                    {etat === 'ecoule' && <span className="badge badge-amber" style={{ marginLeft: 8 }}>Écoulé</span>}
                                    {etat === 'avenir' && <span className="badge badge-blue" style={{ marginLeft: 8 }}>À venir</span>}
                                  </td>
                                  <td><Tag value={c.disponible ? 'Disponible' : 'Indisponible'} /></td>
                                  {peutGerer && (
                                    <td className="text-right nowrap">
                                      <button className="btn btn-ghost btn-sm" onClick={() => setEdition(toEdit(c))}>
                                        <Icon.edit width={15} height={15} />
                                      </button>{' '}
                                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setASupprimer(c)}>
                                        <Icon.trash width={15} height={15} />
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {peutGerer && (
                        <button className="btn btn-ghost btn-sm" style={{ margin: '10px 4px 4px' }}
                          onClick={() => setSaisie({ enseignantId: String(id), lignes: [nouvelleLigne()] })}>
                          <Icon.plus width={14} height={14} /> Ajouter des créneaux
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {saisie && (
        <SaisieModal enseignants={enseignants} valeur={saisie}
          onClose={() => setSaisie(null)} onSaved={() => { setSaisie(null); charger(); }} />
      )}
      {edition && (
        <EditModal valeur={edition} onClose={() => setEdition(null)} onSaved={() => { setEdition(null); charger(); }} />
      )}
      {aSupprimer && (
        <Confirm
          message={`Supprimer ce créneau (${aSupprimer.jourSemaine} ${hhmm(aSupprimer.heureDebut)}–${hhmm(aSupprimer.heureFin)}) ?`}
          onConfirm={supprimer} onCancel={() => setASupprimer(null)} loading={busy} />
      )}
    </motion.div>
  );
}

function toEdit(c) {
  return {
    id: c.id, enseignantId: c.enseignantId, jourSemaine: c.jourSemaine,
    heureDebut: hhmm(c.heureDebut), heureFin: hhmm(c.heureFin),
    dateDebut: c.dateDebut ? String(c.dateDebut).slice(0, 10) : '',
    dateFin: c.dateFin ? String(c.dateFin).slice(0, 10) : '',
    disponible: c.disponible, commentaire: c.commentaire || '',
  };
}

// ---------- Saisie groupée (plusieurs créneaux d'un coup) ----------
function SaisieModal({ enseignants, valeur, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState(valeur);
  const [busy, setBusy] = useState(false);

  const setLigne = (i, k, v) => setF((s) => ({ ...s, lignes: s.lignes.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)) }));
  const ajouterLigne = () => setF((s) => ({ ...s, lignes: [...s.lignes, nouvelleLigne()] }));
  const retirerLigne = (i) => setF((s) => ({ ...s, lignes: s.lignes.filter((_, idx) => idx !== i) }));

  function valider() {
    if (!f.enseignantId) return 'Choisissez un enseignant.';
    if (f.lignes.length === 0) return 'Ajoutez au moins un créneau.';
    for (const l of f.lignes) {
      if (!l.heureDebut || !l.heureFin) return 'Renseignez les heures de chaque créneau.';
      if (l.heureFin <= l.heureDebut) return 'Chaque créneau : la fin doit être après le début.';
      if (l.heureDebut < '07:00' || l.heureFin > '18:30') return 'Les créneaux doivent être entre 07:00 et 18:30.';
      const [h1, m1] = l.heureDebut.split(':').map(Number);
      const [h2, m2] = l.heureFin.split(':').map(Number);
      if ((h2 * 60 + m2) - (h1 * 60 + m1) < 60) return 'Chaque créneau doit durer au moins 1 heure.';
    }
    return null;
  }

  async function enregistrer() {
    const err = valider();
    if (err) { toast.error(err); return; }
    setBusy(true);
    try {
      await api.post('/disponibilites/batch', {
        enseignantId: Number(f.enseignantId),
        creneaux: f.lignes.map((l) => ({
          jourSemaine: l.jourSemaine,
          heureDebut: `${l.heureDebut}:00`,
          heureFin: `${l.heureFin}:00`,
          dateDebut: l.dateDebut || null,
          dateFin: l.dateFin || null,
          disponible: l.disponible,
          commentaire: null,
        })),
      });
      toast.success(`${f.lignes.length} créneau(x) ajouté(s).`);
      onSaved();
    } catch (e) {
      toast.error(messageErreur(e, "Échec de l'enregistrement."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      wide
      title="Ajouter des disponibilités"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Annuler</button>
          <button className="btn btn-primary" onClick={enregistrer} disabled={busy}>
            {busy ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </>
      }
    >
      <Field label="Enseignant" required>
        <select className="select" value={f.enseignantId} onChange={(e) => setF((s) => ({ ...s, enseignantId: e.target.value }))} required>
          <option value="">— Sélectionner —</option>
          {enseignants.map((o) => <option key={o.id} value={o.id}>{nomPersonne(o)}</option>)}
        </select>
      </Field>

      <div style={{ fontWeight: 600, fontSize: 13, margin: '16px 0 4px' }}>Créneaux</div>
      <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
        La période est facultative : laissez « Du/Au » vides pour une disponibilité valable en permanence, ou renseignez-les pour la limiter dans le temps (ex. un cours de 3 semaines).
      </div>
      {f.lignes.map((l, i) => (
        <div className="dispo-bloc" key={i}>
          <div className="dispo-ligne">
            <select className="select" value={l.jourSemaine} onChange={(e) => setLigne(i, 'jourSemaine', e.target.value)}>
              {JOURS.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
            <input className="input" type="time" min="07:00" max="18:30" value={l.heureDebut} onChange={(e) => setLigne(i, 'heureDebut', e.target.value)} />
            <input className="input" type="time" min="07:00" max="18:30" value={l.heureFin} onChange={(e) => setLigne(i, 'heureFin', e.target.value)} />
            <label className="row" style={{ gap: 6, alignItems: 'center', whiteSpace: 'nowrap', fontSize: 13 }}>
              <input type="checkbox" checked={l.disponible} onChange={(e) => setLigne(i, 'disponible', e.target.checked)} /> Dispo
            </label>
            <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
              onClick={() => retirerLigne(i)} disabled={f.lignes.length === 1} title="Retirer ce créneau"><Icon.close width={15} height={15} /></button>
          </div>
          <div className="dispo-periode">
            <span className="muted">Période (optionnel) :</span>
            <label>Du <input className="input" type="date" min={todayIso()} value={l.dateDebut} onChange={(e) => setLigne(i, 'dateDebut', e.target.value)} /></label>
            <label>Au <input className="input" type="date" min={l.dateDebut || todayIso()} value={l.dateFin} onChange={(e) => setLigne(i, 'dateFin', e.target.value)} /></label>
          </div>
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={ajouterLigne}>
        <Icon.plus width={14} height={14} /> Ajouter un créneau
      </button>
    </Modal>
  );
}

// ---------- Édition d'un créneau existant ----------
function EditModal({ valeur, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState(valeur);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  async function enregistrer() {
    if (f.heureFin <= f.heureDebut) { toast.error("L'heure de fin doit être après le début."); return; }
    if (f.heureDebut < '07:00' || f.heureFin > '18:30') { toast.error('Les créneaux doivent être entre 07:00 et 18:30.'); return; }
    setBusy(true);
    try {
      await api.put(`/disponibilites/${f.id}`, {
        id: f.id, enseignantId: Number(f.enseignantId), jourSemaine: f.jourSemaine,
        heureDebut: `${f.heureDebut}:00`, heureFin: `${f.heureFin}:00`,
        dateDebut: f.dateDebut || null, dateFin: f.dateFin || null,
        disponible: f.disponible, commentaire: f.commentaire || null,
      });
      toast.success('Créneau modifié.');
      onSaved();
    } catch (e) {
      toast.error(messageErreur(e, "Échec de l'enregistrement."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Modifier le créneau"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Annuler</button>
          <button className="btn btn-primary" onClick={enregistrer} disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
        </>
      }
    >
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Field label="Jour">
          <select className="select" value={f.jourSemaine} onChange={(e) => set('jourSemaine', e.target.value)}>
            {JOURS.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
        </Field>
        <label className="row" style={{ gap: 8, alignItems: 'center', marginTop: 26, cursor: 'pointer' }}>
          <input type="checkbox" checked={f.disponible} onChange={(e) => set('disponible', e.target.checked)} /> Disponible
        </label>
        <Field label="Heure de début">
          <input className="input" type="time" min="07:00" max="18:30" value={f.heureDebut} onChange={(e) => set('heureDebut', e.target.value)} />
        </Field>
        <Field label="Heure de fin">
          <input className="input" type="time" min="07:00" max="18:30" value={f.heureFin} onChange={(e) => set('heureFin', e.target.value)} />
        </Field>
        <Field label="Valable du (optionnel)" hint="Vide = toujours valable.">
          <input className="input" type="date" min={todayIso()} value={f.dateDebut} onChange={(e) => set('dateDebut', e.target.value)} />
        </Field>
        <Field label="Valable jusqu'au (optionnel)">
          <input className="input" type="date" min={f.dateDebut || todayIso()} value={f.dateFin} onChange={(e) => set('dateFin', e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
