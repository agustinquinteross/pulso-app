'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Code2, Globe, Cpu, ArrowUpRight } from 'lucide-react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { submitLead, getPublicPlans } from '@/app/actions/adminData';

gsap.registerPlugin(ScrollTrigger);

/* ––– Marquee Ticker ––– */
const marqueeItems = [
  'DESARROLLO DE SOFTWARE',
  'DISEÑO DE PRODUCTO',
  'ARQUITECTURA CLOUD',
  'UX / UI DESIGN',
  'CONSULTORÍA TÉCNICA',
  'E-COMMERCE AVANZADO',
];

const MarqueeTicker = () => (
  <div className="marquee-wrap">
    <div className="marquee-track">
      {[...marqueeItems, ...marqueeItems].map((item, i) => (
        <span key={i} className="marquee-item">
          <span className="marquee-dot" />{item}
        </span>
      ))}
    </div>
  </div>
);

/* ––– Barras Animadas de Marca ––– */
const LogoBars = () => (
  <div className="logo-bars">
    {[28, 42, 18].map((h, i) => (
      <motion.div
        key={i}
        className="logo-bar"
        style={{ background: i === 1 ? 'var(--accent)' : 'var(--text)', height: h }}
        animate={{ height: [h * 0.4, h, h * 0.4] }}
        transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.25, ease: 'easeInOut' }}
      />
    ))}
  </div>
);

/* ––– Reveal de Título con GSAP ––– */
const Reveal = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  useEffect(() => {
    gsap.fromTo(
      ref.current,
      { y: 60, opacity: 0, skewY: 3 },
      { y: 0, opacity: 1, skewY: 0, duration: 1.1, delay, ease: 'power4.out',
        scrollTrigger: { trigger: ref.current, start: 'top 92%' } }
    );
  }, [delay]);
  return <div ref={ref}>{children}</div>;
};

