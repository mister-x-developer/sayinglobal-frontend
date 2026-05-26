'use client';

/**
 * AIAssistantWrapper — shows USER AI on non-admin pages only.
 * Admin pages use AdminAIAssistant (embedded in AdminLayout).
 */

import { usePathname } from 'next/navigation';
import { AIAssistant } from './AIAssistant';

export function AIAssistantWrapper() {
  const pathname = usePathname() || '/';
  
  // Don't show user AI on admin pages — admin has its own AI
  if (pathname.startsWith('/admin')) return null;
  
  return <AIAssistant />;
}
