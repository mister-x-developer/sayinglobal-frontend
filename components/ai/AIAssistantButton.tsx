'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';

export function AIAssistantButton() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [dragged, setDragged] = useState(false);

  useEffect(() => {
    setMounted(true);
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hide the button if we are already on the chat-ai page or admin/ai-agent page
  if (!mounted || !isAuthenticated || !user?.terms_accepted_at || pathname.startsWith('/chat-ai') || pathname.startsWith('/admin/ai-agent')) return null;

  const isAdmin = user?.is_staff || user?.is_admin;
  const aiLogo = isAdmin ? '/images/admin_ai_logo.png' : '/images/user_ai_logo.png';

  const handleClick = () => {
    if (dragged) return;
    router.push(isAdmin ? '/admin/ai-agent' : '/chat-ai');
  };

  return (
    <motion.div
      drag
      dragConstraints={{ left: -windowSize.width + 80, right: 0, top: -windowSize.height + 140, bottom: 0 }}
      dragMomentum={false}
      dragElastic={0.1}
      onDragStart={() => setDragged(true)}
      onDragEnd={() => setTimeout(() => setDragged(false), 100)}
      className="fixed bottom-32 right-4 md:bottom-8 md:right-8 z-50 flex flex-col items-center gap-2 pointer-events-auto"
      style={{ touchAction: 'none' }}
    >
      <button
        type="button"
        onClick={handleClick}
        className="group relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-[0_8px_32px_-4px_rgba(var(--brand-primary-rgb),0.5)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_-4px_rgba(var(--brand-primary-rgb),0.6)] active:translate-y-0 active:scale-95 border border-white/20 overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-tr before:from-white/0 before:via-white/20 before:to-white/0 before:opacity-0 hover:before:opacity-100 before:transition-opacity"
        aria-label="AI Yordamchi"
      >
        <div className="absolute inset-0.5 rounded-[14px] overflow-hidden bg-brand-primary">
          <Image src={aiLogo} alt="AI" width={56} height={56} className="h-full w-full object-cover mix-blend-luminosity opacity-90 group-hover:opacity-100 group-hover:mix-blend-normal transition-all" />
        </div>
      </button>
    </motion.div>
  );
}
