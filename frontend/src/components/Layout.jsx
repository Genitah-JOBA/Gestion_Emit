import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../auth/AuthContext';
import Icon from '../lib/icons';

// ---------- Variants d'animation de la barre latérale ----------
const navContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.15 } },
};

const navSection = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } },
};

const SECTIONS = [
  {
    label: null,
    items: [
      { to: '/dashboard', label: 'Tableau de bord', icon: 'dashboard' },
      { to: '/mon-edt', label: 'Mon emploi du temps', icon: 'clock', enseignantOnly: true },
      { to: '/mes-matieres', label: 'Mes matières', icon: 'book', enseignantOnly: true },
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
      { to: '/examens', label: 'Examens', icon: 'matiere' },
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
          background: #38bdf8;
          border-radius: 2px;
          transition: background 0.3s ease;
        }

        .sidebar nav::-webkit-scrollbar-thumb:hover {
          background: #7dd3fc;
        }

        .sidebar nav {
          scrollbar-width: thin;
          scrollbar-color: #38bdf8 rgba(255, 255, 255, 0.05);
          flex: 1;
          overflow-y: auto;
          padding: 12px 12px 8px;
        }

        /* ===== SIDEBAR ===== */
        .sidebar {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        /* ===== LOGO ===== */
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

        /* ===== ACTIVE STATE ===== */
        .nav-link.active {
          background: rgba(56, 189, 248, 0.15) !important;
          color: #38bdf8 !important;
          box-shadow: inset 3px 0 0 #38bdf8 !important;
        }

        .nav-link.active svg {
          color: #38bdf8 !important;
          opacity: 1 !important;
        }

        /* ===== SIDEBAR FOOT ===== */
        .sidebar-foot {
          padding: 12px 16px 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
        }

        .user-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.06);
          transition: background 0.2s ease;
        }

        .user-chip:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .user-chip .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #38bdf8;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 700;
          flex-shrink: 0;
          letter-spacing: 0.5px;
        }

        .user-chip .meta {
          flex: 1;
          min-width: 0;
        }

        .user-chip .meta span {
          display: block;
          font-size: 0.7rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        /* ===== BOUTON DÉCONNEXION ===== */
        .logout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          padding: 0;
          border: none;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
          transform: scale(1.05);
        }

        .logout-btn:active {
          transform: scale(0.92);
        }

        .logout-btn svg {
          width: 18px;
          height: 18px;
          transition: transform 0.25s ease;
        }

        .logout-btn:hover svg {
          transform: translateX(2px) rotate(-3deg);
        }

        .logout-btn .logout-tooltip {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%) scale(0.8);
          background: rgba(0, 0, 0, 0.9);
          color: #fff;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.65rem;
          font-weight: 500;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: all 0.2s ease;
          backdrop-filter: blur(8px);
        }

        .logout-btn .logout-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 4px solid transparent;
          border-top-color: rgba(0, 0, 0, 0.9);
        }

        .logout-btn:hover .logout-tooltip {
          opacity: 1;
          transform: translateX(-50%) scale(1);
        }

        /* ===== CONFIRM MODAL PREMIUM ===== */
        .confirm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .confirm-modal {
          background: #ffffff;
          border-radius: 24px;
          max-width: 440px;
          width: 100%;
          padding: 0;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.25);
          position: relative;
          overflow: hidden;
        }

        .confirm-modal-header {
          padding: 32px 32px 0;
          text-align: center;
        }

        .confirm-modal-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #fef2f2;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .confirm-modal-icon svg {
          width: 32px;
          height: 32px;
          color: #ef4444;
        }

        .confirm-modal-icon::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid rgba(239, 68, 68, 0.15);
          animation: pulse-ring 2s ease-in-out infinite;
        }

        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.5; }
        }

        .confirm-modal-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 8px;
          letter-spacing: -0.3px;
        }

        .confirm-modal-desc {
          font-size: 0.9rem;
          color: #64748b;
          margin: 0 0 8px;
          line-height: 1.6;
          padding: 0 8px;
        }

        .confirm-modal-desc strong {
          color: #0f172a;
          font-weight: 600;
        }

        .confirm-modal-divider {
          height: 1px;
          background: #f1f5f9;
          margin: 20px 32px 0;
        }

        .confirm-modal-actions {
          display: flex;
          gap: 10px;
          padding: 20px 32px 32px;
        }

        .confirm-modal-actions .btn-secondary {
          flex: 1;
          padding: 12px 20px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          background: #f8fafc;
          color: #475569;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .confirm-modal-actions .btn-secondary:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }

        .confirm-modal-actions .btn-secondary:active {
          transform: scale(0.97);
        }

        .confirm-modal-actions .btn-danger {
          flex: 1;
          padding: 12px 20px;
          border: none;
          border-radius: 12px;
          background: #ef4444;
          color: #ffffff;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .confirm-modal-actions .btn-danger:hover {
          background: #dc2626;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
        }

        .confirm-modal-actions .btn-danger:active {
          transform: scale(0.97);
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.2);
        }

        .confirm-modal-actions .btn-danger svg {
          width: 18px;
          height: 18px;
        }

        /* ===== BURGER RESPONSIVE ===== */
        @media (max-width: 768px) {
          .burger {
            display: block !important;
          }

          .sidebar-foot {
            padding: 10px 12px 12px;
          }

          .user-chip {
            padding: 6px 10px;
          }

          .user-chip .meta span {
            font-size: 0.6rem;
          }

          .logout-btn {
            width: 30px;
            height: 30px;
          }

          .logout-btn svg {
            width: 16px;
            height: 16px;
          }

          .logout-btn .logout-tooltip {
            display: none;
          }

          .confirm-modal {
            max-width: 380px;
          }

          .confirm-modal-header {
            padding: 24px 24px 0;
          }

          .confirm-modal-icon {
            width: 60px;
            height: 60px;
          }

          .confirm-modal-icon svg {
            width: 26px;
            height: 26px;
          }

          .confirm-modal-title {
            font-size: 1.15rem;
          }

          .confirm-modal-divider {
            margin: 16px 24px 0;
          }

          .confirm-modal-actions {
            padding: 16px 24px 24px;
            flex-direction: column;
          }

          .confirm-modal-actions .btn-secondary,
          .confirm-modal-actions .btn-danger {
            padding: 10px 16px;
            font-size: 0.8rem;
          }
        }

        @media (max-width: 480px) {
          .user-chip .avatar {
            width: 28px;
            height: 28px;
            font-size: 0.6rem;
          }

          .confirm-modal {
            max-width: 340px;
            border-radius: 20px;
          }

          .confirm-modal-header {
            padding: 20px 16px 0;
          }

          .confirm-modal-icon {
            width: 52px;
            height: 52px;
          }

          .confirm-modal-icon svg {
            width: 22px;
            height: 22px;
          }

          .confirm-modal-title {
            font-size: 1rem;
          }

          .confirm-modal-desc {
            font-size: 0.8rem;
          }

          .confirm-modal-divider {
            margin: 14px 16px 0;
          }

          .confirm-modal-actions {
            padding: 14px 16px 20px;
            gap: 8px;
          }
        }
      `}</style>

      <div className="app-shell">
        <aside className={`sidebar ${open ? 'open' : ''}`}>
          <motion.div
            className="sidebar-brand"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <div className="brand-logo">
              <img src="/logoNoir.png" alt="EMIT" />
            </div>
            <div className="brand-text">
              <strong>Cadence</strong>
              <span>Le bon rythme des cours</span>
            </div>
          </motion.div>

          <motion.nav onClick={() => setOpen(false)} variants={navContainer} initial="hidden" animate="show">
            {SECTIONS.map((sec, i) => {
              const items = sec.items.filter(visible);
              if (items.length === 0) return null;
              return (
                <motion.div className="nav-section" key={i} variants={navSection}>
                  {sec.label && <div className="nav-label">{sec.label}</div>}
                  {items.map((it) => {
                    const ICmp = Icon[it.icon];
                    return (
                      <NavLink key={it.to} to={it.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <ICmp /> {it.label}
                      </NavLink>
                    );
                  })}
                </motion.div>
              );
            })}
          </motion.nav>

          <div className="sidebar-foot">
            <div className="user-chip">
              <div className="avatar">{initiales}</div>
              <div className="meta">
                <span>{user?.role}</span>
              </div>
              <button
                className="logout-btn"
                onClick={() => setConfirmLogout(true)}
                title="Se déconnecter"
              >
                <Icon.logout />
                <span className="logout-tooltip">Déconnexion</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Confirm Modal Premium */}
        <AnimatePresence>
          {confirmLogout && (
            <motion.div
              className="confirm-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setConfirmLogout(false)}
            >
              <motion.div
                className="confirm-modal"
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="confirm-modal-header">
                  <div className="confirm-modal-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <h3 className="confirm-modal-title">Se déconnecter</h3>
                  <p className="confirm-modal-desc">
                    Voulez-vous vraiment vous déconnecter ? Vous devrez vous reconnecter pour accéder à nouveau à votre compte.
                  </p>
                </div>

                <div className="confirm-modal-divider" />

                <div className="confirm-modal-actions">
                  <button className="btn-secondary" onClick={() => setConfirmLogout(false)}>
                    Annuler
                  </button>
                  <button className="btn-danger" onClick={logout}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Se déconnecter
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`scrim ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />

        <div className="main">
          <header className="topbar">
            <button className="burger" onClick={() => setOpen(true)}><Icon.menu /></button>
            <div>
              <motion.h1
                key={location.pathname}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {titreDe(location.pathname)}
              </motion.h1>
            </div>
            <div className="spacer" />
            <span className="badge badge-blue hide-mobile"><Icon.shield width={14} height={14} /> {user?.role}</span>
          </header>
          <main className="content">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>
    </>
  );
}

function titreDe(path) {
  const map = {
    '/dashboard': 'Tableau de bord', '/mon-edt': 'Mon emploi du temps', '/mes-matieres': 'Mes matières',
    '/filieres': 'Filières', '/niveaux': 'Niveaux', '/parcours': 'Parcours', '/matieres': 'Matières',
    '/etudiants': 'Étudiants', '/enseignants': 'Enseignants', '/groupes': 'Groupes',
    '/salles': 'Salles', '/batiments': 'Bâtiments',
    '/emploi-du-temps': 'Emploi du temps', '/disponibilites': 'Disponibilités des enseignants',
    '/annees': 'Années académiques', '/utilisateurs': 'Gestion des utilisateurs',
  };
  return map[path] || 'EMIT';
}