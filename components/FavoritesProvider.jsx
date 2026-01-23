'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { data: session, status } = useSession();
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());
  const [hydrating, setHydrating] = useState(true);

  const isAuthed = status === 'authenticated';

  const refetch = useCallback(async () => {
    if (!isAuthed) {
      setFavoriteIds(new Set());
      setHydrating(false);
      return;
    }

    try {
      setHydrating(true);
      const res = await fetch('/api/favorites', { cache: 'no-store' });

      if (!res.ok) {
        // Keep UI safe, do not throw
        setFavoriteIds(new Set());
        return;
      }

      const data = await res.json();
      const ids = Array.isArray(data?.ids) ? data.ids : [];
      setFavoriteIds(new Set(ids.map(String)));
    } finally {
      setHydrating(false);
    }
  }, [isAuthed]);

  useEffect(() => {
    // Wait until NextAuth resolves session, prevents the initial 500/empty hydration glitch
    if (status === 'loading') return;
    refetch();
  }, [status, refetch]);

  const isFavorite = useCallback(
    (listingId) => favoriteIds.has(String(listingId)),
    [favoriteIds],
  );

  const toggleFavorite = useCallback(
    async (listingId) => {
      const id = String(listingId);

      if (!isAuthed) {
        await signIn('google');
        return { ok: false, reason: 'not_authed' };
      }

      const wasFav = favoriteIds.has(id);

      // Optimistic update
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFav) next.delete(id);
        else next.add(id);
        return next;
      });

      try {
        const res = await fetch('/api/favorites', {
          method: wasFav ? 'DELETE' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId: id }),
        });

        if (!res.ok) {
          // Revert on failure
          setFavoriteIds((prev) => {
            const next = new Set(prev);
            if (wasFav) next.add(id);
            else next.delete(id);
            return next;
          });
          return { ok: false };
        }

        return { ok: true };
      } catch (e) {
        // Revert on failure
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (wasFav) next.add(id);
          else next.delete(id);
          return next;
        });
        return { ok: false };
      }
    },
    [favoriteIds, isAuthed],
  );

  const value = useMemo(
    () => ({
      isAuthed,
      hydrating,
      favoriteIds,
      isFavorite,
      toggleFavorite,
      refetch,
    }),
    [isAuthed, hydrating, favoriteIds, isFavorite, toggleFavorite, refetch],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used inside <FavoritesProvider>');
  return ctx;
}