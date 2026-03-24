import './globals.css';

export const metadata = {
  title: 'PULSO.APP | Soluciones Digitales de Élite',
  description: 'Estudio de Ingeniería Digital en Catamarca. Transformamos ideas en productos digitales que escalan.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
