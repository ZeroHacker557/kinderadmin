import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-12 sm:py-16 px-4"
    >
      <div className="w-14 h-14 rounded-2xl bg-surface-tertiary flex items-center justify-center mb-4">
        {icon || <SearchIcon className="w-6 h-6 text-text-tertiary" />}
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-tertiary text-center max-w-sm">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
