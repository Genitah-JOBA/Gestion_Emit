import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import Layout from './components/Layout';
import { Loading } from './components/ui';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EmploiDuTemps from './pages/EmploiDuTemps';
import MonEdt from './pages/MonEdt';
import AnneesAcademiques from './pages/AnneesAcademiques';
import Utilisateurs from './pages/Utilisateurs';
import {
  FilieresPage, NiveauxPage, ParcoursPage, MatieresPage, SallesPage,
  BatimentsPage, EnseignantsPage, GroupesPage, EtudiantsPage, DisponibilitesPage,
} from './pages/resources';

function RequireAuth({ children, role }) {
  const { user, pret } = useAuth();
  if (!pret) return <Loading label="Chargement de la session…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'admin' && user.role !== 'Admin') return <Navigate to="/dashboard" replace />;
  if (role === 'gestion' && !(user.role === 'Admin' || user.role === 'Secretariat')) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const { user, pret } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={pret && user ? <Navigate to="/dashboard" replace /> : <Login />} />

      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/mon-edt" element={<MonEdt />} />

        <Route path="/filieres" element={<FilieresPage />} />
        <Route path="/niveaux" element={<NiveauxPage />} />
        <Route path="/parcours" element={<ParcoursPage />} />
        <Route path="/matieres" element={<MatieresPage />} />

        <Route path="/etudiants" element={<EtudiantsPage />} />
        <Route path="/enseignants" element={<EnseignantsPage />} />
        <Route path="/groupes" element={<GroupesPage />} />

        <Route path="/salles" element={<SallesPage />} />
        <Route path="/batiments" element={<BatimentsPage />} />

        <Route path="/emploi-du-temps" element={<EmploiDuTemps />} />
        <Route path="/disponibilites" element={<DisponibilitesPage />} />

        <Route path="/annees" element={<RequireAuth role="gestion"><AnneesAcademiques /></RequireAuth>} />
        <Route path="/utilisateurs" element={<RequireAuth role="admin"><Utilisateurs /></RequireAuth>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
