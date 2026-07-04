import { useEffect, useMemo, useState } from 'react';
import api, { messageErreur } from '../api/client';
import { useToast } from '../lib/toast';
import { Empty, Loading } from '../components/ui';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const lundiDe = (d) => { const x = new Date(d); const j = (x.getDay() + 6) % 7; x.setDate(x.getDate() - j); x.setHours(0, 0, 0, 0); return x; };
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const ajouter = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const hhmm = (t) => (t ? String(t).slice(0, 5) : '');

export default function MonEdt() {
  const toast = useToast();
  const [lundi, setLundi] = useState(lundiDe(new Date()));
  const [seances, setSeances] = useState([]);
  const [loading, setLoading] = useState(true);

  const samedi = useMemo(() => ajouter(lundi, 5), [lundi]);

  useEffect(() => {
    setLoading(true);
    api.get('/seances/mon-edt', { params: { du: iso(lundi), au: iso(samedi) } })
      .then((r) => setSeances(r.data))
      .catch((e) => toast.error(messageErreur(e)))
      .finally(() => setLoading(false));
  }, [lundi]);

  const parJour = useMemo(() => {
    const map = {};
    seances.forEach((s) => {
      const idx = (new Date(s.dateCours).getDay() + 6) % 7;
      (map[idx] = map[idx] || []).push(s);
    });
    Object.values(map).forEach((a) => a.sort((x, y) => x.heureDebut.localeCompare(y.heureDebut)));
    return map;
  }, [seances]);

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Mon emploi du temps</h2>
          <p>Semaine du {lundi.toLocaleDateString('fr-FR')} au {samedi.toLocaleDateString('fr-FR')}.</p>
        </div>
        <div className="row">
          <button className="btn btn-ghost btn-sm" onClick={() => setLundi(ajouter(lundi, -7))}>‹ Semaine</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setLundi(lundiDe(new Date()))}>Aujourd'hui</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setLundi(ajouter(lundi, 7))}>Semaine ›</button>
        </div>
      </div>

      {loading ? <Loading /> : seances.length === 0 ? (
        <div className="card"><Empty label="Aucune séance planifiée pour cette semaine." /></div>
      ) : (
        <div>
          {JOURS.slice(0, 6).map((j, i) => (
            parJour[i] && parJour[i].length > 0 && (
              <div className="agenda-day" key={i}>
                <h4>{j} {ajouter(lundi, i).toLocaleDateString('fr-FR')}</h4>
                {parJour[i].map((s) => (
                  <div className="agenda-item" key={s.id}>
                    <div className="time">{hhmm(s.heureDebut)} – {hhmm(s.heureFin)}</div>
                    <div className="info">
                      <strong>{s.matiere?.nom}</strong> <span className="badge badge-blue" style={{ marginLeft: 6 }}>{s.typeSeance}</span>
                      <div className="muted" style={{ marginTop: 3 }}>📍 {s.salle?.nom} · 👥 {s.groupe?.nom}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ))}
        </div>
      )}
    </>
  );
}
