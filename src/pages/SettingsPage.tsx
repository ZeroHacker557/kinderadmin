import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, User, Lock, Palette, Globe, CheckCircle2,
  Moon, Sun, Monitor
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import {
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile, upsertUserProfile, kindergartenService } from '@/services/firestore';


export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user, kindergartenId, kindergarten } = useAuth();
  const auth = getAuth(app);
  const providerIds = auth.currentUser?.providerData.map((provider) => provider.providerId) ?? [];
  const canChangePassword = providerIds.includes('password');
  
  const tabs = [
    { id: 'profile', label: t('settings.tabs.profile.title'), icon: User, description: t('settings.tabs.profile.desc') },
    { id: 'appearance', label: t('settings.tabs.appearance.title'), icon: Palette, description: t('settings.tabs.appearance.desc') },
  ] as const;

  type TabId = typeof tabs[number]['id'];

  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [saved, setSaved] = useState(false);


  // Profile status
  const [profile, setProfile] = useState({
    firstName: 'Admin',
    lastName: '',
    kindergartenName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    let isActive = true;
    const run = async () => {
      const auth = getAuth(app);
      const uid = auth.currentUser?.uid || user?.id;
      if (!uid) return;

      try {
        const remote = await getUserProfile(uid);
        if (!isActive) return;
        if (remote?.firstName || remote?.lastName) {
          setProfile((p) => ({
            ...p,
            firstName: (remote?.firstName || '').trim() || 'Admin',
            lastName: (remote?.lastName || '').trim(),
          }));
          return;
        }
      } catch {
        // ignore and fall back below
      }

      const parts = (user?.name || '').trim().split(/\s+/).filter(Boolean);
      const firstName = parts[0] || 'Admin';
      const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
      setProfile((p) => ({ ...p, firstName, lastName }));
    };

    run();
    return () => {
      isActive = false;
    };
  }, [user?.id, user?.name]);

  useEffect(() => {
    if (kindergarten?.name) {
      setProfile(p => ({ ...p, kindergartenName: kindergarten.name }));
    }
  }, [kindergarten?.name]);

  const handleSave = async () => {
    const firstName = profile.firstName.trim() || 'Admin';
    const lastName = profile.lastName.trim();
    const displayName = `${firstName}${lastName ? ` ${lastName}` : ''}`.trim();

    try {
      if (!auth.currentUser) throw new Error('No auth user');

      // 1) Save profile to Firestore
      await upsertUserProfile(auth.currentUser.uid, { firstName, lastName });

      // 1.5) Save kindergarten name
      if (kindergartenId && profile.kindergartenName.trim()) {
        await kindergartenService.update(kindergartenId, { name: profile.kindergartenName.trim() });
      }

      // 2) Keep Firebase Auth displayName in sync (optional, but useful)
      await updateProfile(auth.currentUser, { displayName });

      // 3) Change password if user filled it
      const currentPassword = profile.currentPassword.trim();
      const newPasswordValue = profile.newPassword.trim();
      const confirmPassword = profile.confirmPassword.trim();

      if (currentPassword || newPasswordValue || confirmPassword) {
        if (!canChangePassword) {
          throw new Error(t('settings.password.emailOnlyError', "Parolni faqat email orqali ro'yxatdan o'tgan foydalanuvchi almashtira oladi"));
        }
        if (!currentPassword || !newPasswordValue) {
          throw new Error("Parolni o'zgartirish uchun joriy va yangi parolni kiriting");
        }
        if (newPasswordValue !== confirmPassword) {
          throw new Error('Yangi parol tasdiqlash bilan mos emas');
        }
        if (newPasswordValue.length < 6) {
          throw new Error("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak");
        }

        const email = auth.currentUser.email;
        if (!email) throw new Error('Email topilmadi');
        const credential = EmailAuthProvider.credential(email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, newPasswordValue);

        setProfile((p) => ({ ...p, currentPassword: '', newPassword: '', confirmPassword: '' }));
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Sozlamalarni saqlashda xatolik');
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-border-default bg-surface-secondary/50 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900/30 transition-all duration-200';
  const labelClass = 'block text-sm font-medium text-text-primary mb-1.5';

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-primary tracking-tight">{t('settings.title')}</h1>
          <p className="text-xs sm:text-sm text-text-tertiary mt-0.5">{t('settings.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium"
              >
                <CheckCircle2 className="w-4 h-4" />
                {t('settings.saved')}
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-3 sm:px-5 py-2 rounded-xl bg-navy-900 text-white text-xs sm:text-sm font-semibold hover:bg-navy-800 transition-colors shadow-sm"
          >
            <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{t('settings.save')}</span>
            <span className="sm:hidden">{t('settings.saveMobile')}</span>
          </button>
        </div>
      </motion.div>

      {/* Main layout */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="flex flex-col md:flex-row gap-4 sm:gap-6"
      >
        {/* Sidebar tabs */}
        <div className="md:w-64 flex-shrink-0">
          <div className="bg-surface-primary rounded-2xl border border-border-default p-2 sm:sticky sm:top-6">
            <div className="flex flex-col gap-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabId)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-navy-900 text-white shadow-sm'
                        : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${activeTab === tab.id ? 'text-white' : 'text-text-tertiary'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{tab.label}</p>
                      <p className={`text-[10px] truncate ${activeTab === tab.id ? 'text-white/70' : 'text-text-tertiary'}`}>{tab.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {/* PROFILE TAB */}
              {activeTab === 'profile' && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-surface-primary rounded-2xl border border-border-default p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-text-primary">{t('settings.profile.title')}</h3>
                        <p className="text-xs text-text-tertiary">{t('settings.profile.desc')}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className={labelClass}>{t('settings.profile.firstName', 'Ism')}</label>
                        <input
                          type="text"
                          value={profile.firstName}
                          onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>{t('settings.profile.lastName', 'Familiya')}</label>
                        <input
                          type="text"
                          value={profile.lastName}
                          onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>{t('settings.profile.kindergartenName', "Bog'cha nomi")}</label>
                      <input
                        type="text"
                        value={profile.kindergartenName}
                        onChange={e => setProfile(p => ({ ...p, kindergartenName: e.target.value }))}
                        className={inputClass}
                        placeholder="Bog'changiz nomini kiriting"
                      />
                    </div>
                  </div>

                  {canChangePassword ? (
                    <div className="bg-surface-primary rounded-2xl border border-border-default p-5 sm:p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                          <Lock className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-text-primary">{t('settings.password.title')}</h3>
                          <p className="text-xs text-text-tertiary">{t('settings.password.desc')}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className={labelClass}>{t('settings.password.current')}</label>
                          <input
                            type="password"
                            placeholder="••••••••"
                            value={profile.currentPassword}
                            onChange={e => setProfile(p => ({ ...p, currentPassword: e.target.value }))}
                            className={inputClass}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>{t('settings.password.new')}</label>
                            <input
                              type="password"
                              placeholder="••••••••"
                              value={profile.newPassword}
                              onChange={e => setProfile(p => ({ ...p, newPassword: e.target.value }))}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>{t('settings.password.confirm')}</label>
                            <input
                              type="password"
                              placeholder="••••••••"
                              value={profile.confirmPassword}
                              onChange={e => setProfile(p => ({ ...p, confirmPassword: e.target.value }))}
                              className={inputClass}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-surface-primary rounded-2xl border border-border-default p-5 sm:p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Lock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-text-primary">{t('settings.password.title')}</h3>
                          <p className="text-xs text-text-tertiary">
                            {t('settings.password.emailOnlyHint', "Siz Google orqali kirgansiz. Parolni almashtirish email orqali ro'yxatdan o'tgan akkauntlar uchun mavjud.")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* APPEARANCE TAB */}
              {activeTab === 'appearance' && (
                <div className="bg-surface-primary rounded-2xl border border-border-default p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Palette className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-text-primary">{t('settings.appearance.title')}</h3>
                      <p className="text-xs text-text-tertiary">{t('settings.appearance.desc')}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className={labelClass}>{t('settings.appearance.theme')}</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'light' as const, icon: Sun, label: t('settings.appearance.themes.light'), desc: t('settings.appearance.themes.lightDesc') },
                        { id: 'dark' as const, icon: Moon, label: t('settings.appearance.themes.dark'), desc: t('settings.appearance.themes.darkDesc') },
                        { id: 'system' as const, icon: Monitor, label: t('settings.appearance.themes.system'), desc: t('settings.appearance.themes.systemDesc') },
                      ].map(themeItem => (
                        <button
                          key={themeItem.id}
                          onClick={() => setTheme(themeItem.id)}
                          className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                            theme === themeItem.id
                              ? 'border-navy-900 bg-surface-secondary/50'
                              : 'border-border-default hover:border-navy-200 bg-surface-primary'
                          }`}
                        >
                          <themeItem.icon className={`w-6 h-6 mx-auto mb-2 ${theme === themeItem.id ? 'text-text-primary' : 'text-text-tertiary'}`} />
                          <p className="text-sm font-semibold text-text-primary">{themeItem.label}</p>
                          <p className="text-[10px] text-text-tertiary mt-0.5">{themeItem.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}><Globe className="w-3.5 h-3.5 inline mr-1.5 text-text-tertiary" />{t('settings.appearance.lang')}</label>
                    <select
                      value={i18n.language}
                      onChange={e => i18n.changeLanguage(e.target.value)}
                      className={inputClass}
                    >
                      <option value="uz">{t('settings.appearance.langs.uz')}</option>
                      <option value="ru">{t('settings.appearance.langs.ru')}</option>
                    </select>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
