import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import { getSupabase, mapLeadFromRpc } from './lib/supabaseClient.js';

// ─── Supabase (sin Node: token validado en DB vía RPC) ─────
function requireSupabase() {
  const s = getSupabase();
  if (!s) {
    throw new Error(
      'Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el build (Vercel → Environment Variables).'
    );
  }
  return s;
}

// ─── Formatting helpers ──────────────────────────────────
const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-AR');
};

const formatDateTime = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return isNaN(date.getTime()) ? '—' : date.toLocaleString('es-AR');
};

const statusBadge = (estado) => {
  const map = {
    'Nuevo': 'badge-nuevo',
    'En contacto': 'badge-contacto',
    'Cerrado': 'badge-cerrado',
    'Archivado': 'badge-archivado',
  };
  return <span className={`badge ${map[estado] || ''}`}>{estado}</span>;
};

// ─── Elite Select Component ───────────────────────────────
const EliteSelect = ({ label, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="field" style={{ position: 'relative' }}>
      <label>{label}</label>
      <div 
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: '#000', border: `1px solid ${isOpen ? 'var(--accent)' : '#1a1a1a'}`,
          padding: '12px 16px', borderRadius: 8, cursor: 'pointer', display: 'flex', 
          justifyContent: 'space-between', alignItems: 'center', color: '#fff', fontSize: '0.9rem'
        }}
      >
        <span>{value}</span>
        <span style={{ transition: 'transform 0.3s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
      </div>
      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 8,
          background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 8,
          zIndex: 1000, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', overflow: 'hidden'
        }}>
          {options.map(opt => (
            <div 
              key={opt}
              onClick={() => { onChange(opt); setIsOpen(false); }}
              style={{
                padding: '12px 16px', cursor: 'pointer', fontSize: '0.9rem',
                background: value === opt ? 'rgba(57, 255, 20, 0.1)' : 'transparent',
                color: value === opt ? 'var(--accent)' : '#fff'
              }}
              onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.target.style.background = value === opt ? 'rgba(57, 255, 20, 0.1)' : 'transparent'}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Lead Detail Modal ────────────────────────────────────
function LeadModal({ lead, token, onClose, onUpdate }) {
  const [estado, setEstado] = useState(lead.estado);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const s = requireSupabase();
      const { error } = await s.rpc('admin_update_lead', {
        p_token: token,
        p_id: lead.id,
        p_estado: estado,
      });
      if (error) throw new Error(error.message);
      onUpdate(lead.id, estado);
      onClose();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar el lead de ${lead.nombre}?`)) return;
    try {
      const s = requireSupabase();
      const { error } = await s.rpc('admin_delete_lead', { p_token: token, p_id: lead.id });
      if (error) throw new Error(error.message);
      onUpdate(lead.id, null); // null = deleted
      onClose();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Detalle del Lead</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="detail-row">
          <span className="detail-label">Nombre</span>
          <span className="detail-value">{lead.nombre}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Email</span>
          <span className="detail-value"><a href={`mailto:${lead.email}`} style={{ color: 'var(--accent)' }}>{lead.email}</a></span>
        </div>
        {lead.telefono && (
          <div className="detail-row">
            <span className="detail-label">Teléfono</span>
            <span className="detail-value">{lead.telefono}</span>
          </div>
        )}
        {lead.plan && (
          <div className="detail-row">
            <span className="detail-label">Plan</span>
            <span className="detail-value">{lead.plan}</span>
          </div>
        )}
        {lead.mensaje && (
          <div className="detail-row">
            <span className="detail-label">Mensaje</span>
            <span className="detail-value" style={{ lineHeight: 1.7, color: 'rgba(255,255,255,0.7)' }}>{lead.mensaje}</span>
          </div>
        )}
        <div className="detail-row">
          <span className="detail-label">Fecha</span>
          <span className="detail-value">{formatDateTime(lead.createdAt)}</span>
        </div>

        <EliteSelect 
          label="Cambiar estado"
          value={estado}
          options={['Nuevo', 'En contacto', 'Cerrado', 'Archivado']}
          onChange={(val) => setEstado(val)}
        />

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Plan Editor Modal ──────────────────────────────────────
function PlanModal({ plan, onClose, onSave }) {
  const [edit, setEdit] = useState({ ...plan });
  const [itemsStr, setItemsStr] = useState(plan.items ? plan.items.join('\n') : '');

  const handleSave = () => {
    const finalItems = itemsStr.split('\n').filter(i => i.trim() !== '');
    onSave({ ...edit, items: finalItems });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <h2>Editar Plan: {plan.nombre}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="field">
            <label>Nombre</label>
            <input type="text" value={edit.nombre} onChange={e => setEdit({ ...edit, nombre: e.target.value })} />
          </div>
          <div className="field">
            <label>Precio</label>
            <input type="text" value={edit.precio} onChange={e => setEdit({ ...edit, precio: e.target.value })} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="field">
            <label>Prefijo (ej: USD)</label>
            <input type="text" value={edit.prefijo || ''} onChange={e => setEdit({ ...edit, prefijo: e.target.value })} />
          </div>
          <div className="field">
            <label>Entrega</label>
            <input type="text" value={edit.entrega || ''} onChange={e => setEdit({ ...edit, entrega: e.target.value })} />
          </div>
        </div>

        <div className="field">
          <label>Descripción</label>
          <textarea rows={2} value={edit.desc || ''} onChange={e => setEdit({ ...edit, desc: e.target.value })} />
        </div>

        <div className="field">
          <label>Beneficios / Items (uno por línea)</label>
          <textarea rows={6} value={itemsStr} onChange={e => setItemsStr(e.target.value)} />
        </div>

        <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, display: 'flex' }}>
          <input type="checkbox" checked={!!edit.destacado} onChange={e => setEdit({ ...edit, destacado: e.target.checked })} id="chk-dest" />
          <label htmlFor="chk-dest" style={{ marginBottom: 0 }}>Plan destacado (badge verde)</label>
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" onClick={handleSave} style={{ flex: 1 }}>Guardar detalles</button>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────
function Login({ onLogin }) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const s = requireSupabase();
      const { data, error } = await s.rpc('admin_token_valid', { p_token: token });
      if (error || !data) throw new Error('bad');
      localStorage.setItem('pulso_admin_token', token);
      onLogin(token);
    } catch {
      setError('Token incorrecto. Revisá el token guardado en Supabase (app_settings).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div style={{ marginBottom: 32 }}>
          <div className="brand" style={{ fontSize: '1.4rem', marginBottom: 8 }}>
            PULSO<span style={{ color: 'var(--accent)' }}>.</span>APP
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Panel de Administración
          </div>
        </div>
        <h1>Acceder</h1>
        <p>Ingresá tu token de administrador para continuar.</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Token de acceso</label>
            <input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="••••••••••••" required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Verificando...' : 'Ingresar al panel →'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────
export default function App() {
  const [token, setToken] = useState(localStorage.getItem('pulso_admin_token') || '');
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('Todos');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Solicitudes');
  const [planes, setPlanes] = useState([]);
  const [planesLoading, setPlanesLoading] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setPlanesLoading(true);
    try {
      const s = requireSupabase();
      const [leadsRes, statsRes, plansRes] = await Promise.all([
        s.rpc('admin_list_leads', {
          p_token: token,
          p_estado: null,
          p_page: 1,
          p_limit: 2000,
        }),
        s.rpc('admin_stats', { p_token: token }),
        s.rpc('admin_list_plans', { p_token: token }),
      ]);
      if (leadsRes.error) throw leadsRes.error;
      if (statsRes.error) throw statsRes.error;
      if (plansRes.error) throw plansRes.error;

      const payload =
        typeof leadsRes.data === 'string' ? JSON.parse(leadsRes.data) : leadsRes.data;
      let rawLeads = payload?.leads;
      if (typeof rawLeads === 'string') rawLeads = JSON.parse(rawLeads);
      rawLeads = Array.isArray(rawLeads) ? rawLeads : [];
      setLeads(
        rawLeads.map((l) => {
          const m = mapLeadFromRpc(l);
          return { ...m, id: m.id };
        })
      );
      let statsData = statsRes.data;
      if (typeof statsData === 'string') statsData = JSON.parse(statsData);
      setStats(statsData);

      let plansData = plansRes.data;
      if (typeof plansData === 'string') plansData = JSON.parse(plansData);
      setPlanes(Array.isArray(plansData) ? plansData : []);
    } catch (err) {
      console.error(err);
      if (
        String(err.message || '').includes('token') ||
        String(err.message || '').includes('invalid')
      ) {
        setToken('');
        localStorage.removeItem('pulso_admin_token');
      }
    } finally {
      setLoading(false);
      setPlanesLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (!token) return <Login onLogin={t => { setToken(t); }} />;

  const filtered = filter === 'Todos' ? leads : leads.filter(l => l.estado === filter);

  const handleUpdate = (id, estado) => {
    if (estado === null) {
      setLeads(prev => prev.filter(l => l.id !== id));
    } else {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, estado } : l));
    }
    load(); // refresh stats
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="brand name">PULSO<span style={{ color: 'var(--accent)' }}>.</span>APP</div>
          <div className="sub">Panel de Gestión</div>
        </div>

        <nav>
          {[
            { id: 'Solicitudes', label: 'Solicitudes', dot: true },
            { id: 'Configuración', label: 'Configuración', dot: false }
          ].map((item) => (
            <div 
              key={item.id} 
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              style={{ cursor: 'pointer' }}
            >
              {item.dot && <span className="nav-dot" />}
              {item.label}
              {item.id === 'Solicitudes' && stats?.nuevo > 0 && (
                <span style={{ marginLeft: 'auto', background: 'var(--accent)', color: '#000', fontSize: '0.6rem', fontWeight: 800, padding: '2px 7px', borderRadius: '100px' }}>
                  {stats.nuevo}
                </span>
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={() => { localStorage.removeItem('pulso_admin_token'); setToken(''); }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {activeTab === 'Solicitudes' ? (
          <>
            <div className="page-header">
              <div>
                <div className="page-title">Solicitudes</div>
                <div className="page-sub">
                  {stats ? `${stats.total} solicitudes en total · ${stats.nuevo} nuevas` : 'Cargando...'}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
                {loading ? 'Actualizando...' : '↻ Actualizar'}
              </button>
            </div>

            {/* Stats */}
            {stats && (
              <div className="stats-row">
                {[
                  { label: 'Total', n: stats.total },
                  { label: 'Nuevos', n: stats.nuevo },
                  { label: 'En contacto', n: stats.enContacto },
                  { label: 'Cerrados', n: stats.cerrado },
                ].map(s => (
                  <div className="stat-card" key={s.label}>
                    <div className="number">{s.n}</div>
                    <div className="label">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Table */}
            <div className="table-wrap">
              <div className="filters">
                {['Todos', 'Nuevo', 'En contacto', 'Cerrado', 'Archivado'].map(f => (
                  <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                    {f}
                  </button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div className="empty">
                  <div className="icon">📭</div>
                  No hay leads en esta categoría.
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Plan</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(lead => (
                      <tr key={lead.id}>
                        <td style={{ color: 'var(--text-muted)' }}>{lead.id}</td>
                        <td style={{ fontWeight: 500 }}>{lead.nombre}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{lead.email}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{lead.plan || '—'}</td>
                        <td>{statusBadge(lead.estado)}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {formatDate(lead.createdAt)}
                        </td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => setSelected(lead)}>
                            Ver →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          <div className="settings-page">
            <div className="page-header">
              <div>
                <div className="page-title">Configuración</div>
                <div className="page-sub">Gestión del sistema y notificaciones</div>
              </div>
            </div>

            <div style={{ maxWidth: 600, marginTop: 32 }}>
              <div className="stat-card" style={{ marginBottom: 24, padding: 24, textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Correo de Notificaciones</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
                  Las nuevas solicitudes se envían actualmente a:
                </p>
                <div style={{ background: '#000', padding: '12px 16px', borderRadius: 8, border: '1px solid #1a1a1a', color: 'var(--accent)', fontWeight: 600, marginBottom: 24 }}>
                  pulsowebb@gmail.com
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  Sin servidor Node no hay envío SMTP desde acá. Podés usar webhooks de Supabase o un servicio externo más adelante.
                </p>
              </div>

              <div className="stat-card" style={{ marginBottom: 24, padding: 24, textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '1rem' }}>Gestión de Planes</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
                  Personalizá los planes que aparecen en el formulario de la landing page.
                </p>
                
                <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
                  {planes.map((p, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', alignItems: 'center', gap: 12, padding: 12, 
                      background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid #1a1a1a' 
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{p.nombre}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>{p.prefijo} ${p.precio}</div>
                      </div>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        onClick={() => setEditingPlan({ ...p, idx })}
                      >✏️ Editar</button>
                      <button 
                        className="btn btn-danger btn-sm" 
                        style={{ padding: '0 10px' }}
                        onClick={() => {
                          setPlanes(planes.filter((_, i) => i !== idx));
                        }}
                      >✕</button>
                    </div>
                  ))}
                  <button 
                    className="btn btn-ghost btn-sm" 
                    style={{ border: '1px dashed #333', color: '#666' }}
                    onClick={() => setPlanes([...planes, { nombre: 'Nuevo Plan', precio: '0', items: [], order: planes.length + 1 }])}
                  >
                    + Agregar nuevo plan
                  </button>
                </div>

                <button 
                  className="btn btn-primary" 
                  disabled={planesLoading}
                  onClick={async () => {
                    setPlanesLoading(true);
                    try {
                      const s = requireSupabase();
                      const list = planes.filter((p) => p.nombre.trim() !== '');
                      const { error } = await s.rpc('admin_replace_plans', {
                        p_token: token,
                        p_plans: list,
                      });
                      if (error) throw new Error(error.message);
                      alert('Planes actualizados con éxito.');
                      load();
                    } catch (e) {
                      alert('Error: ' + e.message);
                    } finally {
                      setPlanesLoading(false);
                    }
                  }}
                >
                  {planesLoading ? 'Guardando...' : '💾 Guardar Cambios en Landing'}
                </button>
              </div>

              {editingPlan && (
                <PlanModal 
                  plan={editingPlan} 
                  onClose={() => setEditingPlan(null)} 
                  onSave={(updated) => {
                    const newPlanes = [...planes];
                    newPlanes[editingPlan.idx] = updated;
                    setPlanes(newPlanes);
                    setEditingPlan(null);
                  }} 
                />
              )}

              <div className="stat-card" style={{ padding: 24, textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Seguridad</h3>
                <div className="field">
                  <label>Token de Administrador (Actual)</label>
                  <input type="text" value="••••••••••••••••" readOnly style={{ background: '#000', cursor: 'default' }} />
                </div>
                <p style={{ fontSize: '0.75rem', color: '#555' }}>
                  El token de admin se guarda hasheado en Supabase (<code>app_settings.admin_token_hash</code>). Actualizalo con SQL en el panel de Supabase (ver <code>supabase/supabase_only.sql</code>).
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {selected && (
        <LeadModal
          lead={selected}
          token={token}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
