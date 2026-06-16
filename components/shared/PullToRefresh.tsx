'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const maxPullDistance = 80;
  const triggerDistance = 60;

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only pull if we are at the very top of the container
    if (window.scrollY === 0 && (!containerRef.current || containerRef.current.scrollTop === 0)) {
      setStartY(e.touches[0].clientY);
    } else {
      setStartY(0);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startY || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;

    if (distance > 0) {
      // Resist the pull (friction)
      const resistedDistance = distance * 0.4;
      if (resistedDistance <= maxPullDistance) {
        setPullDistance(resistedDistance);
      }
      
      // Trigger haptic tick when crossing the threshold
      if (resistedDistance > triggerDistance && pullDistance <= triggerDistance) {
        if (Capacitor.isNativePlatform()) {
          Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
        }
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!startY || isRefreshing) return;

    if (pullDistance > triggerDistance) {
      setIsRefreshing(true);
      setPullDistance(triggerDistance); // Hold it there

      if (Capacitor.isNativePlatform()) {
        Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
      }

      await onRefresh();

      setIsRefreshing(false);
      setPullDistance(0);
    } else {
      // Snap back
      setPullDistance(0);
    }
    setStartY(0);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="absolute top-0 left-0 w-full flex justify-center items-center overflow-hidden transition-all duration-300"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance / triggerDistance,
        }}
      >
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
      <div
        className="transition-transform duration-300 h-full w-full"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
