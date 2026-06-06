'use client';

import { ReactNode } from 'react';
import {
  NextIntlClientProvider,
  IntlErrorCode,
  type AbstractIntlMessages,
} from 'next-intl';

/**
 * Client-side wrapper around `NextIntlClientProvider`.
 *
 * `getMessageFallback` and `onError` are functions and therefore cannot be
 * passed from the (server) root layout into the client provider. Defining
 * them here — in a Client Component — lets Client Components share the same
 * runtime fallback behaviour as the server config in `lib/i18n.ts`:
 *
 *  - R6.7/R6.8: a missing or empty key never renders the raw dotted key.
 *    The `uz` fallback is already deep-merged into `messages` server-side, so
 *    this only triggers for keys absent from `uz` too — in which case we show
 *    the leaf segment (e.g. `verifyCode`) rather than the full `auth.verifyCode`.
 *  - A `MISSING_MESSAGE` error must not crash the render tree.
 */
export function IntlClientProvider({
  locale,
  messages,
  timeZone = 'Asia/Tashkent',
  children,
}: {
  locale: string;
  messages: AbstractIntlMessages;
  timeZone?: string;
  children: ReactNode;
}) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={timeZone}
      getMessageFallback={({ namespace, key }) => {
        const path = namespace ? `${namespace}.${key}` : key;
        return path.split('.').pop() || path;
      }}
      onError={(error) => {
        if (error.code === IntlErrorCode.MISSING_MESSAGE) return;
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.error(error);
        }
      }}
    >
      {children}
    </NextIntlClientProvider>
  );
}
