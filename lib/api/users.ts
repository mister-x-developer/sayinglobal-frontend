/**
 * Users / Sellers / Follow API.
 * baseURL is `<API>/api`, so endpoints below start at `/users/...`
 */

import apiClient, { handleApiError } from './client';
import type { User } from '../store/auth';

export interface SellerSummary {
  public_id: number;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  trust_score?: number;
  followers_count?: number;
  following_count?: number;
  active_listings_count?: number;
  sold_listings_count?: number;
  is_following?: boolean;
}

export const usersApi = {
  async me(): Promise<User | null> {
    try {
      const res = await apiClient.get<User>('/users/profile/');
      return res.data;
    } catch {
      return null;
    }
  },

  async detail(publicId: number | string): Promise<SellerSummary | null> {
    try {
      const res = await apiClient.get<SellerSummary>(`/users/profile/${publicId}/`);
      return res.data;
    } catch {
      return null;
    }
  },

  async updateProfile(data: Partial<User> | FormData): Promise<User> {
    const isForm = typeof FormData !== 'undefined' && data instanceof FormData;
    try {
      const res = await apiClient.put<User>(
        '/users/profile/update/',
        data,
        isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
      );
      return res.data;
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },

  async settings() {
    try {
      const res = await apiClient.get('/users/settings/');
      return res.data;
    } catch {
      return null;
    }
  },

  async updateSettings(data: Record<string, unknown>) {
    try {
      const res = await apiClient.put('/users/settings/update/', data);
      return res.data;
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },

  async follow(publicId: number | string) {
    try {
      const res = await apiClient.post(`/users/follow/${publicId}/`);
      return res.data;
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },

  async unfollow(publicId: number | string) {
    try {
      const res = await apiClient.post(`/users/unfollow/${publicId}/`);
      return res.data;
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },

  async followers(): Promise<SellerSummary[]> {
    try {
      const res = await apiClient.get<SellerSummary[]>('/users/followers/');
      return res.data ?? [];
    } catch {
      return [];
    }
  },

  async following(): Promise<SellerSummary[]> {
    try {
      const res = await apiClient.get<SellerSummary[]>('/users/following/');
      return res.data ?? [];
    } catch {
      return [];
    }
  },

  /**
   * List sellers (marketplace users). Server-side endpoint with full
   * pagination + search support. Falls back to listings-aggregation if
   * the dedicated endpoint is unavailable on older backend versions.
   */
  async listSellers(opts: {
    q?: string;
    hasActive?: boolean;
    page?: number;
    pageSize?: number;
    lat?: number;
    lng?: number;
    radius_km?: number;
  } = {}): Promise<{
    results: SellerSummary[];
    count: number;
    mode?: string;
    radius_km?: number | null;
  }> {
    try {
      const res = await apiClient.get('/users/sellers/', {
        params: {
          q: opts.q || undefined,
          has_active: opts.hasActive ? 'true' : undefined,
          page: opts.page ?? 1,
          page_size: opts.pageSize ?? 20,
          lat: opts.lat,
          lng: opts.lng,
          radius_km: opts.radius_km,
        },
      });
      return {
        results: (res.data?.results ?? []) as SellerSummary[],
        count: res.data?.count ?? 0,
        mode: res.data?.mode,
        radius_km: res.data?.radius_km,
      };
    } catch {
      // Legacy fallback — aggregate from listings.
      try {
        const res = await apiClient.get('/listings/', { params: { page_size: 100 } });
        const data = res.data;
        const items: any[] = Array.isArray(data) ? data : data?.results ?? [];
        const map = new Map<number, SellerSummary>();
        for (const item of items) {
          const seller = item?.seller;
          if (!seller || typeof seller.public_id !== 'number') continue;
          if (!map.has(seller.public_id)) {
            map.set(seller.public_id, {
              public_id: seller.public_id,
              full_name: seller.full_name,
              avatar_url: seller.avatar_url,
              bio: seller.bio,
              trust_score: seller.trust_score,
              followers_count: seller.followers_count,
              following_count: seller.following_count,
              active_listings_count: seller.active_listings_count,
              sold_listings_count: seller.sold_listings_count,
            });
          }
        }
        const arr = Array.from(map.values());
        return { results: arr, count: arr.length };
      } catch {
        return { results: [], count: 0 };
      }
    }
  },

  /**
   * Read terms-acceptance status for the signed-in user.
   */
  async getTerms(): Promise<{
    accepted: boolean;
    accepted_at: string | null;
    version: string;
    current_version: string;
  } | null> {
    try {
      const res = await apiClient.get('/users/auth/terms/');
      return res.data;
    } catch {
      return null;
    }
  },

  /**
   * Submit terms acceptance. Idempotent on the backend.
   */
  async acceptTerms(version?: string) {
    const res = await apiClient.post('/users/auth/terms/', version ? { version } : {});
    return res.data;
  },
};
