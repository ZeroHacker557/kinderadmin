import toast, { type Toast as HotToast } from 'react-hot-toast';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export const Toast = {
  success: (message: string) => toast.custom((t) => <ToastComponent t={t} message={message} type="success" />),
  error: (message: string) => toast.custom((t) => <ToastComponent t={t} message={message} type="error" />),
  warning: (message: string) => toast.custom((t) => <ToastComponent t={t} message={message} type="warning" />),
  info: (message: string) => toast.custom((t) => <ToastComponent t={t} message={message} type="info" />),
};

function ToastComponent({ t, message, type }: { t: HotToast, message: string, type: 'success' | 'error' | 'warning' | 'info' }) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-emerald-500/10 border-emerald-500/20',
    error: 'bg-red-500/10 border-red-500/20',
    warning: 'bg-amber-500/10 border-amber-500/20',
    info: 'bg-blue-500/10 border-blue-500/20',
  };

  return (
    <div
      className={cn(
        'max-w-md w-full bg-surface-primary shadow-lg rounded-xl border pointer-events-auto flex',
        t.visible ? 'animate-enter' : 'animate-leave',
        bgColors[type]
      )}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            {icons[type]}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-text-primary">
              {message}
            </p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-border-subtle/30">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-sm font-medium text-text-tertiary hover:text-text-secondary focus:outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
