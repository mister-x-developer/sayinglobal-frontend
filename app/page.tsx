'use client';

import { useEffect, useState } from 'react';
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
import { useAuthStore, useAuthHydrated } from '@/lib/store/auth';
export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const hydrated = useAuthHydrated();

  // If the user is authenticated, we don't render the landing page UI at all.
  // This prevents the landing page from flashing before the redirect takes effect,
  // especially in Capacitor where Next.js might temporarily serve index.html for other paths.
  if (hydrated && isAuthenticated) {
    return <LandingRedirect />;
  }

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
