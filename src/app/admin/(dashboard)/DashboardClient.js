'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateLeadEstado, deleteLead, replacePlans } from '@/app/actions/adminData';
import { logoutAction } from '@/app/actions/adminAuth';

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

function LeadModal({ lead, onClose, onUpdate }) {
  const [estado, setEstado] = useState(lead.estado);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateLeadEstado(lead.id, estado);
      if (!res.success) throw new Error(res.error);
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
      const res = await deleteLead(lead.id);
      if (!res.success) throw new Error(res.error);
      onUpdate(lead.id, null);
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
          <span className="detail-value">{formatDateTime(lead.created_at)}</span>
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
          <textarea rows={2} value={edit.descripcion || ''} onChange={e => setEdit({ ...edit, descripcion: e.target.value })} />
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

export default function DashboardClient({ initialLeads, initialPlans, initialStats }) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [stats, setStats] = useState(initialStats);
  const [planes, setPlanes] = useState(initialPlans);
  
  const [filter, setFilter] = useState('Todos');
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('Solicitudes');
  const [planesLoading, setPlanesLoading] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const filtered = filter === 'Todos' ? leads : leads.filter(l => l.estado === filter);

  const handleUpdate = (id, estado) => {
    let newLeads = [];
    if (estado === null) {
      newLeads = leads.filter(l => l.id !== id);
    } else {
      newLeads = leads.map(l => l.id === id ? { ...l, estado } : l);
    }
    setLeads(newLeads);
    
    // Recalc stats locally
    setStats({
      total: newLeads.length,
      nuevo: newLeads.filter(l => l.estado === 'Nuevo').length,
      enContacto: newLeads.filter(l => l.estado === 'En contacto').length,
      cerrado: newLeads.filter(l => l.estado === 'Cerrado').length,
    });
  };

  const handleLogout = async () => {
    await logoutAction();
    router.push('/admin/login');
  };

  const handleSaveAllPlans = async () => {
    setPlanesLoading(true);
    try {
      const res = await replacePlans(planes);
      if (!res.success) throw new Error(res.error);
      alert('Planes actualizados con éxito en la base de datos.');
      router.refresh();
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setPlanesLoading(false);
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="brand name">PULSO<span style={{ color: 'var(--accent)' }}>.</span>APP</div>
          <div className="sub">Panel de Gestión</div>
        </div>

        <div className="sidebar-nav">
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
        </div>

        <div className="sidebar-footer">
          <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={handleLogout}>
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
              <button className="btn btn-ghost btn-sm" onClick={() => router.refresh()}>
                ↻ Actualizar
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
                        <td style={{ color: 'var(--text-muted)' }}>{lead.id.slice(0, 8)}</td>
                        <td style={{ fontWeight: 500 }}>{lead.nombre}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{lead.email}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{lead.plan || '—'}</td>
                        <td>{statusBadge(lead.estado)}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {formatDate(lead.created_at)}
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
                <div className="page-sub">Gestión del sistema y planes</div>
              </div>
            </div>

            <div style={{ maxWidth: 600, marginTop: 32 }}>
              <div className="stat-card" style={{ marginBottom: 24, padding: 24, textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '1rem' }}>Gestión de Planes</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 20px' }}>
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
                    style={{ border: '1px dashed #333', color: '#666', width: '100%', padding: '12px' }}
                    onClick={() => setPlanes([...planes, { nombre: 'Nuevo Plan', precio: '0', items: [], orden: planes.length + 1 }])}
                  >
                    + Agregar nuevo plan
                  </button>
                </div>

                <button 
                  className="btn btn-primary" 
                  disabled={planesLoading}
                  onClick={handleSaveAllPlans}
                >
                  {planesLoading ? 'Guardando...' : '💾 Guardar Cambios en Landing'}
                </button>
              </div>
              
              <div className="stat-card" style={{ padding: 24, textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Seguridad</h3>
                <p style={{ fontSize: '0.75rem', color: '#888' }}>
                  La validación de Token ahora se realiza 100% segura usando <b>Next.js Server Actions</b> verificando el archivo .env.local de la aplicación directamente con el backend.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {selected && (
        <LeadModal
          lead={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}

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
    </div>
  );
}
