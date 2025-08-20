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
