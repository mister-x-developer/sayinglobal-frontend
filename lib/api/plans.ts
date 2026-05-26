/**
 * Plans & Referral API — connects to /api/plans/
 */

import { apiClient } from './client';

export interface Plan {
  id: string;
  name: string;
  name_uz: string;
  name_uz_cyrl: string;
  name_ru: string;
  name_en: string;
  description: string;
  description_uz: string;
  description_uz_cyrl: string;
  description_ru: string;
  description_en: string;
  monthly_listing_limit: number;
  active_listing_limit: number;
  price_uzs: number;
  price_usd: number;
  duration_days: number;
  referrals_required: number;
  order: number;
  is_default: boolean;
  status: 'active' | 'archived';
}

export interface UserPlan {
  id: string;
  plan: Plan;
  started_at: string;
  expires_at: string | null;
  is_active: boolean;
  is_expired: boolean;
  granted_by_referral: boolean;
  granted_by_promo: boolean;
  promo_code: string;
  monthly_listings_used?: number;
  can_create_listing?: boolean;
  limit_reason?: string | null;
}

export interface ReferralCode {
  id: string;
  code: string;
  total_referrals: number;
  rewarded_referrals: number;
  created_at: string;
}

export const plansApi = {
  async list(): Promise<Plan[]> {
    const { data } = await apiClient.get<Plan[]>('/plans/');
    return data;
  },

  async myPlan(): Promise<UserPlan> {
    const { data } = await apiClient.get<UserPlan>('/plans/my/');
    return data;
  },

  async myReferralCode(): Promise<ReferralCode> {
    const { data } = await apiClient.get<ReferralCode>('/plans/referral/');
    return data;
  },

  async useReferralCode(code: string): Promise<{ message: string }> {
    const { data } = await apiClient.post('/plans/referral/use/', { code });
    return data;
  },

  async usePromoCode(code: string): Promise<{ message: string; plan: Plan }> {
    const { data } = await apiClient.post('/plans/promo/use/', { code });
    return data;
  },

  // Admin
  async adminList(): Promise<Plan[]> {
    const { data } = await apiClient.get<Plan[]>('/plans/admin/');
    return data;
  },

  async adminCreate(plan: Partial<Plan>): Promise<Plan> {
    const { data } = await apiClient.post<Plan>('/plans/admin/', plan);
    return data;
  },

  async adminUpdate(id: string, plan: Partial<Plan>): Promise<Plan> {
    const { data } = await apiClient.patch<Plan>(`/plans/admin/${id}/`, plan);
    return data;
  },

  async adminArchive(id: string): Promise<void> {
    await apiClient.delete(`/plans/admin/${id}/`);
  },
};
