import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Icon from '../lib/icons';
import { Confirm } from './ui';

const SECTIONS = [
  {
    label: null,
    items: [
      { to: '/dashboard', label: 'Tableau de bord', icon: 'dashboard' },
      { to: '/mon-edt', label: 'Mon emploi du temps', icon: 'clock', enseignantOnly: true },
    ],
  },
  {
    label: 'Structures pédagogiques',
    items: [
      { to: '/filieres', label: 'Filières', icon: 'filiere' },
      { to: '/niveaux', label: 'Niveaux', icon: 'niveau' },
      { to: '/parcours', label: 'Parcours', icon: 'parcours' },
      { to: '/matieres', label: 'Matières', icon: 'matiere' },
    ],
  },
  {
    label: 'Acteurs',
    items: [
      { to: '/etudiants', label: 'Étudiants', icon: 'etudiant' },
      { to: '/enseignants', label: 'Enseignants', icon: 'enseignant' },
      { to: '/groupes', label: 'Groupes', icon: 'groupe' },
    ],
  },
  {
    label: 'Locaux',
    items: [
      { to: '/salles', label: 'Salles', icon: 'salle' },
      { to: '/batiments', label: 'Bâtiments', icon: 'batiment' },
    ],
  },
  {
    label: 'Planification',
    items: [
      { to: '/emploi-du-temps', label: 'Emploi du temps', icon: 'calendar' },
      { to: '/disponibilites', label: 'Disponibilités', icon: 'clock' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/annees', label: 'Années académiques', icon: 'annee', gestionOnly: true },
      { to: '/utilisateurs', label: 'Utilisateurs', icon: 'users', adminOnly: true },
    ],
  },
];

export default function Layout() {
  const { user, logout, estAdmin, peutGerer } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const location = useLocation();

  const visible = (it) => {
    if (it.adminOnly && !estAdmin) return false;
    if (it.gestionOnly && !peutGerer) return false;
    if (it.enseignantOnly && !user?.enseignantId) return false;
    return true;
  };

  const initiales = (user?.nomComplet || user?.login || '?').split(' ').map((m) => m[0]).slice(0, 2).join('').toUpperCase();

  return (
    <>
      <style>{`
        /* ===== SCROLLBAR STYLISÉE ===== */
        .sidebar nav::-webkit-scrollbar {
          width: 4px;
        }

        .sidebar nav::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
        }

        .sidebar nav::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #38bdf8, #0284c7);
          border-radius: 2px;
          transition: background 0.3s ease;
        }

        .sidebar nav::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #7dd3fc, #38bdf8);
        }

        /* Firefox */
        .sidebar nav {
          scrollbar-width: thin;
          scrollbar-color: #38bdf8 rgba(255, 255, 255, 0.05);
          flex: 1;
          overflow-y: auto;
          padding: 12px 12px 8px;
        }

        /* ===== SIDEBAR - FORCER LE SCROLL ===== */
        .sidebar {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        /* ===== LOGO COMME SUR LA PAGE DE CONNEXION ===== */
        .brand-logo {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #38bdf8;
          box-shadow: 0 4px 15px rgba(56, 189, 248, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .brand-logo:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 25px rgba(56, 189, 248, 0.35);
        }

        .brand-logo img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: contain;
        }

        /* ===== ACTIVE STATE AVEC BLEU CIEL ===== */
        .nav-link.active {
          background: rgba(56, 189, 248, 0.15) !important;
          color: #38bdf8 !important;
          box-shadow: inset 3px 0 0 #38bdf8 !important;
        }

        .nav-link.active svg {
          color: #38bdf8 !important;
          opacity: 1 !important;
        }

        /* ===== BURGER RESPONSIVE ===== */
        @media (max-width: 768px) {
          .burger {
            display: block !important;
          }
        }
      `}</style>

      <div className="app-shell">
        <aside className={`sidebar ${open ? 'open' : ''}`}>
          <div className="sidebar-brand">
            <div className="brand-logo">
              <img src="/logoNoir.png" alt="EMIT" />
            </div>
            <div className="brand-text">
              <strong>EMIT</strong>
              <span>Gestion des études</span>
            </div>
          </div>

          <nav onClick={() => setOpen(false)}>
            {SECTIONS.map((sec, i) => {
              const items = sec.items.filter(visible);
              if (items.length === 0) return null;
              return (
                <div className="nav-section" key={i}>
                  {sec.label && <div className="nav-label">{sec.label}</div>}
                  {items.map((it) => {
                    const ICmp = Icon[it.icon];
                    return (
                      <NavLink key={it.to} to={it.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <ICmp /> {it.label}
                      </NavLink>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          <div className="sidebar-foot">
            <div className="user-chip">
              <div className="avatar">{initiales}</div>
              <div className="meta">
                <strong>{user?.nomComplet}</strong>
                <span>{user?.role}</span>
              </div>
              <button className="btn-icon" onClick={() => setConfirmLogout(true)} title="Se déconnecter">
                <Icon.logout />
              </button>
            </div>
          </div>
        </aside>

        {confirmLogout && (
          <Confirm
            titre="Se déconnecter"
            message="Voulez-vous vraiment vous déconnecter ?"
            confirmLabel="Se déconnecter"
            loadingLabel="Déconnexion…"
            onConfirm={logout}
            onCancel={() => setConfirmLogout(false)}
          />
        )}

        <div className={`scrim ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />

        <div className="main">
          <header className="topbar">
            <button className="burger" onClick={() => setOpen(true)}><Icon.menu /></button>
            <div>
              <h1>{titreDe(location.pathname)}</h1>
            </div>
            <div className="spacer" />
            <span className="badge badge-blue hide-mobile"><Icon.shield width={14} height={14} /> {user?.role}</span>
          </header>
          <main className="content">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}

function titreDe(path) {
  const map = {
    '/dashboard': 'Tableau de bord', '/mon-edt': 'Mon emploi du temps',
    '/filieres': 'Filières', '/niveaux': 'Niveaux', '/parcours': 'Parcours', '/matieres': 'Matières',
    '/etudiants': 'Étudiants', '/enseignants': 'Enseignants', '/groupes': 'Groupes',
    '/salles': 'Salles', '/batiments': 'Bâtiments',
    '/emploi-du-temps': 'Emploi du temps', '/disponibilites': 'Disponibilités des enseignants',
    '/annees': 'Années académiques', '/utilisateurs': 'Gestion des utilisateurs',
  };
  return map[path] || 'EMIT';
}