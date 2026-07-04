import axios from 'axios';

// L'URL de l'API peut être surchargée via la variable d'environnement VITE_API_URL.
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5043/api';

const api = axios.create({ baseURL });

// Ajoute automatiquement le token JWT à chaque requête.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('emit_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Déconnexion automatique si le token expire / est invalide.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('emit_token')) {
      localStorage.removeItem('emit_token');
      localStorage.removeItem('emit_user');
      if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Extrait un message d'erreur lisible depuis une réponse Axios.
export function messageErreur(error, repli = 'Une erreur est survenue.') {
  return error?.response?.data?.message || error?.message || repli;
}

export default api;
