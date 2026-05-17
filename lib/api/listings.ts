/**
 * Listings API
 * baseURL is `<API>/api`, so endpoints below start at `/listings/...`
 */

import apiClient, { handleApiError } from './client';

export interface ListingImage {
  id: string | number;
  image: string;
  is_primary?: boolean;
  order?: number;
}

export interface ListingSeller {
  public_id: number;
  full_name: string;
  avatar_url?: string;
  trust_score?: number;
}

export interface Listing {
  public_id: number;
  seller: ListingSeller;
  category: { id?: string; name: string; name_uz?: string };
  title: string;
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
  location: string;
  region: string;
  district?: string;
  images: ListingImage[];
  status: string;
  is_featured?: boolean;
  is_negotiable?: boolean;
  view_count?: number;
  favorite_count?: number;
  comment_count?: number;
  is_favorited?: boolean;
  created_at: string;
  updated_at?: string;
  published_at?: string | null;
  expires_at?: string | null;
}

export interface ListingFilters {
  category?: string;
  min_price?: number;
  max_price?: number;
  region?: string;
  gender?: string;
  search?: string;
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
        name: string;
        name_uz?: string;
        name_ru?: string;
        name_en?: string;
        listing_count?: number;
      }>>('/listings/categories/');
      return res.data ?? [];
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
      return (res.data as any[]) ?? [];
    } catch {
      return [];
    }
  },

  async createComment(listingId: number | string, content: string, parent?: string) {
    try {
      const res = await apiClient.post('/listings/comments/create/', {
        listing: listingId,
        content,
        parent,
      });
      return res.data;
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },
};
