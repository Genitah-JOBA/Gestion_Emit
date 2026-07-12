import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import api, { messageErreur } from '../api/client';
import { useToast } from '../lib/toast';
import { Empty, Loading } from '../components/ui';
import Icon from '../lib/icons';

// Regroupe les matières par niveau (l'API les renvoie déjà triées par ordre de niveau).
function grouperParNiveau(matieres) {
  const groupes = [];
  const index = {};
  (Array.isArray(matieres) ? matieres : []).forEach((m) => {
    const cle = m.niveau?.nom || 'Autre';
    if (index[cle] === undefined) { index[cle] = groupes.length; groupes.push({ niveau: cle, matieres: [] }); }
    groupes[index[cle]].matieres.push(m);
  });
  return groupes;
}

const carte = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } },
};

export default function MesMatieres() {
  const toast = useToast();
  const [matieres, setMatieres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/enseignants/mes-matieres')
      .then((r) => setMatieres(Array.isArray(r.data) ? r.data : []))
      .catch((e) => { setMatieres([]); toast.error(messageErreur(e)); })
      .finally(() => setLoading(false));
  }, []);

  const groupes = useMemo(() => grouperParNiveau(matieres), [matieres]);

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Mes matières</h2>
          <p>Les unités d'enseignement qui vous sont attribuées.</p>
        </div>
        {matieres.length > 0 && (
          <span className="badge badge-blue"><Icon.book width={14} height={14} /> {matieres.length} matière{matieres.length > 1 ? 's' : ''}</span>
        )}
      </div>

      {loading ? <Loading /> : matieres.length === 0 ? (
        <div className="card"><Empty label="Aucune matière ne vous est attribuée pour le moment." /></div>
      ) : (
        <div className="matieres-groupes">
          {groupes.map((g) => (
            <div className="matiere-groupe" key={g.niveau}>
              <div className="matiere-groupe-head">
                <Icon.niveau width={16} height={16} />
                <h4>{g.niveau}</h4>
                <span className="muted">{g.matieres.length}</span>
              </div>
              <motion.div
                className="matiere-grid"
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.05 } } }}
              >
                {g.matieres.map((m) => (
                  <motion.div className="matiere-carte" key={m.id} variants={carte} whileHover={{ y: -3 }}>
                    <div className="matiere-carte-top">
                      <span className="badge badge-blue">{m.codeMatiere}</span>
                      <span className="muted">S{m.semestre}</span>
                    </div>
                    <strong className="matiere-carte-nom">{m.nom}</strong>
                    <div className="matiere-carte-meta">
                      <span><Icon.filiere width={13} height={13} /> {m.filiere?.nom || '—'}</span>
                      {m.parcours?.nom && <span><Icon.parcours width={13} height={13} /> {m.parcours.nom}</span>}
                    </div>
                    <div className="matiere-carte-foot">
                      <span className="chip">Coef. {m.coefficient}</span>
                      {m.creditsEcts != null && <span className="chip">{m.creditsEcts} ECTS</span>}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