/* ––– Elite Select Component ––– */
const EliteSelect = ({ label, name, options, value, onChange, placeholder = 'Seleccionar...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="field" ref={containerRef} style={{ position: 'relative', marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${isOpen ? 'var(--accent)' : 'var(--border)'}`, 
          borderRadius: '4px', padding: '12px 16px', color: value ? 'var(--text)' : 'var(--text-muted)', 
          fontFamily: 'Inter', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.3s'
        }}
      >
        <span>{value || placeholder}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} style={{ display: 'flex' }}>
          <ChevronRight size={16} style={{ transform: 'rotate(90deg)' }} />
        </motion.span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{ 
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', 
              background: '#111', border: '1px solid #222', borderRadius: '8px', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 100, overflow: 'hidden'
            }}
          >
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {options.map((opt) => (
                <div 
                  key={opt}
                  onClick={() => {
                    onChange({ target: { name, value: opt } });
                    setIsOpen(false);
                  }}
                  style={{ 
                    padding: '12px 16px', fontSize: '0.9rem', color: value === opt ? 'var(--accent)' : 'var(--text)', 
                    cursor: 'pointer', background: value === opt ? 'rgba(57, 255, 20, 0.05)' : 'transparent',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.target.style.background = value === opt ? 'rgba(57, 255, 20, 0.05)' : 'transparent'}
                >
                  {opt}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ––– Modal de Contacto ––– */
function ContactModal({ onClose, planDefault = '' }) {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', plan: planDefault, mensaje: '' });
  const [state, setState] = useState('idle'); // idle | sending | ok | error
  const [planes, setPlanes] = useState(['Básico ($350)', 'Pro ($1.800)', 'Premium ($4.000+)', 'A definir']);

  useEffect(() => {
    getPublicPlans()
      .then((data) => {
        if (Array.isArray(data)) setPlanes(data.map((p) => p.nombre));
      })
      .catch((err) => console.error('Error fetching plans for modal:', err));
  }, []);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setState('sending');
    try {
      const res = await submitLead({
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        plan: form.plan,
        mensaje: form.mensaje
      });
      if (!res.success) throw new Error(res.error);
      setState('ok');
    } catch (err) {
      console.error(err);
      setState('error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '48px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Contacto</p>
            <h2 style={{ fontFamily: 'Bricolage Grotesque', fontSize: '1.8rem', fontWeight: 800, textTransform: 'uppercase' }}>ARRANQUEMOS.</h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {state === 'ok' ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
            <h3 style={{ fontFamily: 'Bricolage Grotesque', fontSize: '1.5rem', textTransform: 'uppercase', marginBottom: '12px' }}>¡MENSAJE ENVIADO!</h3>
            <p style={{ color: 'var(--text-muted)' }}>Te respondemos en menos de 24hs.</p>
            <button onClick={onClose} style={{ marginTop: '32px', background: 'var(--accent)', color: '#000', fontFamily: 'Bricolage Grotesque', fontWeight: 800, padding: '14px 40px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cerrar</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {[['nombre', 'Nombre completo *', 'text', 'Juan López'], ['email', 'Email *', 'email', 'juan@empresa.com'], ['telefono', 'Teléfono (opcional)', 'tel', '+54 11 1234-5678']].map(([name, label, type, placeholder]) => (
              <div key={name} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>{label}</label>
                <input name={name} type={type} placeholder={placeholder} value={form[name]} onChange={handleChange} required={name !== 'telefono'}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '4px', padding: '12px 16px', color: 'var(--text)', fontFamily: 'Inter', fontSize: '0.9rem', outline: 'none' }} />
              </div>
            ))}
            <EliteSelect 
              label="Plan de interés"
              name="plan"
              value={form.plan}
              options={planes}
              onChange={handleChange}
              placeholder="Seleccionar plan..."
            />
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Contános sobre tu proyecto</label>
              <textarea name="mensaje" rows={4} value={form.mensaje} onChange={handleChange} placeholder="Qué querés construir, en qué etapa estás..."
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '4px', padding: '12px 16px', color: 'var(--text)', fontFamily: 'Inter', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }} />
            </div>
            {state === 'error' && <p style={{ color: '#ff4444', fontSize: '0.85rem', marginBottom: '16px' }}>Error al enviar. Intentá de nuevo.</p>}
            <button type="submit" disabled={state === 'sending'}
              style={{ width: '100%', background: 'var(--accent)', color: '#000', fontFamily: 'Bricolage Grotesque', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '16px', border: 'none', borderRadius: '4px', cursor: state === 'sending' ? 'not-allowed' : 'pointer' }}>
              {state === 'sending' ? 'Enviando...' : 'Enviar solicitud →'}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function Home() {
  const [contactOpen, setContactOpen] = useState(false);
  const [contactPlan, setContactPlan] = useState('');

  const [planes, setPlanes] = useState([]);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  useEffect(() => {
    getPublicPlans()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPlanes(data);
        }
      })
      .catch((err) => console.error('Error fetching plans:', err));
  }, []);

  const setPlanActive = (planName) => {
    setContactPlan(planName);
    setContactOpen(true);
  };

  const servicios = [
    { num: '01', icono: <Code2 size={28} />, titulo: 'Desarrollo de Software', desc: 'Construimos sistemas robustos y escalables con tecnologías de última generación.' },
    { num: '02', icono: <Globe size={28} />, titulo: 'Diseño de Producto', desc: 'Interfaces que priorizan la experiencia del usuario y la conversión de negocio.' },
    { num: '03', icono: <Cpu size={28} />, titulo: 'Consultoría Técnica', desc: 'Acompañamos equipos para escalar, optimizar y madurar su stack tecnológico.' },
  ];

  return (
    <>
      <nav>
        <div className="nav-brand">
          <LogoBars />
          <span style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.03em', textTransform: 'uppercase' }}>
            PULSO<span style={{ color: 'var(--accent)' }}>.</span>APP
          </span>
        </div>
        <ul className="nav-links">
          <li><a href="#servicios">Servicios</a></li>
          <li><a href="#nosotros">Nosotros</a></li>
          <li><a href="#planes">Planes</a></li>
          <li><a href="#contacto" className="active">Contacto</a></li>
        </ul>
      </nav>

      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 'calc(var(--space-16) + 64px)', position: 'relative', overflow: 'hidden' }}>
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div style={{ maxWidth: '1100px', position: 'relative', zIndex: 1 }}>
          <motion.p className="label accent-label" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} style={{ marginBottom: 'var(--space-4)' }}>
            Estudio de Ingeniería Digital // Catamarca
          </motion.p>
          <motion.h1 className="display-xl" initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }} style={{ marginBottom: 'var(--space-8)' }}>
            SOLUCIONES<br />
            <span style={{ WebkitTextStroke: '1px rgba(255,255,255,0.3)', color: 'transparent' }}>DIGITALES</span><br />
            DE ÉLITE.
          </motion.h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-8)', alignItems: 'flex-start' }}>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} style={{ maxWidth: '480px', fontSize: '1.15rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Transformamos ideas en productos digitales que escalan. Precisión técnica, diseño de primer nivel y estrategia orientada a resultados.
            </motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} style={{ borderLeft: '2px solid var(--accent)', paddingLeft: 'var(--space-4)' }}>
              <p className="label" style={{ marginBottom: 'var(--space-2)' }}>Slogan oficial</p>
              <h2 className="display-md" style={{ color: 'var(--accent)' }}>DESARROLLO CON<br />PULSO PROPIO.</h2>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} style={{ marginTop: 'var(--space-8)', display: 'flex', gap: 'var(--space-3)' }}>
            <button className="btn btn-primary" onClick={() => document.getElementById('planes')?.scrollIntoView({ behavior: 'smooth' })}>
              Ver planes <ChevronRight size={16} />
            </button>
            <button className="btn btn-outline" onClick={() => document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' })}>
              Nuestros servicios
            </button>
          </motion.div>
        </div>
      </section>

      <MarqueeTicker />

      <section id="servicios" style={{ background: '#080808' }}>
        <div className="container">
          <Reveal>
            <p className="label" style={{ marginBottom: 'var(--space-4)' }}>Lo que construimos</p>
            <h2 className="display-lg" style={{ marginBottom: 'var(--space-12)' }}>SERVICIOS</h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-4)' }}>
            {servicios.map((s, i) => (
              <Reveal key={i} delay={i * 0.15}>
                <div className="card" style={{ height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
                    <span className="label">{s.num}</span>
                    <span style={{ color: 'var(--accent)' }}>{s.icono}</span>
                  </div>
                  <h3 style={{ fontSize: '1.6rem', marginBottom: 'var(--space-3)', letterSpacing: '-0.02em' }}>{s.titulo}</h3>
                  <div className="divider" />
                  <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-3)', lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="nosotros">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'revert', gap: 'var(--space-12)', alignItems: 'center', '@media(min-width: 900px)': { gridTemplateColumns: '1fr 1fr' } }}>
            <Reveal>
              <p className="label" style={{ marginBottom: 'var(--space-4)' }}>Quiénes somos</p>
              <h2 className="display-lg" style={{ marginBottom: 'var(--space-6)' }}>EL MÉTODO<br />PULSO.</h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p style={{ fontSize: '1.2rem', lineHeight: 1.9, color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>
                No fabricamos software en serie. Cada proyecto es una colaboración estratégica donde entendemos tu negocio, definimos el problema real y construimos la solución más precisa posible.
              </p>
              <p style={{ fontSize: '1.2rem', lineHeight: 1.9, color: 'var(--text-muted)' }}>
                Somos un equipo pequeño y altamente especializado. Aceptamos pocos proyectos para dar lo mejor en cada uno.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="planes" style={{ background: '#080808' }}>
        <div className="container">
          <Reveal>
            <p className="label" style={{ marginBottom: 'var(--space-4)' }}>Inversión</p>
            <h2 className="display-lg" style={{ marginBottom: 'var(--space-4)' }}>PLANES Y<br />PRECIOS.</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-12)', maxWidth: 480 }}>
              Elegí el plan que mejor se adapte a tu etapa de crecimiento. Todos incluyen diseño premium y entrega a tiempo.
            </p>
          </Reveal>
          <div className="pricing-grid">
            {planes.map((p, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className={`pricing-card ${p.destacado ? 'featured' : ''}`}>
                  {p.destacado && <span className="pricing-badge">MÁS ELEGIDO</span>}
                  <p className="label">{p.nombre}</p>
                  <div style={{ margin: 'var(--space-4) 0 var(--space-2)' }}>
                    <span style={{ fontSize: '0.7rem', fontFamily: 'Inter', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{p.prefijo}</span>
                    <div className="pricing-amount" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginTop: '4px' }}>$ {p.precio}</div>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: 'var(--space-2)', textTransform: 'uppercase' }}>Entrega: {p.entrega}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-4)' }}>{p.desc}</p>
                  <ul className="pricing-features">
                    {p.items?.map((item, ii) => (
                      <li key={ii}><Check size={13} color="var(--accent)" /> {item}</li>
                    ))}
                  </ul>
                  <button onClick={() => setPlanActive(p.nombre)} className={`btn ${p.destacado ? 'btn-primary' : 'btn-outline'}`} style={{ width: '100%', justifyContent: 'center' }}>
                    Seleccionar plan <ArrowUpRight size={14} />
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="contacto">
        <div className="container" style={{ textAlign: 'center' }}>
          <Reveal>
            <p className="label" style={{ marginBottom: 'var(--space-4)' }}>¿Arrancamos?</p>
            <h2 className="display-lg" style={{ marginBottom: 'var(--space-6)' }}>HABLEMOS DE<br />TU PROYECTO.</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto var(--space-8)' }}>
              Contanos sobre tu idea y en 24hs te respondemos con una propuesta inicial sin cargo.
            </p>
            <button className="btn btn-primary" style={{ fontSize: '1rem', padding: '1.2rem 4rem' }} onClick={() => setContactOpen(true)}>
              Iniciar conversación <ChevronRight size={18} />
            </button>
          </Reveal>
        </div>
      </section>

      <footer style={{ padding: 'var(--space-8) var(--side-pad)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <LogoBars />
          <span style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase' }}>
            PULSO<span style={{ color: 'var(--accent)' }}>.</span>APP
          </span>
        </div>
        <p className="label">Desarrollo con Pulso Propio. — Catamarca, 2026</p>
        <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
          <a href="#servicios" className="label" style={{ transition: 'color 0.3s' }}>Servicios</a>
          <a href="#planes" className="label" style={{ transition: 'color 0.3s' }}>Planes</a>
          <a href="#contacto" className="label" style={{ color: 'var(--accent)' }}>Contacto</a>
        </div>
      </footer>

      <AnimatePresence>
        {contactOpen && <ContactModal onClose={() => setContactOpen(false)} planDefault={contactPlan} />}
      </AnimatePresence>
    </>
  );
}
