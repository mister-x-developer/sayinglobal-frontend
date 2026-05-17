/**
 * Follow store — optimistic follow/unfollow with localStorage persistence.
 * Uses public_id (number) as the identifier.
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
    }),
    { name: 'sayin-follow' }
  )
);
