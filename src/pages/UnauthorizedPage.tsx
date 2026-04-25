import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-primary text-text-primary p-4">
      <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="w-10 h-10 text-red-500" />
      </div>
      <h1 className="text-4xl font-bold mb-4 tracking-tight">403</h1>
      <p className="text-lg text-text-secondary mb-8 text-center max-w-md">
        Sizda ushbu sahifaga kirish huquqi yo'q. Iltimos, administrator bilan bog'laning yoki ruxsat etilgan bo'limga o'ting.
      </p>
      <Link 
        to="/" 
        className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 font-medium"
      >
        Bosh sahifaga qaytish
      </Link>
    </div>
  );
}
