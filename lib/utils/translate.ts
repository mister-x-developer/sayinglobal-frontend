/**
 * Translation utilities — delegates to the centralized provider.
 *
 * NOTE: formatAnimalAge has been removed from this file.
 * Age formatting is now done in AgeDisplay component using t() from next-intl.
 * This file contains NO inline locale maps.
 */

export { translationProvider } from '../translation/provider';
export { useTranslation } from '../translation/useTranslation';
