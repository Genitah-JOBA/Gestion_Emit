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
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">E</div>
          <div className="brand-text">
            <strong>EMIT</strong>
            <span>Gestion des études</span>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto' }} onClick={() => setOpen(false)}>
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
            <div className="meta" style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.nomComplet}</strong>
              <span>{user?.role}</span>
            </div>
            <button className="btn btn-icon" style={{ background: 'transparent', color: '#8597b5' }} onClick={() => setConfirmLogout(true)} title="Se déconnecter">
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
