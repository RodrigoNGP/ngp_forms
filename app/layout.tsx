import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NGP Forms',
  description: 'Crie formulários interativos ao estilo Typeform',
};

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : null;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" style={{ background: '#0f0f1a' }}>
      <head>
        {/* Preconnect to Supabase to shave ~150ms on first request */}
        {supabaseHost && <link rel="preconnect" href={supabaseHost} />}
        {supabaseHost && <link rel="dns-prefetch" href={supabaseHost} />}
        {/* Prevent white flash on form viewer */}
        <style>{`body{background:#0f0f1a;margin:0}`}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
