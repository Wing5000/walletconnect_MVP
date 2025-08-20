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
import { WagmiProvider, createConfig, http } from 'wagmi';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { moonbeam, moonriver, moonbaseAlpha } from 'wagmi/chains';
import { PrivyProvider } from '@privy-io/react-auth';

const queryClient = new QueryClient();

// === ENV + FLAGA ZAŚLEPEK ===
const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'WC_PROJECT_ID_PLACEHOLDER';
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'PRIVY_APP_ID_PLACEHOLDER';
const WC_READY = WC_PROJECT_ID !== 'WC_PROJECT_ID_PLACEHOLDER';
const PRIVY_READY = PRIVY_APP_ID !== 'PRIVY_APP_ID_PLACEHOLDER';

// === Transports: własne RPC (w prod podmień na swoje) ===
const transports = {
  [moonbeam.id]: http('https://rpc.api.moonbeam.network'),
  [moonriver.id]: http('https://rpc.api.moonriver.moonbeam.network'),
  [moonbaseAlpha.id]: http('https://rpc.api.moonbase.moonbeam.network'),
};

// === Konfiguracja wagmi/rainbowkit ===
// Gdy brakuje prawdziwego projectId → używamy stubu bez konektorów WC,
// co zapobiega próbom pobierania zewnętrznej konfiguracji (i błędom 403).
const wagmiConfig = WC_READY
  ? getDefaultConfig({
      appName: 'Email Wallet MVP',
      projectId: WC_PROJECT_ID,
      chains: [moonbeam, moonriver, moonbaseAlpha],
      ssr: true,
      transports,
    })
  : createConfig({
      chains: [moonbeam, moonriver, moonbaseAlpha],
      ssr: true,
      transports,
      connectors: [],
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
