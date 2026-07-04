import { useEffect, useState } from 'react';
import api, { messageErreur } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../lib/toast';
import Icon from '../lib/icons';
import { Confirm, Empty, Loading } from '../components/ui';

export default function AnneesAcademiques() {
  const { peutGerer } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aSupprimer, setASupprimer] = useState(null);
  const [busy, setBusy] = useState(false);

  async function charger() {
    setLoading(true);
    try {
      // Garantit l'existence de l'année académique courante (déterminée automatiquement).
      await api.get('/anneesacademiques/courante');
      setItems((await api.get('/anneesacademiques')).data);
    } catch (e) { toast.error(messageErreur(e)); }
    finally { setLoading(false); }
  }
  useEffect(() => { charger(); }, []);

  async function activer(id) {
    try { await api.post(`/anneesacademiques/${id}/activer`); toast.success('Année active mise à jour.'); charger(); }
    catch (e) { toast.error(messageErreur(e)); }
  }

  // Génère automatiquement l'année académique suivante (septembre N → juillet N+1).
  async function genererSuivante() {
    setBusy(true);
    try {
      const annees = items.map((a) => parseInt(String(a.libelle).slice(0, 4), 10)).filter((n) => !isNaN(n));
      const base = annees.length ? Math.max(...annees) : new Date().getFullYear();
      const a = base + 1, b = base + 2;
      await api.post('/anneesacademiques', { libelle: `${a}-${b}`, dateDebut: `${a}-09-01`, dateFin: `${b}-07-31` });
      toast.success(`Année ${a}-${b} créée.`);
      charger();
    } catch (e) { toast.error(messageErreur(e)); }
    finally { setBusy(false); }
  }

  async function supprimer() {
    setBusy(true);
    try { await api.delete(`/anneesacademiques/${aSupprimer.id}`); toast.success('Supprimé.'); setASupprimer(null); charger(); }
    catch (e) { toast.error(messageErreur(e)); }
    finally { setBusy(false); }
  }

  return (
    <>
      <div className="page-head">
        <div><h2>Années académiques</h2><p>Générées automatiquement (septembre → juillet). Une seule année est active à la fois.</p></div>
        {peutGerer && <button className="btn btn-primary" onClick={genererSuivante} disabled={busy}><Icon.plus width={16} height={16} /> Générer l'année suivante</button>}
      </div>

      <div className="card">
        {loading ? <Loading /> : items.length === 0 ? <Empty /> : (
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Libellé</th><th>Début</th><th>Fin</th><th>État</th>{peutGerer && <th className="text-right">Actions</th>}</tr></thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.libelle}</strong></td>
                    <td>{a.dateDebut}</td>
                    <td>{a.dateFin}</td>
                    <td>{a.active ? <span className="badge badge-green"><Icon.check width={13} height={13} /> Active</span> : <span className="badge">Inactive</span>}</td>
                    {peutGerer && (
                      <td className="text-right nowrap">
                        {!a.active && <button className="btn btn-ghost btn-sm" onClick={() => activer(a.id)}>Activer</button>}{' '}
                        {!a.active && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setASupprimer(a)}><Icon.trash width={15} height={15} /></button>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {aSupprimer && <Confirm message={`Supprimer l'année « ${aSupprimer.libelle} » ?`} onConfirm={supprimer} onCancel={() => setASupprimer(null)} loading={busy} />}
    </>
  );
}
