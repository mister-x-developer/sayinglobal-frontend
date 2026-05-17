/**
 * Standardized loading states.
 * Use these instead of ad-hoc skeleton divs scattered across pages.
 */

import { cn } from '@/lib/utils/cn';

interface SkeletonProps {
  className?: string;
}

function Bone({ className }: SkeletonProps) {
  return <div className={cn('skeleton', className)} />;
}

/** Skeleton for a listing card */
export function ListingCardSkeleton() {
  return (
    <div className="surface-elevated overflow-hidden">
      <Bone className="aspect-[4/3] rounded-none" />
      <div className="space-y-2.5 p-4">
        <Bone className="h-3 w-16 rounded-full" />
        <Bone className="h-4 w-3/4" />
        <Bone className="h-3 w-1/2" />
        <Bone className="mt-3 h-5 w-1/3" />
        <div className="flex items-center gap-2 border-t border-border pt-3.5">
          <Bone className="h-6 w-6 rounded-full" />
          <Bone className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

/** Skeleton grid for listings */
export function ListingGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Skeleton for a seller card */
export function SellerCardSkeleton() {
  return (
    <div className="surface-elevated p-5">
      <div className="flex items-start gap-4">
        <Bone className="h-14 w-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Bone className="h-4 w-32" />
          <Bone className="h-3 w-20" />
          <Bone className="h-3 w-full" />
          <Bone className="h-3 w-2/3" />
        </div>
      </div>
      <Bone className="mt-4 h-16 rounded-xl" />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Bone className="h-9 rounded-xl" />
        <Bone className="h-9 rounded-xl" />
      </div>
    </div>
  );
}

/** Skeleton for a notification item */
export function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-border p-4">
      <Bone className="h-10 w-10 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Bone className="h-4 w-1/3" />
        <Bone className="h-3 w-2/3" />
        <Bone className="h-3 w-1/4" />
      </div>
    </div>
  );
}

/** Skeleton for a table row */
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <Bone className={`h-4 ${i === 0 ? 'w-32' : 'w-20'}`} />
        </td>
      ))}
    </tr>
  );
}

/** Full-page loading state */
export function PageLoader() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="spinner" aria-label="Loading" />
    </div>
  );
}
