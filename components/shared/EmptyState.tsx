import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <motion.div
      data-motion
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col items-center rounded-2xl border border-dashed border-border bg-bg-subtle text-center ${
        compact ? 'p-8' : 'p-12 sm:p-16'
      }`}
    >
      {Icon && (
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-elevated text-fg-muted shadow-soft">
          <Icon className="h-6 w-6" strokeWidth={1.5} />
        </div>
      )}
      <h3 className={`display-sm ${Icon ? 'mt-5' : ''}`}>{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-fg-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
