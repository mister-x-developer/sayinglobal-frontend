/**
 * Moderation V2 API client (web frontend).
 *
 * Backend endpoints (under /api/moderation/v2/):
 *   GET  /reasons/                          — reason catalogue
 *   POST /reports/listing/{public_id}/      — submit listing report
 *   POST /reports/seller/{public_id}/       — submit seller report
 *   GET  /reports/                          — current user's reports
 *   GET  /reports/{public_id}/              — single report
 */
import apiClient, { handleApiError } from './client';

export type ReportSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ReportStatus =
  | 'pending'
  | 'under_review'
  | 'resolved_valid'
  | 'resolved_invalid';

export interface ReportReason {
  code: string;
  label: string;
  default_severity: ReportSeverity;
}

export interface ReasonsCatalogue {
  listing_reasons: ReportReason[];
  seller_reasons: ReportReason[];
  chat_reasons: ReportReason[];
  severities: { code: ReportSeverity; label: string }[];
}

export interface ReportRecord {
  public_id: number;
  report_type: 'listing' | 'seller';
  reason_code: string;
  severity: ReportSeverity;
  description: string;
  status: ReportStatus;
  listing: { public_id: number; title: string } | null;
  reported_user: { public_id: number; full_name: string; avatar_url?: string } | null;
  resolution_notes: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface SubmitReportInput {
  reason_code: string;
  description?: string;
  severity?: ReportSeverity;
}

export const moderationApi = {
  async getReasons(): Promise<ReasonsCatalogue> {
    try {
      const res = await apiClient.get<ReasonsCatalogue>('/moderation/v2/reasons/');
      return res.data;
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },

  async reportListing(listingPublicId: number, payload: SubmitReportInput): Promise<ReportRecord> {
    try {
      const res = await apiClient.post<ReportRecord>(
        `/moderation/v2/reports/listing/${listingPublicId}/`,
        payload,
      );
      return res.data;
    } catch (e) {
      throw e; // pass through axios error so callers can read response.data.error
    }
  },

  async reportSeller(sellerPublicId: number, payload: SubmitReportInput): Promise<ReportRecord> {
    try {
      const res = await apiClient.post<ReportRecord>(
        `/moderation/v2/reports/seller/${sellerPublicId}/`,
        payload,
      );
      return res.data;
    } catch (e) {
      throw e;
    }
  },

  async reportChat(userPublicId: number, payload: SubmitReportInput): Promise<ReportRecord> {
    try {
      const res = await apiClient.post<ReportRecord>(
        `/moderation/v2/reports/chat/${userPublicId}/`,
        payload,
      );
      return res.data;
    } catch (e) {
      throw e;
    }
  },

  async reportComment(publicId: number, payload: SubmitReportInput): Promise<ReportRecord> {
    try {
      const res = await apiClient.post<ReportRecord>(
        `/moderation/v2/reports/comment/${publicId}/`,
        payload,
      );
      return res.data;
    } catch (e) {
      throw e;
    }
  },

  async reportRating(publicId: number, payload: SubmitReportInput): Promise<ReportRecord> {
    try {
      const res = await apiClient.post<ReportRecord>(
        `/moderation/v2/reports/rating/${publicId}/`,
        payload,
      );
      return res.data;
    } catch (e) {
      throw e;
    }
  },

  async adminRestoreStatus(
    userPublicId: number,
    targetStatus: 'good' | 'warning' | 'restricted',
    reason: string,
  ): Promise<{ user_public_id: number; old_status: string; new_status: string }> {
    try {
      const res = await apiClient.post(
        `/moderation/v2/admin/users/${userPublicId}/restore-status/`,
        { target_status: targetStatus, reason },
      );
      return res.data;
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },

  async adminTranslateReportText(
    publicId: number,
    field: 'description' | 'resolution_notes',
    targetLang: 'uz' | 'uz-cyrl' | 'ru' | 'en',
  ): Promise<{ translated: string; original: string; field: string; target_lang: string }> {
    try {
      const res = await apiClient.post(
        `/moderation/v2/admin/reports/${publicId}/translate/`,
        { field, target_lang: targetLang },
      );
      return res.data;
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },

  async myReports(): Promise<ReportRecord[]> {
    try {
      const res = await apiClient.get<{ results: ReportRecord[]; count: number }>(
        '/moderation/v2/reports/',
      );
      return res.data.results;
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },

  async detail(publicId: number): Promise<ReportRecord> {
    try {
      const res = await apiClient.get<ReportRecord>(`/moderation/v2/reports/${publicId}/`);
      return res.data;
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },

  // ── Admin endpoints ─────────────────────────────────────────────────────

  async adminList(params: AdminQueueParams = {}): Promise<AdminListResponse> {
    try {
      const res = await apiClient.get<AdminListResponse>('/moderation/v2/admin/reports/', {
        params,
      });
      return res.data;
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },

  async adminStartReview(publicId: number): Promise<AdminReportRecord> {
    try {
      const res = await apiClient.post<AdminReportRecord>(
        `/moderation/v2/admin/reports/${publicId}/start-review/`,
      );
      return res.data;
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },

  async adminResolveValid(
    publicId: number,
    moderatorNotes: string,
    severity?: 'low' | 'medium' | 'high' | 'critical',
  ): Promise<{ complaint: AdminReportRecord; seller_status_changed_to: string | null }> {
    try {
      const body: Record<string, unknown> = { moderator_notes: moderatorNotes };
      if (severity) body.severity = severity;
      const res = await apiClient.post(
        `/moderation/v2/admin/reports/${publicId}/resolve-valid/`,
        body,
      );
      return res.data;
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },

  async adminResolveInvalid(
    publicId: number,
    moderatorNotes: string,
  ): Promise<AdminReportRecord> {
    try {
      const res = await apiClient.post<AdminReportRecord>(
        `/moderation/v2/admin/reports/${publicId}/resolve-invalid/`,
        { moderator_notes: moderatorNotes },
      );
      return res.data;
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },

  async adminAIReviewListing(listingPublicId: number): Promise<{
    listing_id: number;
    confidence_score: number;
    flags: string[];
    explanation: string;
    is_flagged: boolean;
  }> {
    try {
      const res = await apiClient.post(`/ai-moderation/run/listing/${listingPublicId}/`);
      return res.data;
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },

  async adminAIReviewReport(reportPublicId: number): Promise<{
    report_id: number;
    priority_score: number;
    explanation: string;
  }> {
    try {
      const res = await apiClient.post(`/ai-moderation/run/report/${reportPublicId}/`);
      return res.data;
    } catch (e) {
      throw new Error(handleApiError(e));
    }
  },
};

// ── Admin types ────────────────────────────────────────────────────────────

export interface AdminUserMini {
  public_id: number;
  full_name: string;
  avatar_url?: string;
  phone?: string | null;
  status?: 'good' | 'warning' | 'restricted' | 'blocked';
}

export interface AdminReportRecord extends Omit<ReportRecord, 'reported_user'> {
  complainant: AdminUserMini;
  reported_user: AdminUserMini | null;
  assigned_to: AdminUserMini | null;
  resolved_by: AdminUserMini | null;
}

export interface AdminListResponse {
  results: AdminReportRecord[];
  count: number;
  page: number;
  page_size: number;
}

export interface AdminQueueParams {
  status?: ReportStatus;
  severity?: ReportSeverity;
  report_type?: 'listing' | 'seller';
  reason_code?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}
