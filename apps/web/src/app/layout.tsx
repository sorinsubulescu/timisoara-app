import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import Navigation from '@/components/layout/Navigation';
import { appDescription, appTitle, isTransitStandalone } from '@/lib/features';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: isTransitStandalone ? `${appTitle} — Timișoara` : 'Timișoara — City of Roses',
  description: appDescription,
};

export const viewport: Viewport = {
  themeColor: '#fdfcfb',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ro">
      <body className={inter.className}>
        <Navigation>{children}</Navigation>
      </body>
    </html>
  );
}
