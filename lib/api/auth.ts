/**
 * Auth API Service — Telegram code-only authentication.
 */

import axios from 'axios';
import apiClient, { handleApiError } from './client';
import type { User } from '../store/auth';

export interface VerifyCodeRequest {
  code: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
}

export interface VerifyCodeResponse {
  user: User;
  tokens: { access: string; refresh: string };
}

export interface PhonePrefix {
  prefix: string;
  country_code: string;
  country_name: string;
}

export interface RequestCodeRequest {
  phone: string;
}

export interface RequestCodeResponse {
  ok: true;
}

/**
 * Error thrown by the auth API helpers when the backend responds
 * with a structured `{ error, ... }` body. The discriminator
 * (e.g. `'otp_cooldown'`, `'invalid_or_expired_code'`) is exposed
 * as `error.message` so callers can branch on it directly, and
 * the full response body is preserved on `error.data` so callers
 * can read fields like `retry_after` without re-walking the axios
 * error shape. The HTTP status is on `.status`.
 */
export class AuthApiError extends Error {
  readonly data: Record<string, unknown> | null;
  readonly status: number | null;

  constructor(
    message: string,
    data: Record<string, unknown> | null = null,
    status: number | null = null,
  ) {
    super(message);
    this.name = 'AuthApiError';
    this.data = data;
    this.status = status;
  }
}

/** @deprecated Kept as an alias so callers using the old name keep compiling. */
export const RequestCodeError = AuthApiError;

function shapeAuthError(e: unknown): AuthApiError {
  if (axios.isAxiosError(e)) {
    const body = e.response?.data;
    const status = e.response?.status ?? null;
    if (body && typeof body === 'object') {
      const data = body as Record<string, unknown>;
      const discriminator =
        typeof data.error === 'string'
          ? data.error
          : typeof data.message === 'string'
            ? data.message
            : 'request_failed';
      return new AuthApiError(discriminator, data, status);
    }
    // Network error (no response) — e.code gives more detail
    if (!e.response) {
      const code = e.code || 'network_error';
      return new AuthApiError(code, null, null);
    }
    return new AuthApiError(handleApiError(e), null, status);
  }
  return new AuthApiError(handleApiError(e), null, null);
}

export const authApi = {
  async getAllowedPrefixes(): Promise<PhonePrefix[]> {
    try {
      const res = await apiClient.get<{ prefixes: PhonePrefix[] }>('/users/phone-prefixes/');
      return res.data.prefixes ?? [];
    } catch {
      return [];
    }
  },

  async verifyCode(data: VerifyCodeRequest): Promise<VerifyCodeResponse> {
    try {
      const res = await apiClient.post<VerifyCodeResponse>('/users/auth/verify-code/', data);
      return res.data;
    } catch (e) {
      throw shapeAuthError(e);
    }
  },

  /**
   * Request a fresh OTP for the supplied phone number.
   *
   * Success → resolves with `{ ok: true }`.
   *
   * Error → throws a `RequestCodeError` whose `.message` is the
   * backend's `error` discriminator (e.g. `'otp_cooldown'`,
   * `'phone_not_supported'`) so callers can branch on it directly.
   * The full response body is preserved on `.data` (so
   * `err.data.retry_after` is readable on cooldown), and the
   * HTTP status is on `.status`.
   */
  async requestCode(data: RequestCodeRequest): Promise<RequestCodeResponse> {
    try {
      await apiClient.post('/users/auth/request-code/', data);
      return { ok: true };
    } catch (e) {
      throw shapeAuthError(e);
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/users/auth/logout/');
    } catch {
      // ignore
    }
  },

  async getProfile(): Promise<User> {
    const res = await apiClient.get<User>('/users/profile/');
    return res.data;
  },

  async updateProfile(data: Partial<User> | FormData): Promise<User> {
    const isForm = typeof FormData !== 'undefined' && data instanceof FormData;
    const res = await apiClient.put<User>(
      '/users/profile/update/',
      data,
      isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return res.data;
  },
};
