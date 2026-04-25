import * as React from 'react';
import { cn } from '@/lib/cn';
import type { ElementType } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ElementType;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon: Icon, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon className="h-5 w-5 text-text-tertiary" />
            </div>
          )}
          <input
            type={type}
            className={cn(
              'flex h-11 w-full rounded-xl border bg-surface-secondary/50 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
              Icon && 'pl-10',
              error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500/50' : 'border-border-default',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
