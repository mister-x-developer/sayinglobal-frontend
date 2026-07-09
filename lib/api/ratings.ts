/**
 * Ratings / Public Reviews API client.
 *
 * Wraps the seller-rating endpoints under `/api/listings/`:
 *   GET  /listings/seller/<user_id>/ratings/        — list + replies (sortable)
 *   POST /listings/rate/                            — create or update review
 *   PATCH /listings/ratings/<id>/            — edit review
 *   DELETE /listings/ratings/<id>/           — soft-delete
 *   POST /listings/ratings/<id>/reply/       — reply (seller answers)
 *   POST /listings/ratings/<id>/helpful/     — mark helpful
 *   DELETE /listings/ratings/<id>/helpful/   — unmark
 *   POST /listings/ratings/<id>/report/      — flag for moderation
 */
import apiClient from './client';

export interface RatingUserMini {
  id: number;
  full_name: string;
  avatar_url?: string;
}

export interface RatingRecord {
  id: number;
  seller: RatingUserMini | null;
  buyer: RatingUserMini | null;
  listing: number | null;
  listing_title?: string | null;
  listing_id?: number | null;
  parent: number | null;
  score: number;
  review: string;
  review_uz?: string;
  review_uz_cyrl?: string;
  review_ru?: string;
  review_en?: string;
  original_locale: string;
  is_edited: boolean;
  is_deleted: boolean;
  is_hidden: boolean;
  helpful_count: number;
  report_count: number;
  is_helpful: boolean;
  reply_count: number;
  can_edit: boolean;
  created_at: string;
  updated_at: string;
  replies?: RatingRecord[];
}

export type SortMode = 'newest' | 'highest' | 'lowest' | 'most_useful';

export const ratingsApi = {
  async list(
    sellerPublicId: number,
    opts: { sort?: SortMode; page?: number; pageSize?: number } = {},
  ): Promise<{
    results: RatingRecord[];
    count: number;
    average_score: number;
    page: number;
    page_size: number;
    sort: SortMode;
  }> {
    try {
      const res = await apiClient.get(`/listings/seller/${sellerPublicId}/ratings/`, {
        params: {
          sort: opts.sort || 'newest',
          page: opts.page ?? 1,
          page_size: opts.pageSize ?? 20,
        },
      });
      return res.data;
    } catch {
      return {
        results: [],
        count: 0,
        average_score: 0,
        page: 1,
        page_size: 20,
        sort: 'newest',
      };
    }
  },

  async create(payload: {
    seller?: number;
    listing?: number;
    score: number;
    review: string;
    locale?: string;
  }): Promise<RatingRecord> {
    const res = await apiClient.post('/listings/rate/', payload);
    return res.data;
  },

  async update(
    publicId: number,
    payload: { score?: number; review?: string; locale?: string; is_hidden?: boolean },
  ): Promise<RatingRecord> {
    const res = await apiClient.patch(`/listings/ratings/${publicId}/`, payload);
    return res.data;
  },

  async remove(publicId: number): Promise<void> {
    await apiClient.delete(`/listings/ratings/${publicId}/`);
  },

  async reply(publicId: number, payload: { review: string; locale?: string }): Promise<RatingRecord> {
    const res = await apiClient.post(`/listings/ratings/${publicId}/reply/`, payload);
    return res.data;
  },

  async helpful(publicId: number): Promise<{ helpful_count: number; is_helpful: boolean }> {
    const res = await apiClient.post(`/listings/ratings/${publicId}/helpful/`);
    return res.data;
  },

  async unhelpful(publicId: number): Promise<{ helpful_count: number; is_helpful: boolean }> {
    const res = await apiClient.delete(`/listings/ratings/${publicId}/helpful/`);
    return res.data;
  },

  async report(
    publicId: number,
    payload: { reason: string; note?: string },
  ): Promise<{ report_count: number; reported: boolean }> {
    const res = await apiClient.post(`/listings/ratings/${publicId}/report/`, payload);
    return res.data;
  },

  /** Admin: list ratings flagged by users for moderation. */
  async adminList(opts: { page?: number; pageSize?: number } = {}): Promise<{
    results: RatingRecord[];
    count: number;
  }> {
    try {
      const res = await apiClient.get('/listings/admin/ratings/moderation/', {
        params: { page: opts.page ?? 1, page_size: opts.pageSize ?? 20 },
      });
      return res.data;
    } catch {
      return { results: [], count: 0 };
    }
  },
};
