'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { LandingNav } from '@/components/layout/LandingNav';
import { LandingFooter } from '@/components/layout/LandingFooter';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Categories } from '@/components/landing/Categories';
import { TrustSection } from '@/components/landing/TrustSection';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { LandingRedirect } from '@/components/auth/LandingRedirect';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/') return;
    import('@capacitor/core').then(({ Capacitor }) => {
      if (Capacitor.isNativePlatform()) {
        router.replace('/dashboard');
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col">
      <LandingRedirect />
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Categories />
        <TrustSection />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
