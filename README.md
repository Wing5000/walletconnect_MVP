# Email Wallet MVP — Next.js + RainbowKit + Privy (zaślepki)

Prosty MVP frontu: modal portfeli (RainbowKit) + logowanie e‑mailem (Privy, embedded wallet).  
Na start używamy **zaślepek** (`WC_PROJECT_ID_PLACEHOLDER` i `PRIVY_APP_ID_PLACEHOLDER`) — UI działa, a po podmianie ID wszystko rusza bez zmian w kodzie.

---

## 0) Inicjalizacja

```bash
npx create-next-app@latest email-wallet-mvp --ts --eslint --src-dir false --app --tailwind false
cd email-wallet-mvp

npm i @rainbow-me/rainbowkit wagmi viem @tanstack/react-query @privy-io/react-auth

# .env.local z zaślepkami
echo "NEXT_PUBLIC_WC_PROJECT_ID=WC_PROJECT_ID_PLACEHOLDER" >> .env.local
echo "NEXT_PUBLIC_PRIVY_APP_ID=PRIVY_APP_ID_PLACEHOLDER" >> .env.local
```

---

## 1) Struktura plików

```
email-wallet-mvp/
  app/
    layout.tsx
    page.tsx
    providers.tsx
    globals.css
  .env.local
  package.json
  tsconfig.json
  next.config.js
```

---

## 2) Pliki — wklej 1:1

### `app/providers.tsx`
```tsx
'use client';

/**
 * Globalni providerzy frontu:
 * - RainbowKit + Wagmi (portfele EVM, modal Connect)
 * - Privy (logowanie e-mailem i embedded wallet) — włączamy tylko, gdy nie ma placeholdera
 * - TanStack Query (cache)
 *
 * UWAGA: Na starcie używamy ZAŚLEPEK z .env.local.
 * Po podmianie na prawdziwe ID wszystko zadziała bez zmian w kodzie.
 */

import { ReactNode } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, http } from 'wagmi';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { moonbeam, moonriver, moonbaseAlpha } from 'wagmi/chains';
import { PrivyProvider } from '@privy-io/react-auth';

const queryClient = new QueryClient();

// === ENV + FLAGA ZAŚLEPEK ===
const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'WC_PROJECT_ID_PLACEHOLDER';
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'PRIVY_APP_ID_PLACEHOLDER';
const PRIVY_READY = PRIVY_APP_ID !== 'PRIVY_APP_ID_PLACEHOLDER';

// === Transports: własne RPC (w prod podmień na swoje) ===
const transports = {
  [moonbeam.id]: http('https://rpc.api.moonbeam.network'),
  [moonriver.id]: http('https://rpc.api.moonriver.moonbeam.network'),
  [moonbaseAlpha.id]: http('https://rpc.api.moonbase.moonbeam.network'),
};

// === Konfiguracja wagmi/rainbowkit (działa z placeholderem, ale nie połączy) ===
const wagmiConfig = getDefaultConfig({
  appName: 'Email Wallet MVP',
  projectId: WC_PROJECT_ID, // <— ZAŚLEPKA na start
  chains: [moonbeam, moonriver, moonbaseAlpha],
  ssr: true,
  transports,
});

function CoreProviders({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider initialChain={moonbaseAlpha}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

/**
 * Główny Provider:
 * - Jeśli PRIVY_APP_ID = placeholder → NIE owijamy PrivyProviderem (UI pokaże baner).
 * - Jeśli jest prawdziwe → dołączamy Privy i front ma pełną funkcjonalność e-mail.
 */
export default function Providers({ children }: { children: ReactNode }) {
  if (!PRIVY_READY) {
    return <CoreProviders>{children}</CoreProviders>;
  }
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email'], // można dodać 'sms'/'google' itp. później
        embeddedWallets: { createOnLogin: 'users-without-wallets' },
        defaultChain: moonbaseAlpha,
        supportedChains: [moonbeam, moonriver, moonbaseAlpha],
      }}
    >
      <CoreProviders>{children}</CoreProviders>
    </PrivyProvider>
  );
}
```

### `app/layout.tsx`
```tsx
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
```

