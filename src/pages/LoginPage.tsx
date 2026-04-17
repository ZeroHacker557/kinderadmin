import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Loader2, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const { login, register, loginWithGoogle, isLoading } = useAuth();
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === 'register') {
        await register({ name, email, password, rememberMe });
      } else {
        await login({ email, password, rememberMe });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.form.defaultError'));
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login xatoligi');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* LEFT PANEL */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex lg:w-[55%] xl:w-[58%] relative overflow-hidden"
      >
        <div className="absolute inset-0 gradient-mesh" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-emerald-500/8 blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-400/5 blur-3xl animate-float" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-white/90 text-xl font-semibold tracking-tight">KinderAdmin</span>
          </div>
          <div className="max-w-lg">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="w-12 h-[2px] bg-emerald-400 mb-8" />
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight mb-6">
                {t('login.leftPanel.title1')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500">
                  {t('login.leftPanel.title2')}
                </span>
              </h1>
              <p className="text-lg text-white/50 leading-relaxed font-light">
                {t('login.leftPanel.desc')}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex items-center gap-6 mt-10"
            >
              {[
                { label: t('login.leftPanel.badge1'), icon: '🔐' },
                { label: t('login.leftPanel.badge2'), icon: '✓' },
                { label: t('login.leftPanel.badge3'), icon: '◉' },
              ].map((badge) => (
                <div key={badge.label} className="flex items-center gap-2 text-white/30 text-sm">
                  <span className="text-xs">{badge.icon}</span>
                  <span>{badge.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
          <p className="text-white/20 text-sm">
            {t('login.leftPanel.copyright')}
          </p>
        </div>
      </motion.div>

      {/* RIGHT PANEL — Login Forma */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex-1 flex flex-col items-center justify-center px-5 py-8 sm:px-8 lg:px-12 bg-surface-primary min-h-screen lg:min-h-0"
      >
        <div className="w-full max-w-sm sm:max-w-md">
          <div className="lg:hidden mb-8 sm:mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-text-primary text-xl font-semibold tracking-tight">KinderAdmin</span>
            </div>
            <div className="p-4 rounded-xl gradient-mesh">
              <p className="text-white/80 text-sm font-medium">{t('login.mobileBanner.title')}</p>
              <p className="text-white/40 text-xs mt-1">{t('login.mobileBanner.subtitle')}</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              {mode === 'register' ? "Ro'yxatdan o'tish" : t('login.form.welcome')}
            </h2>
            <p className="mt-1.5 sm:mt-2 text-text-secondary text-sm sm:text-base">
              {mode === 'register' ? "Avval akkaunt yarating, keyin tizimga kirasiz." : t('login.form.subtitle')}
            </p>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                  <p className="text-red-600 text-xs sm:text-sm font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="mt-6 sm:mt-8 space-y-4 sm:space-y-5">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label htmlFor="register-name" className="block text-sm font-medium text-text-primary">
                    Ism
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                    <input
                      id="register-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ismingiz"
                      required={mode === 'register'}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border-default bg-surface-secondary/50 text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/30 transition-all duration-200"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="block text-sm font-medium text-text-primary">
                  {t('login.form.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                  <input
                     id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@kinderadmin.io"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border-default bg-surface-secondary/50 text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/30 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="login-password" className="block text-sm font-medium text-text-primary">
                  {t('login.form.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-border-default bg-surface-secondary/50 text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/30 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 text-text-tertiary hover:text-text-secondary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="remember-me" className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input
                      id="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-4 h-4 rounded border border-border-default bg-surface-primary peer-checked:bg-navy-900 peer-checked:border-navy-900 transition-all duration-200 flex items-center justify-center">
                      {rememberMe && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                    {t('login.form.remember')}
                  </span>
                </label>
                <button type="button" className="text-xs sm:text-sm text-text-primary font-medium hover:text-text-secondary transition-colors">
                  {t('login.form.forgot')}
                </button>
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={isLoading}
                className="w-full py-3 rounded-xl border border-border-default text-text-primary font-semibold text-sm hover:bg-surface-secondary transition-colors"
              >
                Google orqali kirish
              </button>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.01 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                className="relative w-full py-3 sm:py-3.5 rounded-xl bg-navy-900 text-white font-semibold text-sm hover:bg-navy-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-navy-900/20 flex items-center justify-center gap-2 overflow-hidden group"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('login.form.checking')}</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'register' ? "Ro'yxatdan o'tish" : t('login.form.loginBtn')}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                  </>
                )}
                {!isLoading && (
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                )}
              </motion.button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
                className="text-sm text-navy-700 hover:underline"
              >
                {mode === 'login' ? "Akkauntingiz yo'qmi? Ro'yxatdan o'ting" : 'Akkauntingiz bormi? Login qiling'}
              </button>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-6 sm:mt-8 p-3 sm:p-4 rounded-xl bg-surface-secondary border border-border-subtle"
            >
              <p className="text-[10px] sm:text-xs text-text-tertiary text-center">
                {t('login.mockHint')}
              </p>
            </motion.div>

            <p className="mt-6 sm:mt-8 text-center text-[10px] sm:text-xs text-text-tertiary">
              {t('login.form.privacy')}
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
