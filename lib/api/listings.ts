/**
 * Listings API
 * baseURL is `<API>/api`, so endpoints below start at `/listings/...`
 */

import apiClient, { handleApiError } from './client';

export interface ListingImage {
  id: string | number;
  image: string;
  image_url?: string;
  is_primary?: boolean;
  order?: number;
}

export interface ListingSeller {
  public_id: number;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  trust_score?: number;
  active_listings_count?: number;
  sold_listings_count?: number;
  followers_count?: number;
}

export interface Listing {
  public_id: number;
  seller: ListingSeller;
  category: { id?: string; name: string; name_uz?: string };
  title: string;
  title_uz?: string;
  title_uz_cyrl?: string;
  title_ru?: string;
  title_en?: string;
  description: string;
  price: number;
  currency: string;
  age_years?: number;
  age_months?: number;
  weight_kg?: number;
  gender?: 'male' | 'female';
  breed?: string;
  health_status?: string;
  vaccination_status?: string;
  quantity?: number;
  location: string;
  region: string;
  district?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  images: ListingImage[];
  primary_image?: ListingImage | null;
  status: string;
  is_featured?: boolean;
  is_negotiable?: boolean;
  view_count?: number;
  favorite_count?: number;
  share_count?: number;
  comment_count?: number;
  is_favorited?: boolean;
  rejection_reason?: string;
  rejection_reason_uz?: string;
  rejection_reason_uz_cyrl?: string;
  rejection_reason_ru?: string;
  rejection_reason_en?: string;
  created_at: string;
  updated_at?: string;
  published_at?: string | null;
  expires_at?: string | null;
  sold_at?: string | null;
  scheduled_delete_at?: string | null;
  rejected_at?: string | null;
}

/** Detail returns same shape as Listing — kept as alias for clarity. */
export type ListingDetail = Listing;

export interface ListingFilters {
  category?: string;
  min_price?: number;
  max_price?: number;
  region?: string;
  status?: string;
  gender?: string;
  search?: string;
  sort_by?: string;
  page?: number;
  page_size?: number;
}

export interface CreateListingPayload {
  category_id?: number | string;
  category?: string | number;
  title: string;
  description: string;
  price: number;
  currency?: string;
  age_years?: number;
  age_months?: number;
  weight_kg?: number;
  gender?: string;
  breed?: string;
  quantity?: number;
  location: string;
  region: string;
  district?: string;
  is_negotiable?: boolean;
}

export interface ListingsResponse {
  results: Listing[];
  count: number;
  page?: number;
  page_size?: number;
}

