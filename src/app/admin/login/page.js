'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/app/actions/adminAuth';

export default function LoginPage() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Usamos Server Actions para verificar sin depender de Supabase RPC
      const formData = new FormData();
      formData.append('token', token);
      const res = await loginAction(formData);

      if (res.success) {
        router.push('/admin');
      } else {
        setError(res.error || 'Token incorrecto.');
      }
    } catch (err) {
      setError('Error al conectar con el servidor.');
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
            <input 
              type="password" 
              value={token} 
              onChange={e => setToken(e.target.value)} 
              placeholder="••••••••••••" 
              required 
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Verificando...' : 'Ingresar al panel →'}
          </button>
        </form>
      </div>
    </div>
  );
}
