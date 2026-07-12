// Jeu d'icônes SVG (style ligne, cohérent). Aucune dépendance externe.
const s = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const Icon = {
  dashboard: (p) => (<svg {...s} {...p}><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>),
  filiere: (p) => (<svg {...s} {...p}><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M3 7v6l9 4 9-4V7" /></svg>),
  niveau: (p) => (<svg {...s} {...p}><path d="M4 19V5" /><path d="M4 19h16" /><rect x="7" y="12" width="3" height="5" /><rect x="12" y="8" width="3" height="9" /><rect x="17" y="5" width="3" height="12" /></svg>),
  parcours: (p) => (<svg {...s} {...p}><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.5 6H14a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8h.5" /></svg>),
  matiere: (p) => (<svg {...s} {...p}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M19 19H6a2 2 0 0 0-2 2" /></svg>),
  salle: (p) => (<svg {...s} {...p}><path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-3" /><path d="M9 9v.01M9 12v.01M9 15v.01" /></svg>),
  batiment: (p) => (<svg {...s} {...p}><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01" /><path d="M10 21v-3h4v3" /></svg>),
  enseignant: (p) => (<svg {...s} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>),
  groupe: (p) => (<svg {...s} {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.2a3.2 3.2 0 0 1 0 6.1" /><path d="M18 14.5A6 6 0 0 1 21 20" /></svg>),
  etudiant: (p) => (<svg {...s} {...p}><path d="M22 10L12 5 2 10l10 5 10-5z" /><path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" /></svg>),
  calendar: (p) => (<svg {...s} {...p}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></svg>),
  clock: (p) => (<svg {...s} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>),
  annee: (p) => (<svg {...s} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /><path d="M3 12h2M19 12h2" /></svg>),
  users: (p) => (<svg {...s} {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M17 11a3 3 0 1 0-2-5.2" /><path d="M16 14.5a6 6 0 0 1 5 5.5" /></svg>),
  search: (p) => (<svg {...s} {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>),
  plus: (p) => (<svg {...s} {...p}><path d="M12 5v14M5 12h14" /></svg>),
  edit: (p) => (<svg {...s} {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>),
  trash: (p) => (<svg {...s} {...p}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>),
  close: (p) => (<svg {...s} {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>),
  logout: (p) => (<svg {...s} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></svg>),
  menu: (p) => (<svg {...s} {...p}><path d="M3 6h18M3 12h18M3 18h18" /></svg>),
  check: (p) => (<svg {...s} {...p}><path d="M20 6 9 17l-5-5" /></svg>),
  warning: (p) => (<svg {...s} {...p}><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>),
  print: (p) => (<svg {...s} {...p}><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>),
  shield: (p) => (<svg {...s} {...p}><path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" /></svg>),
  pin: (p) => (<svg {...s} {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>),
  filter: (p) => (<svg {...s} {...p}><path d="M22 3H2l8 9.5V19l4 2v-8.5z" /></svg>),
  book: (p) => (<svg {...s} {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>),
};

export default Icon;
