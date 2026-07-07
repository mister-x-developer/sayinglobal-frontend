'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { useCategories } from '@/lib/hooks/useReferenceData';

export function Categories() {
  const t = useTranslations();
  const { categories } = useCategories();

  // If loading or empty, we can just show empty or skeletons, but let's just map categories
  return (
    <section className="relative py-28 sm:py-36 lg:py-44">
      <div className="container-page">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-eyebrow">02</span>
          <h2 className="display-md mt-4 text-balance">
            {t('landing.categoriesTitle')}
          </h2>
          <p className="mt-5 text-pretty text-lg text-fg-muted">
            {t('landing.categoriesSubtitle')}
          </p>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6 lg:gap-6 animate-fade-in">
          {categories.map((cat, index) => (
            <Link
              key={cat.slug}
              href={`/listings?category=${cat.slug}`}
              className="group surface-elevated relative flex aspect-square flex-col items-center justify-end overflow-hidden p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift hover:border-brand-primary/30 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Image */}
              <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105 bg-bg-muted">
                {cat.image && (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
                    className="object-cover"
                    priority={index < 3}
                  />
                )}
              </div>

              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/85" />

              {/* Label */}
              <div className="relative z-10 w-full p-3 sm:p-4 text-center">
                <p className="text-sm font-semibold text-white sm:text-base">
                  {cat.name}
                </p>
                <p className="mt-0.5 hidden text-[11px] text-white/80 sm:block">
                  {cat.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline"
          >
            {t('common.showAll')}
            <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
          </Link>
        </div>
      </div>
    </section>
  );
}
