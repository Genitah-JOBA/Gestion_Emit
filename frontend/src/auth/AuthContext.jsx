import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('emit_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [pret, setPret] = useState(false);

  // Vérifie au démarrage que le token stocké est toujours valide.
  useEffect(() => {
    const token = localStorage.getItem('emit_token');
    if (!token) { setPret(true); return; }
    api.get('/auth/moi')
      .then((res) => {
        setUser(res.data);
        localStorage.setItem('emit_user', JSON.stringify(res.data));
      })
      .catch(() => {
        localStorage.removeItem('emit_token');
        localStorage.removeItem('emit_user');
        setUser(null);
      })
      .finally(() => setPret(true));
  }, []);

  async function login(loginId, motDePasse) {
    const res = await api.post('/auth/login', { login: loginId, motDePasse });
    localStorage.setItem('emit_token', res.data.token);
    localStorage.setItem('emit_user', JSON.stringify(res.data.utilisateur));
    setUser(res.data.utilisateur);
    return res.data.utilisateur;
  }

  function logout() {
    localStorage.removeItem('emit_token');
    localStorage.removeItem('emit_user');
    setUser(null);
  }

  const estAdmin = user?.role === 'Admin';
  const peutGerer = user?.role === 'Admin' || user?.role === 'Secretariat';

  return (
    <AuthContext.Provider value={{ user, pret, login, logout, estAdmin, peutGerer }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
