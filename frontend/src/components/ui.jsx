import { useEffect } from 'react';
import Icon from '../lib/icons';

export function Modal({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`}>
        <div className="modal-head">
          <h3 style={{ fontSize: 17 }}>{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fermer"><Icon.close /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Confirm({ titre = 'Confirmer la suppression', message, onConfirm, onCancel, loading, confirmLabel = 'Supprimer', loadingLabel = 'Suppression…' }) {
  return (
    <Modal title={titre} onClose={onCancel} footer={
      <>
        <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>Annuler</button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? loadingLabel : confirmLabel}
        </button>
      </>
    }>
      <p style={{ margin: 0 }}>{message}</p>
    </Modal>
  );
}

export function ConflitModal({ titre = 'Conflit(s) détecté(s)', conflits, onCorriger }) {
  return (
    <Modal title={titre} onClose={onCorriger} footer={
      <button className="btn btn-primary" onClick={onCorriger}>Corriger</button>
    }>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--warning)', fontWeight: 600, marginBottom: 10 }}>
        <Icon.warning width={18} height={18} /> Impossible d'enregistrer : ce créneau entre en conflit
      </div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {conflits.map((c, i) => <li key={i} style={{ marginBottom: 4 }}>{c.message}</li>)}
      </ul>
      <p className="muted" style={{ margin: '10px 0 0', fontSize: 12.5 }}>
        Corrigez les informations pour pouvoir enregistrer.
      </p>
    </Modal>
  );
}

export function Loading({ label = 'Chargement…' }) {
  return <div className="center-box"><div style={{ textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto 12px' }} /><div className="muted">{label}</div></div></div>;
}

export function Empty({ label = 'Aucune donnée pour le moment.' }) {
  return <div className="empty">{label}</div>;
}

export function Field({ label, children, required, error, hint }) {
  return (
    <div className="field">
      {label && <label>{label}{required && <span style={{ color: 'var(--danger)' }}> *</span>}</label>}
      {children}
      {hint && !error && <small className="muted" style={{ display: 'block', marginTop: 4 }}>{hint}</small>}
      {error && <small style={{ display: 'block', marginTop: 4, color: 'var(--danger)', fontWeight: 500 }}>{error}</small>}
    </div>
  );
}

const badgeMap = {
  Passant: 'badge-green', Redoublant: 'badge-amber', Suspendu: 'badge-red', Renvoi: 'badge-red',
  Amphitheatre: 'badge-blue', SalleDeClasse: 'badge-green', SalleDeReunion: 'badge-blue',
  Bureau: 'badge-amber', Studio: 'badge-blue', SalleDeSoutenance: 'badge-amber',
  Cours: 'badge-blue', Admin: 'badge-red', Secretariat: 'badge-blue', Enseignant: 'badge-green',
  Disponible: 'badge-green', Indisponible: 'badge-red', Masculin: 'badge-blue', Feminin: 'badge-amber',
};
const labelLisible = {
  Amphitheatre: 'Amphithéâtre', SalleDeClasse: 'Salle de classe', SalleDeReunion: 'Salle de réunion',
  SalleDeSoutenance: 'Salle de soutenance', MaitreAssistant: 'Maître-assistant', MaitreDeConferences: 'Maître de conférences',
};
export function Tag({ value, className }) {
  return <span className={`badge ${className || badgeMap[value] || ''}`}>{labelLisible[value] || value}</span>;
}
