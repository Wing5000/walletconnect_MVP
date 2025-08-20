import './globals.css';
import type { Metadata } from 'next';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Email Wallet MVP',
  description: 'RainbowKit + Privy (email wallet) z zaślepkami ID',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
