import { motion } from 'framer-motion';
import { Headset, Mail, MessageCircle, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const support = {
  name: 'Abubakr Abdulbositov',
  phone: '+998974009877',
  telegram: 'https://t.me/abubakr_a71',
  email: 'abubakrfrontend@gmail.com',
};

export default function HelpPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 sm:space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-3xl border border-border-default bg-surface-primary"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900/8 via-emerald-500/6 to-transparent" />
        <div className="relative p-5 sm:p-7">
          <div className="inline-flex items-center gap-2 rounded-xl border border-border-default bg-surface-secondary/40 px-3 py-1.5 text-xs text-text-secondary">
            <Headset className="w-3.5 h-3.5" />
            {t('help.badge', "Qo'llab-quvvatlash")}
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            {t('help.title', "Yordam va qo'llab-quvvatlash")}
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-text-secondary max-w-2xl">
            {t(
              'help.subtitle',
              "Agar tizimda biror muammo yoki savol bo'lsa, quyidagi kontaktlar orqali bemalol murojaat qiling.",
            )}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5"
      >
        <div className="lg:col-span-2 rounded-2xl border border-border-default bg-surface-primary p-4 sm:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-secondary flex items-center justify-center flex-shrink-0">
              <UserRound className="w-5 h-5 text-text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-text-tertiary">
                {t('help.contactPerson', "Mas'ul shaxs")}
              </p>
              <p className="text-lg font-semibold text-text-primary">{support.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={`tel:${support.phone}`}
              className="group rounded-xl border border-border-default bg-surface-secondary/35 px-4 py-3 hover:border-navy-900/25 transition-colors"
            >
              <div className="flex items-center gap-2 text-text-primary">
                <Phone className="w-4 h-4" />
                <span className="font-medium">{t('help.call', "Qo'ng'iroq qilish")}</span>
              </div>
              <p className="mt-1 text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                {support.phone}
              </p>
            </a>

            <a
              href={support.telegram}
              target="_blank"
              rel="noreferrer"
              className="group rounded-xl border border-border-default bg-surface-secondary/35 px-4 py-3 hover:border-navy-900/25 transition-colors"
            >
              <div className="flex items-center gap-2 text-text-primary">
                <MessageCircle className="w-4 h-4" />
                <span className="font-medium">{t('help.telegram', 'Telegram')}</span>
              </div>
              <p className="mt-1 text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                @abubakr_a71
              </p>
            </a>

            <a
              href={`mailto:${support.email}`}
              className="group sm:col-span-2 rounded-xl border border-border-default bg-surface-secondary/35 px-4 py-3 hover:border-navy-900/25 transition-colors"
            >
              <div className="flex items-center gap-2 text-text-primary">
                <Mail className="w-4 h-4" />
                <span className="font-medium">{t('help.email', 'Email')}</span>
              </div>
              <p className="mt-1 text-sm text-text-secondary group-hover:text-text-primary transition-colors break-all">
                {support.email}
              </p>
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-border-default bg-surface-primary p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-text-primary">
            <ShieldCheck className="w-4 h-4" />
            <h2 className="text-sm font-semibold">{t('help.noteTitle', "Murojaatdan oldin")}</h2>
          </div>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li>{t('help.tip1', "Muammo qaysi bo'limda chiqqanini yozing (Bolalar, Guruhlar, Moliya...).")}</li>
            <li>{t('help.tip2', "Imkoni bo'lsa, skrinshot yoki xato matnini yuboring.")}</li>
            <li>{t('help.tip3', "Muammo qachondan boshlanganini qisqa tushuntiring.")}</li>
          </ul>
          <p className="pt-2 text-xs text-text-tertiary">
            {t('help.footer', "Texnik muammo bo'lsa, sizga imkon qadar tez yordam beriladi.")}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
