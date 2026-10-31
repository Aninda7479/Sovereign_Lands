import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sovereign Lands | 3D Open-World Multiplayer Web3 Sandbox',
  description:
    'A 3D Third-Person GTA-style medieval kingdom. Claim sovereign on-chain parcels, construct citadels, harvest gold, and wage deterministic wars on Polygon Amoy.',
  keywords: ['Web3', 'Three.js', 'Open World', 'GTA-style', 'Sandbox', 'Blockchain Gaming', 'Polygon Amoy'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full w-full dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full w-full overflow-hidden bg-slate-950 text-slate-100 antialiased select-none">
        {children}
      </body>
    </html>
  );
}
