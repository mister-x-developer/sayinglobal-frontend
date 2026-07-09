/**
 * Follow store — optimistic follow/unfollow with localStorage persistence.
 * Uses id (number) as the identifier.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { usersApi } from '../api/users';

interface FollowState {
  following: number[];
  isFollowing: (publicId: number) => boolean;
  follow: (publicId: number) => Promise<void>;
  unfollow: (publicId: number) => Promise<void>;
  toggle: (publicId: number) => Promise<boolean>;
  hydrateFromIds: (ids: number[]) => void;
  /**
   * F-33 fix (web sign-out cleanup residue): reset in-memory follow set so
   * a sibling render after sign-out does not still show the previous user's
   * follow buttons in the "following" state. The persist middleware's
   * localStorage entry is also cleared by the auth-store logout path.
   */
  reset: () => void;
  syncLocalState: (publicId: number, isFollowing: boolean) => void;
}

export const useFollowStore = create<FollowState>()(
  persist(
    (set, get) => ({
      following: [],

      isFollowing: (publicId) => get().following.includes(publicId),

      follow: async (publicId) => {
        set((s) => ({
          following: s.following.includes(publicId) ? s.following : [...s.following, publicId],
        }));
        try {
          await usersApi.follow(publicId);
        } catch {}
      },

      unfollow: async (publicId) => {
        set((s) => ({ following: s.following.filter((x) => x !== publicId) }));
        try {
          await usersApi.unfollow(publicId);
        } catch {}
      },

      toggle: async (publicId) => {
        const isFollowing = get().following.includes(publicId);
        if (isFollowing) await get().unfollow(publicId);
        else await get().follow(publicId);
        return !isFollowing;
      },

      hydrateFromIds: (ids) => set({ following: ids }),

      syncLocalState: (publicId, isFollowing) => {
        set((s) => {
          const currentlyFollowing = s.following.includes(publicId);
          if (isFollowing && !currentlyFollowing) {
            return { following: [...s.following, publicId] };
          }
          if (!isFollowing && currentlyFollowing) {
            return { following: s.following.filter((id) => id !== publicId) };
          }
          return s; // no change
        });
      },

      reset: () => set({ following: [] }),
    }),
    { name: 'sayin-follow' }
  )
);
