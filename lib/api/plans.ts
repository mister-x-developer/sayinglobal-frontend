import apiClient from './client';

export interface Plan {
  id: string;
  name: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
  description: string;
  description_uz: string;
  description_ru: string;
  description_en: string;
  monthly_listing_limit: number;
  active_listing_limit: number;
  price_uzs: string;
  price_usd: string;
  duration_days: number;
  referrals_required: number;
  can_bump_listings: boolean;
  is_wholesale_allowed: boolean;
  monthly_bump_limit: number;
  is_default: boolean;
  is_coming_soon: boolean;
}

export interface UserPlan {
  plan: Plan;
  started_at: string;
  expires_at: string | null;
  is_active: boolean;
  is_expired: boolean;
  granted_by_referral: boolean;
  granted_by_promo: boolean;
  promo_code: string;
  monthly_listings_used: number;
  can_create_listing: boolean;
  limit_reason: string | null;
}

export const plansApi = {
  /**
   * List all active marketplace plans
   */
  async getPlans(): Promise<Plan[]> {
    return apiClient.get('/plans/');
  },

  /**
   * Get the current user's active plan
   */
  async getMyPlan(): Promise<UserPlan> {
    return apiClient.get('/plans/my/');
  },

  /**
   * List all subscriptions for the current user
   */
  async getMySubscriptions(): Promise<UserPlan[]> {
    return apiClient.get('/plans/my-subscriptions/');
  },

  /**
   * Use a promo code to get a plan or referral reward
   */
  async usePromoCode(code: string): Promise<{ success: boolean; message?: string }> {
    return apiClient.post('/plans/promo/use/', { code });
  },
};
