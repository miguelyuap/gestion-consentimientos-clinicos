import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gestión de Consentimientos Clínicos y Pertenencias — GST-SOFTWARE',
  description:
    'Plataforma clínica de consentimientos informados, recibo de pertenencias, firma táctil e historia clínica bajo normativa colombiana (Ley 1581/2012, Res. 1995/1999, Ley 527/1999).',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
