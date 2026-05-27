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
// F-36/F-37 cleanup: legacy `useWebSocket` hook removed. Production WS
// traffic is owned by `lib/ws/notificationSocket.ts` and `lib/ws/chatSocket.ts`
// singletons (which honor the spec close-code map and consume the
// `session.revoked` event payload). The dormant hook was carrying a stale-
// closure / wrong-close-code defect (F-36) and shipping unused (F-37).
export { useCategories, useRegions, useBreeds } from './hooks/useReferenceData';

// Translation
export { translationProvider } from './translation/provider';
export { useTranslation } from './translation/useTranslation';

// Utils
export { normalizeForSearch, matchScore, matchesSearch, searchItems } from './utils/search';
export { formatPrice, formatRelativeTime, formatDate, formatNumber } from './utils/format';
export { extractErrorMessage, parseValidationErrors, getErrorCode } from './utils/errors';
export { cn } from './utils/cn';
