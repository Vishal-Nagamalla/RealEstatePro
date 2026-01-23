'use client';

import { SessionProvider } from 'next-auth/react';
import { FavoritesProvider } from '@/components/FavoritesProvider';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <FavoritesProvider>{children}</FavoritesProvider>
    </SessionProvider>
  );
}