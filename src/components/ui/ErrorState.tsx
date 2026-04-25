import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = "Xatolik yuz berdi", 
  message = "Ma'lumotlarni yuklashda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.",
  onRetry 
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-surface-primary rounded-2xl border border-border-subtle shadow-sm">
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-xl font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary max-w-sm mb-6">{message}</p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          Qaytadan urinish
        </Button>
      )}
    </div>
  );
}
