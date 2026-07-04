import { useEffect, useState } from 'react';
import api, { messageErreur } from '../api/client';
import { useToast } from '../lib/toast';
import { Loading } from '../components/ui';
import Icon from '../lib/icons';

const CARTES = [
  { key: 'nbEtudiants', label: 'Étudiants', icon: 'etudiant', cls: 'ico-blue' },
  { key: 'nbEnseignants', label: 'Enseignants', icon: 'enseignant', cls: 'ico-teal' },
  { key: 'nbFilieres', label: 'Filières', icon: 'filiere', cls: 'ico-violet' },
  { key: 'nbMatieres', label: 'Matières', icon: 'matiere', cls: 'ico-amber' },
  { key: 'nbGroupes', label: 'Groupes', icon: 'groupe', cls: 'ico-green' },
  { key: 'nbSalles', label: 'Salles', icon: 'salle', cls: 'ico-rose' },
  { key: 'nbSeances', label: 'Séances planifiées', icon: 'calendar', cls: 'ico-slate' },
];

export default function Dashboard() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((r) => setStats(r.data))
      .catch((e) => toast.error(messageErreur(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (!stats) return null;

  const maxFil = Math.max(1, ...stats.etudiantsParFiliere.map((x) => x.total));
  const maxNiv = Math.max(1, ...stats.etudiantsParNiveau.map((x) => x.total));

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Tableau de bord</h2>
          <p>Vue d'ensemble de l'établissement{stats.anneeActive ? ` · Année académique ${stats.anneeActive}` : ''}.</p>
        </div>
        {stats.anneeActive && <span className="badge badge-green"><Icon.annee width={14} height={14} /> {stats.anneeActive}</span>}
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {CARTES.map((c) => {
          const ICmp = Icon[c.icon];
          return (
            <div className="card stat-card" key={c.key}>
              <div className={`stat-ico ${c.cls}`}><ICmp /></div>
              <div>
                <div className="val">{stats[c.key]}</div>
                <div className="lbl">{c.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <div className="card card-pad">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Étudiants par filière</h3>
          {stats.etudiantsParFiliere.length === 0 ? <p className="muted">Aucune donnée.</p> :
            stats.etudiantsParFiliere.map((x) => (
              <div className="dist-row" key={x.libelle}>
                <span className="name">{x.libelle}</span>
                <span className="dist-bar"><span style={{ width: `${(x.total / maxFil) * 100}%` }} /></span>
                <span className="count">{x.total}</span>
              </div>
            ))}
        </div>

        <div className="card card-pad">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Étudiants par niveau</h3>
          {stats.etudiantsParNiveau.length === 0 ? <p className="muted">Aucune donnée.</p> :
            stats.etudiantsParNiveau.map((x) => (
              <div className="dist-row" key={x.libelle}>
                <span className="name">{x.libelle}</span>
                <span className="dist-bar"><span style={{ width: `${(x.total / maxNiv) * 100}%`, background: 'var(--accent)' }} /></span>
                <span className="count">{x.total}</span>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
