/**
 * Barrel exports for lib utilities.
 * Import from '@/lib' for convenience.
 */

// API
export { apiClient, handleApiError } from './api/client';
export { authApi } from './api/auth';
export { listingsApi } from './api/listings';
export { usersApi } from './api/users';
export { notificationsApi } from './api/notifications';
export { referenceApi } from './api/reference';

// Stores
export { useAuthStore } from './store/auth';
export { useFollowStore } from './store/follow';
export { useNotificationsStore } from './store/notifications';

// Hooks
export { useAsync } from './hooks/useAsync';
export { useForm } from './hooks/useForm';
export { useWebSocket } from './hooks/useWebSocket';
export { useCategories, useRegions, useBreeds } from './hooks/useReferenceData';

// Translation
export { translationProvider } from './translation/provider';
export { useTranslation } from './translation/useTranslation';

// Utils
export { normalizeForSearch, matchScore, matchesSearch, searchItems } from './utils/search';
export { formatPrice, formatRelativeTime, formatDate, formatNumber } from './utils/format';
export { extractErrorMessage, parseValidationErrors, getErrorCode } from './utils/errors';
export { cn } from './utils/cn';
