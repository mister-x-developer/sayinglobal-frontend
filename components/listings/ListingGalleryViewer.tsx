'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ListingImage } from '@/components/listings/ListingImage';
import type { ListingImage as ApiListingImage } from '@/lib/api/listings';

interface ListingGalleryViewerProps {
  images: ApiListingImage[];
  initialIndex: number;
  onClose: () => void;
  title: string;
}

export function ListingGalleryViewer({ images, initialIndex, onClose, title }: ListingGalleryViewerProps) {
  const [index, setIndex] = useState(initialIndex);

  const prevImage = useCallback(() => setIndex((i) => (i === 0 ? images.length - 1 : i - 1)), [images.length]);
  const nextImage = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, prevImage, nextImage]);

  const visibleImage = images[index];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 sm:top-6 z-[110] inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="absolute top-safe-4 left-0 right-0 z-[105] text-center pointer-events-none">
          <p className="text-white/80 text-sm font-semibold tracking-wide drop-shadow-md">
            {index + 1} / {images.length}
          </p>
        </div>

        <motion.div
          className="relative h-full w-full max-w-7xl flex items-center justify-center p-2 sm:p-8"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.8}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = Math.abs(offset.x) * velocity.x;
            if (swipe < -10000 || offset.x < -100) nextImage();
            else if (swipe > 10000 || offset.x > 100) prevImage();
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9, x: 100 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -100 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="relative h-full w-full max-h-[85vh] flex items-center justify-center"
              style={{ touchAction: 'pan-y pinch-zoom' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={visibleImage?.image && !visibleImage.image.startsWith('/placeholder') ? visibleImage.image : '/placeholder.jpg'}
                alt={`${title} - ${index + 1}`}
                className="max-h-full max-w-full object-contain select-none"
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="hidden sm:inline-flex absolute left-8 top-1/2 -translate-y-1/2 z-[110] h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-transform hover:bg-white/20 hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            <button
              onClick={nextImage}
              className="hidden sm:inline-flex absolute right-8 top-1/2 -translate-y-1/2 z-[110] h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-transform hover:bg-white/20 hover:scale-105 active:scale-95"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
