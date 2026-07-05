import { useEffect, useMemo, useState } from 'react';
import api, { messageErreur } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../lib/toast';
import Icon from '../lib/icons';
import { Confirm, Empty, Field, Loading, Modal } from './ui';

/**
 * Page CRUD générique pilotée par configuration.
 * Gère la liste, la recherche, le formulaire (création / modification) et la suppression.
 *
 * Options avancées par champ : mask, transform, validate(value, form, refData),
 * hidden(form), disabled(form)|bool, hint, maxLength.
 * Options de ressource : makeDefaults(refData) et derive(form, refData) -> patch (champs auto).
 */
export default function CrudResource({
  titre, sousTitre, endpoint, columns, fields,
  rechercheKeys = [], libelleAjout = 'Ajouter',
  makeDefaults, derive,
}) {
  const { peutGerer } = useAuth();
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [refData, setRefData] = useState({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [edition, setEdition] = useState(null);
  const [errors, setErrors] = useState({});
  const [aSupprimer, setASupprimer] = useState(null);
  const [busy, setBusy] = useState(false);

  const refsNeeded = useMemo(
    () => [...new Set(fields.filter((f) => f.ref).map((f) => f.ref))],
    [fields]
  );

  async function charger() {
    setLoading(true);
    try {
      const [liste, ...refs] = await Promise.all([
        api.get(`/${endpoint}`),
        ...refsNeeded.map((r) => api.get(`/${r}`)),
      ]);
      setItems(liste.data);
      const rd = {};
      refsNeeded.forEach((r, i) => { rd[r] = refs[i].data; });
      setRefData(rd);
    } catch (e) {
      toast.error(messageErreur(e, 'Impossible de charger les données.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { charger(); /* eslint-disable-next-line */ }, [endpoint]);

  const filtres = useMemo(() => {
    if (!q.trim()) return items;
    const t = q.toLowerCase();
    return items.filter((it) =>
      rechercheKeys.some((k) => String(getPath(it, k) ?? '').toLowerCase().includes(t))
    );
  }, [items, q, rechercheKeys]);

  function ouvrirCreation() {
    let base = initialValues(fields);
    if (makeDefaults) base = { ...base, ...makeDefaults(refData) };
    if (derive) base = { ...base, ...derive(base, refData) };
    setErrors({});
    setEdition(base);
  }

  function ouvrirEdition(row) {
    setErrors({});
    setEdition(toForm(row, fields));
  }

  // Mise à jour d'un champ + dérivation des champs automatiques.
  function setField(name, value) {
    setEdition((prev) => {
      let next = { ...prev, [name]: value };
      if (derive) next = { ...next, ...derive(next, refData) };
      return next;
    });
    setErrors((e) => ({ ...e, [name]: undefined }));
  }

  function champsVisibles(form) {
    return fields.filter((f) => !(typeof f.hidden === 'function' ? f.hidden(form) : f.hidden));
  }

  function valider(form) {
    const errs = {};
    champsVisibles(form).forEach((f) => {
      const val = form[f.name];
      const vide = f.type === 'pills' ? !Array.isArray(val) || val.length === 0 : (val === '' || val == null);
      if (f.required && vide && f.type !== 'checkbox') { errs[f.name] = 'Ce champ est obligatoire.'; return; }
      if (!vide && f.validate) {
        const msg = f.validate(val, form, refData);
        if (msg) errs[f.name] = msg;
      }
    });
    return errs;
  }

  async function enregistrer(e) {
    e.preventDefault();
    const errs = valider(edition);
    if (Object.keys(errs).length) { setErrors(errs); toast.error('Veuillez corriger les champs en rouge.'); return; }
    setBusy(true);
    try {
      const payload = construirePayload(edition, fields);
      if (edition.id) await api.put(`/${endpoint}/${edition.id}`, payload);
      else await api.post(`/${endpoint}`, payload);
      toast.success(edition.id ? 'Modification enregistrée.' : 'Élément créé.');
      setEdition(null);
      charger();
    } catch (err) {
      toast.error(messageErreur(err, "Échec de l'enregistrement."));
    } finally {
      setBusy(false);
    }
  }

  async function supprimer() {
    setBusy(true);
    try {
      const { data } = await api.delete(`/${endpoint}/${aSupprimer.id}`);
      toast.success(data?.message || 'Élément supprimé.');
      setASupprimer(null);
      charger();
    } catch (err) {
      toast.error(messageErreur(err, 'Suppression impossible.'));
    } finally {
      setBusy(false);
    }
  }

  const visibles = edition ? champsVisibles(edition) : [];

  return (
    <>
      <div className="page-head">
        <div>
          <h2>{titre}</h2>
          {sousTitre && <p>{sousTitre}</p>}
        </div>
        {peutGerer && (
          <button className="btn btn-primary" onClick={ouvrirCreation}>
            <Icon.plus width={16} height={16} /> {libelleAjout}
          </button>
        )}
      </div>

      {rechercheKeys.length > 0 && (
        <div className="toolbar">
          <div className="search">
            <Icon.search />
            <input className="input" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <span className="muted">{filtres.length} élément(s)</span>
        </div>
      )}

      <div className="card">
        {loading ? <Loading /> : filtres.length === 0 ? <Empty /> : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  {columns.map((c) => <th key={c.key}>{c.label}</th>)}
                  {peutGerer && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtres.map((row) => (
                  <tr key={row.id}>
                    {columns.map((c) => (
                      <td key={c.key}>{c.render ? c.render(row) : (getPath(row, c.key) ?? '—')}</td>
                    ))}
                    {peutGerer && (
                      <td className="text-right nowrap">
                        <button className="btn btn-ghost btn-sm" onClick={() => ouvrirEdition(row)}>
                          <Icon.edit width={15} height={15} />
                        </button>{' '}
                        <button className="btn btn-ghost btn-sm" onClick={() => setASupprimer(row)} style={{ color: 'var(--danger)' }}>
                          <Icon.trash width={15} height={15} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {edition && (
        <Modal
          title={edition.id ? `Modifier — ${titre}` : `Nouveau — ${titre}`}
          onClose={() => setEdition(null)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setEdition(null)}>Annuler</button>
              <button type="submit" form="crud-form" className="btn btn-primary" disabled={busy}>
                {busy ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </>
          }
        >
          <form id="crud-form" onSubmit={enregistrer}>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {visibles.map((f) => (
                <div key={f.name} style={{ gridColumn: f.full ? '1 / -1' : 'auto' }}>
                  <ChampForm field={f} value={edition[f.name]} form={edition} refData={refData}
                    error={errors[f.name]} onChange={(v) => setField(f.name, v)} />
                </div>
              ))}
            </div>
          </form>
        </Modal>
      )}

      {aSupprimer && (
        <Confirm
          message={`Confirmer la suppression de « ${aSupprimer[fields[0].name] ?? aSupprimer.nom ?? 'cet élément'} » ?`}
          onConfirm={supprimer}
          onCancel={() => setASupprimer(null)}
          loading={busy}
        />
      )}
    </>
  );
}

// ---------- Masques de saisie ----------
const MASKS = {
  digits: (v) => v.replace(/\D/g, ''),
  phone: (v) => v.replace(/\D/g, '').slice(0, 10),
  letters: (v) => v.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ '-]/g, ''),
  upperletter: (v) => v.replace(/[^A-Za-z]/g, '').slice(0, 1).toUpperCase(),
  cin: (v) => v.replace(/\D/g, '').slice(0, 12),
};
export function appliquerMask(mask, v) {
  if (!mask) return v;
  if (typeof mask === 'function') return mask(v);
  return MASKS[mask] ? MASKS[mask](v) : v;
}
export const capitaliserMots = (v) => v.replace(/(^|[\s'-])([a-zà-ÿ])/g, (m, sep, c) => sep + c.toUpperCase());

function ChampForm({ field, value, form, refData, error, onChange }) {
  const v = value ?? '';
  const disabled = typeof field.disabled === 'function' ? field.disabled(form) : !!field.disabled;

  const handle = (raw) => {
    let val = appliquerMask(field.mask, raw);
    if (field.transform) val = field.transform(val);
    onChange(val);
  };

  if (field.type === 'checkbox') {
    return (
      <label className="row" style={{ alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 24 }}>
        <input type="checkbox" checked={!!value} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span style={{ fontWeight: 500 }}>{field.label}</span>
      </label>
    );
  }

  if (field.type === 'pills') {
    const selected = Array.isArray(value) ? value.map(String) : [];
    const options = optionsDe(field, refData, form);
    const toggle = (val) => {
      const s = String(val);
      const next = selected.includes(s) ? selected.filter((x) => x !== s) : [...selected, s];
      onChange(next.map((x) => { const n = Number(x); return Number.isNaN(n) ? x : n; }));
    };
    return (
      <Field label={field.label} required={field.required} error={error} hint={field.hint}>
        <div className="pills-group">
          {options.map((o) => {
            const isSel = selected.includes(String(o.value));
            return (
              <button
                type="button"
                key={o.value}
                disabled={disabled}
                className={`pill${isSel ? ' selected' : ''}`}
                onClick={() => toggle(o.value)}
              >
                <span className="pill-dot" />
                {o.label}
                {isSel && <span className="pill-check">✓</span>}
              </button>
            );
          })}
        </div>
      </Field>
    );
  }

  return (
    <Field label={field.label} required={field.required} error={error} hint={field.hint}>
      {field.type === 'select' ? (
        <select className="select" value={v} required={field.required} disabled={disabled}
          onChange={(e) => onChange(e.target.value)}>
          <option value="">{field.placeholder || '— Sélectionner —'}</option>
          {optionsDe(field, refData, form).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea className="input" rows={3} value={v} disabled={disabled}
          onChange={(e) => handle(e.target.value)} placeholder={field.placeholder} />
      ) : (
        <input
          className="input"
          type={field.type === 'number' ? 'number' : (field.type || 'text')}
          value={v}
          required={field.required}
          disabled={disabled}
          readOnly={field.readOnly}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          min={field.min} max={field.max} step={field.step}
          onChange={(e) => handle(e.target.value)}
        />
      )}
    </Field>
  );
}

// ---------- helpers ----------
function optionsDe(field, refData, form) {
  if (typeof field.options === 'function') return field.options(form, refData);
  if (field.options) return field.options;
  if (field.ref) {
    let data = refData[field.ref] || [];
    if (field.filterRef) data = data.filter((o) => field.filterRef(o, form));
    return data.map((o) => ({ value: o[field.optionValue || 'id'], label: field.optionLabel ? field.optionLabel(o) : o.nom }));
  }
  return [];
}

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

function initialValues(fields) {
  const o = {};
  fields.forEach((f) => { o[f.name] = f.default ?? (f.type === 'checkbox' ? false : f.type === 'pills' ? [] : ''); });
  return o;
}

function toForm(row, fields) {
  const o = { id: row.id };
  fields.forEach((f) => {
    let val = row[f.name];
    if (f.type === 'pills') {
      // Lit un tableau d'identifiants (ex: niveauxIds) ou le déduit d'une collection (ex: niveaux).
      if (!Array.isArray(val)) {
        const coll = row[f.collection || f.ref];
        val = Array.isArray(coll) ? coll.map((x) => x[f.optionValue || 'id']) : [];
      }
      o[f.name] = val;
      return;
    }
    if (val == null) { o[f.name] = f.type === 'checkbox' ? false : ''; return; }
    if (f.type === 'time' && typeof val === 'string') val = val.slice(0, 5);
    if (f.type === 'date' && typeof val === 'string') val = val.slice(0, 10);
    o[f.name] = val;
  });
  return o;
}

function construirePayload(form, fields) {
  const out = {};
  if (form.id) out.id = form.id;
  fields.forEach((f) => {
    if (f.formOnly) return; // champ d'aide à la saisie, non envoyé au backend
    let val = form[f.name];
    if (f.type === 'checkbox') { out[f.name] = !!val; return; }
    if (f.type === 'pills') { out[f.name] = Array.isArray(val) ? val.map(Number) : []; return; }
    if (val === '' || val == null) { out[f.name] = null; return; }
    if (f.numeric || (f.ref && f.type === 'select')) val = Number(val);
    if (f.type === 'time' && typeof val === 'string' && val.length === 5) val = `${val}:00`;
    out[f.name] = val;
  });
  return out;
}
