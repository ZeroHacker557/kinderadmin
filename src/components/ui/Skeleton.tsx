import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  count?: number;
  type?: 'row' | 'card' | 'circle' | 'text';
}

export function Skeleton({ className = '', count = 1, type = 'text' }: SkeletonProps) {
  const getBaseClass = () => {
    switch (type) {
      case 'circle': return 'rounded-full w-12 h-12';
      case 'card': return 'rounded-2xl h-40';
      case 'row': return 'rounded-xl h-14';
      default: return 'rounded-md h-4 w-full';
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{
            repeat: Infinity,
            repeatType: 'reverse',
            duration: 1,
            ease: 'easeInOut',
          }}
          className={`bg-surface-secondary border border-border-subtle ${getBaseClass()} ${className}`}
        />
      ))}
    </>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border border-border-subtle rounded-xl bg-surface-primary items-center">
          <Skeleton type="circle" className="w-10 h-10 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-1/3" />
            <Skeleton className="w-1/4 h-3 opacity-70" />
          </div>
          <Skeleton className="w-24 px-4 hidden sm:block" />
          <Skeleton className="w-16 px-4 hidden md:block" />
          <Skeleton className="w-10 h-8 flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
      <Skeleton type="card" count={count} />
    </div>
  );
}