### `app/page.tsx`
```tsx
'use client';

/**
 * Strona główna:
 * - Pokazuje ConnectButton (RainbowKit)
 * - Sekcja "Email wallet" ma dwa warianty:
 *   • Stub (gdy PRIVY_APP_ID to ZAŚLEPKA) — przycisk nieaktywny + instrukcja
 *   • Real (gdy PRIVY jest gotowe) — prawdziwy login e-mailem i adres embedded wallet
 *
 * Dzięki temu front odpala się "od razu", a Ty tylko podmieniasz ID w .env.local.
 */

import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { ReactNode } from 'react';

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'PRIVY_APP_ID_PLACEHOLDER';
const PRIVY_READY = PRIVY_APP_ID !== 'PRIVY_APP_ID_PLACEHOLDER';

// ——— Wersja STUB: bez PrivyProvider/hooków (bezpieczne na placeholderach)
function EmailWalletStub() {
  return (
    <section style={{ display: 'grid', gap: 8, placeItems: 'center' }}>
      <h2>Portfel e-mail (stub)</h2>
      <button
        disabled
        title="Podmień PRIVY_APP_ID w .env.local, aby włączyć"
        style={{
          padding: '10px 16px',
          borderRadius: 12,
          border: '1px solid #ddd',
          cursor: 'not-allowed',
          opacity: 0.6,
        }}
      >
        Zaloguj / utwórz portfel e-mailem
      </button>
      <small style={{ color: '#666', textAlign: 'center', maxWidth: 520 }}>
        Zaślepka aktywna. Aby włączyć logowanie e-mailem, ustaw{' '}
        <code>NEXT_PUBLIC_PRIVY_APP_ID</code> w <code>.env.local</code>, zapisz plik
        i odśwież stronę.
      </small>
    </section>
  );
}

// ——— Wersja REAL: renderujemy tylko, jeśli PrivyProvider jest włączony
function EmailWalletReal() {
  // Import wewnątrz komponentu, żeby nie ładować hooków Privy na stubie
  // (unikamy błędu "usePrivy must be used within PrivyProvider").
  const { usePrivy, useWallets } = require('@privy-io/react-auth') as typeof import('@privy-io/react-auth');
  const { login, logout, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const emailWallet = wallets.find((w: any) => w.walletClientType === 'privy');
  const addr = emailWallet?.address as string | undefined;

  return (
    <section style={{ display: 'grid', gap: 8, placeItems: 'center' }}>
      <h2>Portfel e-mailem</h2>
      <button
        onClick={() => login()}
        style={{
          padding: '10px 16px',
          borderRadius: 12,
          border: '1px solid #ddd',
          cursor: 'pointer',
        }}
      >
        Zaloguj / utwórz portfel e-mailem
      </button>

      {authenticated && (
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <p>Zalogowano jako: {user?.email?.address}</p>
          {addr && (
            <p>
              Adres embedded wallet:&nbsp;
              <code style={{ fontSize: 12 }}>{addr}</code>
            </p>
          )}
          <button
            onClick={() => logout()}
            style={{
              marginTop: 8,
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid #ddd',
              cursor: 'pointer',
            }}
          >
            Wyloguj
          </button>
        </div>
      )}
    </section>
  );
}

function EnvBanner(): ReactNode {
  const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'WC_PROJECT_ID_PLACEHOLDER';
  const WC_READY = WC_PROJECT_ID !== 'WC_PROJECT_ID_PLACEHOLDER';

  // Jeśli któryś ID to placeholder — pokaż krótką informację na froncie
  if (PRIVY_READY && WC_READY) return null;

  return (
    <div
      style={{
        background: '#fff7e6',
        border: '1px solid #ffd591',
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 13,
        color: '#8c6d1f',
        maxWidth: 720,
      }}
    >
      <b>Zaślepki aktywne:</b>{' '}
      {!WC_READY && <span>WalletConnect <code>projectId</code> nie ustawiony. </span>}
      {!PRIVY_READY && <span>Privy <code>appId</code> nie ustawiony. </span>}
      Podmień wartości w <code>.env.local</code>, aby włączyć pełną funkcjonalność.
    </div>
  );
}

export default function Page() {
  return (
    <main
      style={{
        display: 'grid',
        gap: 20,
        placeItems: 'center',
        minHeight: '70vh',
        padding: 24,
      }}
    >
      <h1>Email Wallet MVP (Moonbeam)</h1>

      {/* Modal RainbowKit (zadziała po podmianie WC projectId) */}
      <ConnectButton />

      {/* Sekcja e-mail: real/stub zależnie od ENV */}
      {PRIVY_READY ? <EmailWalletReal /> : <EmailWalletStub />}

      {EnvBanner()}
    </main>
  );
}
```

### `app/globals.css`
```css
/* Minimalny reset – zostaw jak jest lub dołóż własny styl */
* { box-sizing: border-box; }
html, body { padding: 0; margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
code { background: #f5f5f5; padding: 2px 4px; border-radius: 4px; }
```

---

## 3) Uruchomienie

```bash
npm run dev
# http://localhost:3000
```

---

## 4) Włączenie pełnej funkcjonalności

1. Podmień zaślepki w `.env.local`:
   - `NEXT_PUBLIC_WC_PROJECT_ID=<prawdziwy projectId z WalletConnect Cloud>`
   - `NEXT_PUBLIC_PRIVY_APP_ID=<prawdziwy appId z Privy>`
2. Zapisz plik i odśwież — zniknie baner „Zaślepki aktywne”.
3. (Prod) Podmień RPC w `providers.tsx` na własne (Alchemy/QuickNode/Blast).

---

## 5) Co dalej (opcjonalnie)
- Dodać wysyłkę transakcji z embedded wallet (wagmi lub @privy-io/wagmi).
- Pokazać saldo i przełączanie łańcuchów.
- Dodać logowanie SMS/social w Privy.
- Zintegrować SIWE dla backendowej autoryzacji.
```
