import React from 'react';
import { ChevronRight } from 'lucide-react';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  action?: React.ReactNode;
}

export default function PageHeader({ title, description, breadcrumbs, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center text-sm text-text-tertiary mb-2">
            {breadcrumbs.map((bc, index) => (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight className="w-3.5 h-3.5 mx-1" />}
                {bc.href ? (
                  <a href={bc.href} className="hover:text-primary transition-colors">
                    {bc.label}
                  </a>
                ) : (
                  <span className="text-text-secondary">{bc.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
