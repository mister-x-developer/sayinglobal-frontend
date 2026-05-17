/**
 * Centralized error handling utilities.
 * All API errors, form errors, and runtime errors flow through here.
 */

import axios from 'axios';

export type AppErrorCode =
  | 'NETWORK_ERROR'
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN';

export interface AppError {
  code: AppErrorCode;
  message: string;
  field?: string;
  details?: Record<string, string[]>;
}

/**
 * Extract a user-friendly error message from any error type.
 * Returns a string safe to display in the UI.
 */
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    // Django REST Framework validation errors
    if (data && typeof data === 'object') {
      if (data.detail) return String(data.detail);
      if (data.error) return String(data.error);
      if (data.message) return String(data.message);

      // Field-level errors — join first error from each field
      const fieldErrors = Object.values(data)
        .flat()
        .filter((v): v is string => typeof v === 'string')
        .slice(0, 2);
      if (fieldErrors.length > 0) return fieldErrors.join('. ');
    }

    if (error.code === 'ECONNABORTED') return 'errors.timeout';
    if (error.response?.status === 401) return 'errors.unauthorized';
    if (error.response?.status === 403) return 'errors.forbidden';
    if (error.response?.status === 404) return 'errors.notFound';
    if (error.response?.status === 500) return 'errors.serverError';
    if (!error.response) return 'errors.networkError';
  }

  if (error instanceof Error) return error.message;
  return 'errors.somethingWrong';
}

/**
 * Parse Django REST Framework validation errors into field-level map.
 */
export function parseValidationErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError(error)) return {};
  const data = error.response?.data;
  if (!data || typeof data !== 'object') return {};

  const result: Record<string, string> = {};
  for (const [field, messages] of Object.entries(data)) {
    if (Array.isArray(messages) && messages.length > 0) {
      result[field] = String(messages[0]);
    } else if (typeof messages === 'string') {
      result[field] = messages;
    }
  }
  return result;
}

/**
 * Determine error code from an error.
 */
export function getErrorCode(error: unknown): AppErrorCode {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'NETWORK_ERROR';
    if (error.code === 'ECONNABORTED') return 'TIMEOUT';
    const status = error.response.status;
    if (status === 401) return 'AUTH_REQUIRED';
    if (status === 403) return 'FORBIDDEN';
    if (status === 404) return 'NOT_FOUND';
    if (status === 422 || status === 400) return 'VALIDATION_ERROR';
    if (status >= 500) return 'SERVER_ERROR';
  }
  return 'UNKNOWN';
}
