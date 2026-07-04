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
      <style>{`
        /* ===== PAGE HEAD ===== */
        .dashboard-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 28px;
          padding: 20px 24px;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .dashboard-head p {
          margin: 0;
          color: #64748b;
          font-size: 0.95rem;
          font-weight: 400;
        }

        .dashboard-head .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          background: #e0f2fe;
          color: #0284c7;
          white-space: nowrap;
        }

        .dashboard-head .badge svg {
          color: #38bdf8;
        }

        /* ===== STATS GRID ===== */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }

        .stat-card {
          background: #ffffff;
          border-radius: 14px;
          padding: 20px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          border: 1px solid #e2e8f0;
          transition: all 0.25s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          cursor: default;
        }

        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.07);
          border-color: #cbd5e1;
        }

        .stat-ico {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 1.2rem;
        }

        .stat-ico.ico-blue { background: #dbeafe; color: #2563eb; }
        .stat-ico.ico-teal { background: #ccfbf1; color: #0d9488; }
        .stat-ico.ico-violet { background: #ede9fe; color: #7c3aed; }
        .stat-ico.ico-amber { background: #fef3c7; color: #d97706; }
        .stat-ico.ico-green { background: #dcfce7; color: #16a34a; }
        .stat-ico.ico-rose { background: #fce7f3; color: #db2777; }
        .stat-ico.ico-slate { background: #e2e8f0; color: #475569; }

        .stat-card .val {
          font-size: 1.6rem;
          font-weight: 700;
          color: #0c1b33;
          line-height: 1.2;
        }

        .stat-card .lbl {
          font-size: 0.7rem;
          color: #64748b;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        /* ===== CHARTS GRID ===== */
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 20px;
        }

        .chart-card {
          background: #ffffff;
          border-radius: 14px;
          padding: 22px 24px 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          transition: box-shadow 0.25s ease;
        }

        .chart-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
        }

        .chart-card h3 {
          font-size: 0.9rem;
          font-weight: 600;
          color: #0c1b33;
          margin: 0 0 18px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .chart-card h3::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, #e2e8f0, transparent);
        }

        /* ===== DISTRIBUTION ROWS ===== */
        .dist-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .dist-row:last-child {
          border-bottom: none;
        }

        .dist-row .name {
          min-width: 80px;
          font-size: 0.85rem;
          font-weight: 500;
          color: #1e293b;
        }

        .dist-row .dist-bar {
          flex: 1;
          height: 8px;
          background: #f1f5f9;
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }

        .dist-row .dist-bar span {
          display: block;
          height: 100%;
          border-radius: 4px;
          background: linear-gradient(90deg, #38bdf8, #0284c7);
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .dist-row .count {
          min-width: 28px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #0c1b33;
          text-align: right;
        }

        /* ===== COULEURS ALTERNATIVES POUR LES BARRES ===== */
        .dist-row .dist-bar.accent span {
          background: linear-gradient(90deg, #8b5cf6, #6d28d9);
        }

        /* ===== EMPTY STATE ===== */
        .muted {
          color: #94a3b8;
          font-size: 0.85rem;
          text-align: center;
          padding: 16px 0;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
          .dashboard-head {
            padding: 16px 18px;
            flex-direction: column;
            align-items: flex-start;
          }

          .dashboard-head p {
            font-size: 0.85rem;
          }

          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 12px;
          }

          .stat-card {
            padding: 16px 14px;
          }

          .stat-ico {
            width: 38px;
            height: 38px;
            font-size: 1rem;
          }

          .stat-card .val {
            font-size: 1.3rem;
          }

          .charts-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .chart-card {
            padding: 18px 16px 20px;
          }

          .dist-row .name {
            min-width: 60px;
            font-size: 0.8rem;
          }
        }

        @media (max-width: 480px) {
          .dashboard-head {
            padding: 14px 16px;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          .stat-card {
            padding: 14px 12px;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .stat-ico {
            width: 34px;
            height: 34px;
            font-size: 0.9rem;
          }

          .stat-card .val {
            font-size: 1.1rem;
          }

          .stat-card .lbl {
            font-size: 0.6rem;
          }

          .chart-card {
            padding: 14px 12px 16px;
          }

          .dist-row {
            gap: 8px;
            padding: 5px 0;
          }

          .dist-row .name {
            min-width: 50px;
            font-size: 0.75rem;
          }

          .dist-row .dist-bar {
            height: 6px;
          }

          .dist-row .count {
            font-size: 0.7rem;
            min-width: 22px;
          }
        }
      `}</style>

      <div className="dashboard-head">
        <div>
          <p>Vue d'ensemble de l'établissement</p>
        </div>
        {stats.anneeActive && (
          <span className="badge">
            <Icon.annee width={14} height={14} /> {stats.anneeActive}
          </span>
        )}
      </div>

      <div className="stats-grid">
        {CARTES.map((c) => {
          const ICmp = Icon[c.icon];
          return (
            <div className="stat-card" key={c.key}>
              <div className={`stat-ico ${c.cls}`}><ICmp /></div>
              <div>
                <div className="val">{stats[c.key]}</div>
                <div className="lbl">{c.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Étudiants par filière</h3>
          {stats.etudiantsParFiliere.length === 0 ? (
            <p className="muted">Aucune donnée disponible.</p>
          ) : (
            stats.etudiantsParFiliere.map((x) => (
              <div className="dist-row" key={x.libelle}>
                <span className="name">{x.libelle}</span>
                <span className="dist-bar">
                  <span style={{ width: `${(x.total / maxFil) * 100}%` }} />
                </span>
                <span className="count">{x.total}</span>
              </div>
            ))
          )}
        </div>

        <div className="chart-card">
          <h3>Étudiants par niveau</h3>
          {stats.etudiantsParNiveau.length === 0 ? (
            <p className="muted">Aucune donnée disponible.</p>
          ) : (
            stats.etudiantsParNiveau.map((x) => (
              <div className="dist-row" key={x.libelle}>
                <span className="name">{x.libelle}</span>
                <span className="dist-bar accent">
                  <span style={{ width: `${(x.total / maxNiv) * 100}%` }} />
                </span>
                <span className="count">{x.total}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}