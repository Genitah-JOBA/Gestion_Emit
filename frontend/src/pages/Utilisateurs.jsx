import { useEffect, useState } from 'react';
import api, { messageErreur } from '../api/client';
import { useToast } from '../lib/toast';
import Icon from '../lib/icons';
import { Confirm, Empty, Field, Loading, Modal, Tag } from '../components/ui';

const ROLES = ['Admin', 'Secretariat', 'Enseignant'];

export default function Utilisateurs() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [aSupprimer, setASupprimer] = useState(null);
  const [busy, setBusy] = useState(false);

  async function charger() {
    setLoading(true);
    try {
      const [u, e] = await Promise.all([api.get('/auth/utilisateurs'), api.get('/enseignants')]);
      setItems(u.data); setEnseignants(e.data);
    } catch (err) { toast.error(messageErreur(err)); }
    finally { setLoading(false); }
  }
  useEffect(() => { charger(); }, []);

  async function enregistrer(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (form.id) {
        await api.put(`/auth/utilisateurs/${form.id}`, {
          nomComplet: form.nomComplet, role: form.role, actif: form.actif,
          enseignantId: form.role === 'Enseignant' && form.enseignantId ? Number(form.enseignantId) : null,
          nouveauMotDePasse: form.motDePasse || null,
        });
      } else {
        await api.post('/auth/utilisateurs', {
          login: form.login, nomComplet: form.nomComplet, motDePasse: form.motDePasse, role: form.role,
          enseignantId: form.role === 'Enseignant' && form.enseignantId ? Number(form.enseignantId) : null,
        });
      }
      toast.success('Enregistré.');
      setForm(null); charger();
    } catch (err) { toast.error(messageErreur(err)); }
    finally { setBusy(false); }
  }

  async function supprimer() {
    setBusy(true);
    try { await api.delete(`/auth/utilisateurs/${aSupprimer.id}`); toast.success('Supprimé.'); setASupprimer(null); charger(); }
    catch (e) { toast.error(messageErreur(e)); }
    finally { setBusy(false); }
  }

  const nouveau = () => setForm({ login: '', nomComplet: '', motDePasse: '', role: 'Secretariat', actif: true, enseignantId: '' });

  return (
    <>
      <div className="page-head">
        <div><p>Comptes d'accès et rôles (Admin, Secrétariat, Enseignant).</p></div>
        <button className="btn btn-primary" onClick={nouveau}><Icon.plus width={16} height={16} /> Nouvel utilisateur</button>
      </div>

      <div className="card">
        {loading ? <Loading /> : items.length === 0 ? <Empty /> : (
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Identifiant</th><th>Nom complet</th><th>Rôle</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id}>
                    <td><span className="badge">{u.login}</span></td>
                    <td><strong>{u.nomComplet}</strong></td>
                    <td><Tag value={u.role} /></td>
                    <td className="text-right nowrap">
                      <button className="btn btn-ghost btn-sm" onClick={() => setForm({ ...u, motDePasse: '', actif: true, enseignantId: u.enseignantId || '' })}><Icon.edit width={15} height={15} /></button>{' '}
                      {u.login !== 'admin' && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setASupprimer(u)}><Icon.trash width={15} height={15} /></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {form && (
        <Modal title={form.id ? 'Modifier le compte' : 'Nouvel utilisateur'} onClose={() => setForm(null)}
          footer={<><button className="btn btn-ghost" onClick={() => setForm(null)}>Annuler</button><button type="submit" form="user-form" className="btn btn-primary" disabled={busy}>Enregistrer</button></>}>
          <form id="user-form" onSubmit={enregistrer} className="grid" style={{ gap: 16 }}>
            {!form.id && <Field label="Identifiant de connexion" required><input className="input" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} required /></Field>}
            <Field label="Nom complet" required><input className="input" value={form.nomComplet} onChange={(e) => setForm({ ...form, nomComplet: e.target.value })} required /></Field>
            <Field label="Rôle" required>
              <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            {form.role === 'Enseignant' && (
              <Field label="Fiche enseignant liée">
                <select className="select" value={form.enseignantId} onChange={(e) => setForm({ ...form, enseignantId: e.target.value })}>
                  <option value="">— Aucune —</option>
                  {enseignants.map((en) => <option key={en.id} value={en.id}>{en.nom} {en.prenoms}</option>)}
                </select>
              </Field>
            )}
            <Field label={form.id ? 'Nouveau mot de passe (laisser vide pour conserver)' : 'Mot de passe'} required={!form.id}>
              <input className="input" type="password" value={form.motDePasse} onChange={(e) => setForm({ ...form, motDePasse: e.target.value })} required={!form.id} placeholder={form.id ? '••••••••' : ''} />
            </Field>
          </form>
        </Modal>
      )}

      {aSupprimer && <Confirm message={`Supprimer le compte « ${aSupprimer.login} » ?`} onConfirm={supprimer} onCancel={() => setASupprimer(null)} loading={busy} />}
    </>
  );
}