export const listingsApi = {
  async list(filters?: ListingFilters): Promise<ListingsResponse> {
    try {
      const res = await apiClient.get<ListingsResponse>('/listings/', { params: filters });
      return res.data;
    } catch {
      return { results: [], count: 0 };
    }
  },

  async adminList(filters?: ListingFilters): Promise<ListingsResponse> {
    try {
      const res = await apiClient.get<ListingsResponse>('/listings/admin/', { params: filters });
      return res.data;
    } catch {
      return { results: [], count: 0 };
    }
  },

  async my(): Promise<Listing[]> {
    try {
      const res = await apiClient.get<Listing[]>('/listings/my/');
      return res.data ?? [];
    } catch {
      return [];
    }
  },

  async favorites(): Promise<Listing[]> {
    try {
      const res = await apiClient.get<Listing[]>('/listings/favorites/');
      return res.data ?? [];
    } catch {
      return [];
    }
  },

  async detail(publicId: number | string): Promise<Listing | null> {
    try {
      const res = await apiClient.get<Listing>(`/listings/${publicId}/`);
      return res.data;
    } catch {
      return null;
    }
  },

  async create(payload: CreateListingPayload): Promise<Listing> {
    try {
      const res = await apiClient.post<Listing>('/listings/create/', payload);
      return res.data;
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },

  async update(publicId: number | string, payload: Partial<CreateListingPayload>): Promise<Listing> {
    try {
      const res = await apiClient.put<Listing>(`/listings/${publicId}/update/`, payload);
      return res.data;
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },

  async remove(publicId: number | string): Promise<void> {
    try {
      await apiClient.delete(`/listings/${publicId}/delete/`);
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },

  async toggleFavorite(publicId: number | string): Promise<{ is_favorited: boolean; message?: string }> {
    try {
      const res = await apiClient.post<{ is_favorited: boolean; message?: string }>(
        `/listings/${publicId}/favorite/`
      );
      return res.data;
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },

  async categories() {
    try {
      const res = await apiClient.get<Array<{
        id: number;
        slug: string;
        name_uz?: string;
        name_ru?: string;
        name_en?: string;
        listing_count?: number;
      }>>('/listings/categories/');
      
      const order = ['cattle', 'sheep', 'goats', 'horses', 'camels', 'poultry'];
      const data = res.data ?? [];
      
      return data.sort((a, b) => {
        const indexA = order.indexOf(a.slug);
        const indexB = order.indexOf(b.slug);
        
        if (indexA === -1 && indexB === -1) return a.slug.localeCompare(b.slug);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        
        return indexA - indexB;
      });
    } catch {
      return [];
    }
  },

  async byCategory(category: string): Promise<Listing[]> {
    try {
      const res = await apiClient.get<Listing[]>(`/listings/category/${category}/`);
      return res.data ?? [];
    } catch {
      return [];
    }
  },

  async search(query: string): Promise<Listing[]> {
    try {
      const res = await apiClient.get<Listing[]>('/listings/search/', { params: { q: query } });
      return res.data ?? [];
    } catch {
      return [];
    }
  },

  async uploadImage(
    listingId: number | string,
    file: File,
    isPrimary = false,
    onProgress?: (progress: number) => void
  ) {
    const fd = new FormData();
    fd.append('image', file);
    fd.append('is_primary', isPrimary ? 'true' : 'false');
    try {
      const res = await apiClient.post(`/listings/${listingId}/images/upload/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
        },
      });
      return res.data;
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },

  async deleteImage(imageId: string): Promise<void> {
    try {
      await apiClient.delete(`/listings/images/${imageId}/delete/`);
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },

  async listComments(listingId: number | string) {
    try {
      const res = await apiClient.get(`/listings/${listingId}/comments/`);
      const data = res.data;
      return Array.isArray(data) ? data : (data?.results ?? []);
    } catch {
      return [];
    }
  },

  async createComment(listingId: number | string, content: string, parent?: string) {
    try {
      const res = await apiClient.post(`/listings/${listingId}/comments/`, {
        content,
        parent: parent || null,
      });
      return res.data;
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },

  // ── Lifecycle / moderation actions ────────────────────────────────────────

  /** Owner: mark active listing as sold; starts the 30-day deletion window. */
  async markSold(publicId: number | string) {
    const res = await apiClient.post(`/listings/${publicId}/sold/`);
    return res.data;
  },

  /** Owner: cancel pending review and return to draft. */
  async cancelReview(publicId: number | string) {
    const res = await apiClient.post(`/listings/${publicId}/cancel-review/`);
    return res.data;
  },

  /** Owner or Admin: delete/archive a listing. */
  async delete(publicId: number | string) {
    const res = await apiClient.delete(`/listings/${publicId}/delete/`);
    return res.data;
  },

  /** Owner: restore a sold/expired listing. Resets the lifecycle to active. */
  async restore(publicId: number | string) {
    const res = await apiClient.post(`/listings/${publicId}/restore/`);
    return res.data;
  },

  /** Admin: approve a pending listing. */
  async approve(publicId: number | string) {
    const res = await apiClient.post(`/listings/${publicId}/approve/`);
    return res.data;
  },

  /** Bump a listing to the top */
  async bump(publicId: number | string) {
    const res = await apiClient.post(`/listings/${publicId}/bump/`);
    return res.data;
  },

  /** Admin: reject a listing with a reason. Backend auto-translates to 4 langs. */
  async reject(publicId: number | string, reason: string, locale?: string) {
    const res = await apiClient.post(`/listings/${publicId}/reject/`, {
      reason,
      locale,
    });
    return res.data;
  },

  /** Buyer confirms purchase with the code received from seller.
   *  Optionally provide star rating (1-5) and review.
   *  This makes the sale "confirmed" and contributes to seller's trust_score.
   */
  async confirmPurchase(code: string, score?: number, review?: string) {
    const res = await apiClient.post('/listings/confirm-purchase/', {
      code: code.toUpperCase(),
      score,
      review,
    });
    return res.data;
  },

  /** Admin only: pending buyer confirmations (codes not yet claimed by buyer) */
  async adminPendingConfirmations() {
    try {
      const res = await apiClient.get('/listings/admin/pending-confirmations/');
      return res.data?.results || [];
    } catch {
      return [];
    }
  },

  /** Public: list seller ratings + reviews thread. */
  async sellerRatings(userPublicId: number | string, page = 1, pageSize = 20) {
    try {
      const res = await apiClient.get(`/listings/seller/${userPublicId}/ratings/`, {
        params: { page, page_size: pageSize },
      });
      return res.data as {
        results: any[];
        count: number;
        average_score: number;
      };
    } catch {
      return { results: [], count: 0, average_score: 0 };
    }
  },

  /** Buyer: leave a 1-5 star rating + optional public review on a seller. */
  async rateSeller(payload: { seller: number; listing: number; score: number; review?: string }) {
    const res = await apiClient.post('/listings/rate/', payload);
    return res.data;
  },

  /**
   * Geo-aware "nearby" feed.
   *
   * Modes:
   *   - GPS:     pass `{ lat, lng, radius_km }` (default radius 50)
   *   - Region:  pass `{ region, district }` (text fallback)
   *
   * Optional `category` filters the feed (cattle/sheep/etc).
   * Result rows include a `distance_km` field in GPS mode.
   */
  async nearby(opts: {
    lat?: number;
    lng?: number;
    radius_km?: number;
    region?: string;
    district?: string;
    category?: string;
    page?: number;
    page_size?: number;
  }): Promise<{
    results: (Listing & { distance_km?: number })[];
    count: number;
    mode: 'gps' | 'region';
    radius_km: number | null;
  }> {
    try {
      const res = await apiClient.get('/listings/nearby/', { params: opts });
      return res.data;
    } catch {
      return { results: [], count: 0, mode: 'region', radius_km: null };
    }
  },
};
