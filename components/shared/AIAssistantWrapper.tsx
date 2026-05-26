'use client';

/**
 * AIAssistantWrapper — shows USER AI on non-admin pages only.
 * Admin pages use AdminAIAssistant (embedded in AdminLayout).
 * Chat page excluded — the floating button would overlap the message input.
 */

import { usePathname } from 'next/navigation';
import { AIAssistant } from './AIAssistant';

export function AIAssistantWrapper() {
  const pathname = usePathname() || '/';

  // Don't show user AI on admin pages — admin has its own AI
  if (pathname.startsWith('/admin')) return null;

  // Don't show on chat page — it conflicts with the message input area
  if (pathname.startsWith('/chat')) return null;

  return <AIAssistant />;
}
