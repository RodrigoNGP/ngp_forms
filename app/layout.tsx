import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NGP Forms',
  description: 'Crie formulários interativos ao estilo Typeform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
