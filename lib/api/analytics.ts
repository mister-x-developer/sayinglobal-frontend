/**
 * Admin analytics API — fetches real platform metrics from the backend.
 * All endpoints require IsPlatformAdmin permission.
 */

import { apiClient } from './client';

export interface DashboardStats {
  users: { total: number; active: number; new_today: number };
  listings: {
    total: number;
    active: number;
    sold: number;
    pending: number;
    new_today: number;
  };
  messages: { total: number; today: number };
  engagement: { total_views: number; views_today: number };
}

export interface CategoryStat {
  name: string;
  name_uz: string;
  total_listings: number;
  active_listings: number;
  sold_listings: number;
}

export interface ListingAnalytics {
  status_distribution: { status: string; count: number }[];
  top_listings: { id: string; title: string; view_count: number; favorite_count: number; comment_count: number }[];
  avg_prices_by_category: { category__name: string; avg_price: number; count: number }[];
}

export interface ActivityAnalytics {
  event_distribution: { event_type: string; count: number }[];
  daily_activity: {
    date: string;
    total_views: number;
    total_searches: number;
    total_messages: number;
    total_comments: number;
    total_favorites: number;
  }[];
}

export interface DailyPoint {
  date: string;
  count: number;
}

export interface GrowthAnalytics {
  users_by_day: DailyPoint[];
  listings_by_day: DailyPoint[];
  messages_by_day: DailyPoint[];
}

export const analyticsApi = {
  async dashboard(): Promise<DashboardStats> {
    const { data } = await apiClient.get<DashboardStats>('/analytics/dashboard/');
    return data;
  },

  async listingsByCategory(): Promise<CategoryStat[]> {
    const { data } = await apiClient.get<{ data: CategoryStat[] }>(
      '/analytics/listings/by-category/'
    );
    return data.data ?? [];
  },

  async listings(): Promise<ListingAnalytics> {
    const { data } = await apiClient.get<ListingAnalytics>('/analytics/listings/');
    return data;
  },

  async activity(days = 7): Promise<ActivityAnalytics> {
    const { data } = await apiClient.get<ActivityAnalytics>('/analytics/activity/', {
      params: { days },
    });
    return data;
  },

  async growth(days = 30): Promise<GrowthAnalytics> {
    const { data } = await apiClient.get<GrowthAnalytics>('/analytics/users/growth/', {
      params: { days },
    });
    return data;
  },
};
