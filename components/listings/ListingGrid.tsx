'use client';

import { motion } from 'framer-motion';
import { ListingCard, type ListingCardData } from './ListingCard';

interface ListingGridProps {
  listings: ListingCardData[];
  onFavorite?: (publicId: number) => void;
  columns?: 2 | 3 | 4;
}

const GRID_CLASSES = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.48,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function ListingGrid({
  listings,
  onFavorite,
  columns = 4,
}: ListingGridProps) {
  return (
    <motion.div
      data-motion
      variants={container}
      initial="hidden"
      animate="show"
      className={`grid gap-4 ${GRID_CLASSES[columns]}`}
    >
      {listings.map((listing) => (
        <motion.div data-motion key={listing.public_id} variants={item}>
          <ListingCard listing={listing} onFavorite={onFavorite} />
        </motion.div>
      ))}
    </motion.div>
  );
}
