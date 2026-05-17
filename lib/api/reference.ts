/**
 * Reference data API — regions, districts, categories, breeds.
 * All data is backend-driven and admin-managed.
 * Frontend never hardcodes these values.
 */

import apiClient from './client';

export interface District {
  id: number;
  slug: string;
  name: string;
  name_uz: string;
  name_uz_cyrl: string;
  name_ru: string;
  name_en: string;
  region_id: number;
}

export interface Region {
  id: number;
  slug: string;
  name: string;
  name_uz: string;
  name_uz_cyrl: string;
  name_ru: string;
  name_en: string;
  districts: District[];
}

export interface Breed {
  id: number;
  slug: string;
  name: string;
  name_uz: string;
  name_uz_cyrl: string;
  name_ru: string;
  name_en: string;
  category_id: number;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  name_uz: string;
  name_uz_cyrl: string;
  name_ru: string;
  name_en: string;
  breeds: Breed[];
}

// In-memory cache — reference data rarely changes
let regionsCache: Region[] | null = null;
let categoriesCache: Category[] | null = null;

export const referenceApi = {
  async getRegions(locale = 'uz'): Promise<Region[]> {
    if (regionsCache) return regionsCache;
    try {
      const res = await apiClient.get<Region[]>('/reference/regions/', { params: { locale } });
      regionsCache = res.data ?? [];
      return regionsCache;
    } catch {
      return [];
    }
  },

  async getDistricts(regionSlug: string, locale = 'uz'): Promise<District[]> {
    try {
      const res = await apiClient.get<District[]>(`/reference/regions/${regionSlug}/districts/`, {
        params: { locale },
      });
      return res.data ?? [];
    } catch {
      return [];
    }
  },

  async getCategories(locale = 'uz'): Promise<Category[]> {
    if (categoriesCache) return categoriesCache;
    try {
      const res = await apiClient.get<Category[]>('/reference/categories/', { params: { locale } });
      categoriesCache = res.data ?? [];
      return categoriesCache;
    } catch {
      return [];
    }
  },

  async getBreeds(categorySlug: string, locale = 'uz'): Promise<Breed[]> {
    try {
      const res = await apiClient.get<Breed[]>(`/reference/categories/${categorySlug}/breeds/`, {
        params: { locale },
      });
      return res.data ?? [];
    } catch {
      return [];
    }
  },

  clearCache() {
    regionsCache = null;
    categoriesCache = null;
  },
};
