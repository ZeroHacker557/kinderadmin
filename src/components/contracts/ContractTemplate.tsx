import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Child, Kindergarten } from '@/types';
import { formatDateDisplay } from '@/utils/date';

interface ContractTemplateProps {
  child: Child;
  kindergarten: Kindergarten | null;
}

const ContractTemplate = React.forwardRef<HTMLDivElement, ContractTemplateProps>(
  ({ child, kindergarten }, ref) => {
    const { t } = useTranslation();

    const primaryParent = child.parents?.[0];
    const parentFullName = primaryParent
      ? `${primaryParent.lastName} ${primaryParent.firstName}`
      : '_______________';
    const passportSeries = primaryParent?.passportSeries || '_______________';
    const parentAddress = primaryParent?.address || child.address || '_______________';
    const parentPhone = primaryParent?.phone || '_______________';
    const childFullName = `${child.lastName} ${child.firstName}`;
    const kindergartenName = kindergarten?.name || "Bog'cha";

    const enrollmentDate = child.enrollmentDate
      ? formatDateDisplay(child.enrollmentDate)
      : '_______________';

    const todayDate = formatDateDisplay(new Date().toISOString());

    const contractNumber = `${new Date().getFullYear()}-${child.id?.slice(-6)?.toUpperCase() || '000000'}`;

    return (
      <div ref={ref} className="print-contract hidden print:block">
        <div className="w-[210mm] min-h-[297mm] mx-auto bg-white text-black p-[20mm] font-serif text-[13px] leading-relaxed">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
              {t('contracts.template.docType', 'Shartnoma')}
            </div>
            <h1 className="text-xl font-bold uppercase tracking-wide mb-1">
              {t('contracts.template.title', "TA'LIM XIZMATLARI KO'RSATISH SHARTNOMASI")}
            </h1>
            <div className="text-sm text-gray-600 mt-2">
              № {contractNumber}
            </div>
          </div>

          {/* Date & Location */}
          <div className="flex justify-between mb-6 text-sm">
            <span>{t('contracts.template.city', 'Toshkent shahri')}</span>
            <span>{todayDate}</span>
          </div>

          <hr className="border-gray-300 mb-6" />

          {/* Parties */}
          <div className="mb-6">
            <p className="mb-3 text-justify">
              <strong>"{kindergartenName}"</strong>{' '}
              {t('contracts.template.partyA', "maktabgacha ta'lim muassasasi (bundan buyon — \"Muassasa\"), bir tomondan, va")}
            </p>
            <p className="mb-3 text-justify">
              {t('contracts.template.citizen', 'Fuqaro')}{' '}
              <strong className="underline decoration-dotted underline-offset-4">{parentFullName}</strong>,{' '}
              {t('contracts.template.passport', 'pasport seriyasi va raqami:')}{' '}
              <strong className="underline decoration-dotted underline-offset-4">{passportSeries}</strong>,{' '}
              {t('contracts.template.livingAt', 'yashash manzili:')}{' '}
              <strong className="underline decoration-dotted underline-offset-4">{parentAddress}</strong>{' '}
              {t('contracts.template.partyB', "(bundan buyon — \"Ota-ona\"), ikkinchi tomondan, quyidagi shartnomani tuzdilar:")}
            </p>
          </div>

          {/* Section 1 */}
          <div className="mb-5">
            <h2 className="font-bold text-sm mb-2 uppercase">
              {t('contracts.template.section1Title', '1. SHARTNOMA PREDMETI')}
            </h2>
            <p className="mb-2 text-justify">
              1.1. {t('contracts.template.s1p1', "Muassasa Ota-onaning farzandi")}{' '}
              <strong className="underline decoration-dotted underline-offset-4">{childFullName}</strong>{' '}
              {t('contracts.template.s1p1cont', "ni maktabgacha ta'lim dasturi bo'yicha o'qitish va tarbiyalash xizmatlarini ko'rsatishni, Ota-ona esa belgilangan tartibda to'lov to'lashni o'z zimmasiga oladi.")}
            </p>
            <p className="mb-2 text-justify">
              1.2. {t('contracts.template.s1p2', 'Bolaning qabul qilingan sanasi:')}{' '}
              <strong className="underline decoration-dotted underline-offset-4">{enrollmentDate}</strong>.
            </p>
            <p className="text-justify">
              1.3. {t('contracts.template.s1p3', "Ta'lim xizmatlari muassasa tomonidan belgilangan kun tartibi, dastur va me'yorlar asosida ko'rsatiladi.")}
            </p>
          </div>

          {/* Section 2 */}
          <div className="mb-5">
            <h2 className="font-bold text-sm mb-2 uppercase">
              {t('contracts.template.section2Title', '2. MUASSASA MAJBURIYATLARI')}
            </h2>
            <p className="mb-1 text-justify">2.1. {t('contracts.template.s2p1', "Bolani sog'lom va xavfsiz muhitda tarbiyalash, ta'lim dasturlarini yuqori sifatda amalga oshirish.")}</p>
            <p className="mb-1 text-justify">2.2. {t('contracts.template.s2p2', "Bolaning ovqatlanishi, sog'lig'i va shaxsiy gigiyenasiga alohida e'tibor qaratish.")}</p>
            <p className="mb-1 text-justify">2.3. {t('contracts.template.s2p3', "Ota-onani bolaning rivojlanishi, salomatligi va xulqi to'g'risida o'z vaqtida xabardor qilish.")}</p>
            <p className="text-justify">2.4. {t('contracts.template.s2p4', 'Muassasada belgilangan ichki tartib-qoidalarga rioya qilish.')}</p>
          </div>

          {/* Section 3 */}
          <div className="mb-5">
            <h2 className="font-bold text-sm mb-2 uppercase">
              {t('contracts.template.section3Title', '3. OTA-ONA MAJBURIYATLARI')}
            </h2>
            <p className="mb-1 text-justify">3.1. {t('contracts.template.s3p1', "Har oyning 10-sanasigacha oylik to'lovni to'liq miqdorda amalga oshirish.")}</p>
            <p className="mb-1 text-justify">3.2. {t('contracts.template.s3p2', 'Bolani soat 8:00 dan 9:00 gacha muassasaga olib kelish va soat 17:00 dan 18:00 gacha olib ketish.')}</p>
            <p className="mb-1 text-justify">3.3. {t('contracts.template.s3p3', "Bola kasallangan hollarda muassasani zudlik bilan xabardor qilish va tibbiy ma'lumotnomani taqdim etish.")}</p>
            <p className="text-justify">3.4. {t('contracts.template.s3p4', "Muassasa ichki tartib-qoidalariga rioya qilish va tarbiyaviy jarayonga ko'maklashish.")}</p>
          </div>

          {/* Section 4 */}
          <div className="mb-5">
            <h2 className="font-bold text-sm mb-2 uppercase">
              {t('contracts.template.section4Title', "4. TO'LOV SHARTLARI")}
            </h2>
            <p className="mb-1 text-justify">4.1. {t('contracts.template.s4p1', "Oylik to'lov miqdori muassasa tomonidan belgilanadi va har o'quv yili boshida Ota-onaga yozma ravishda bildiriladi.")}</p>
            <p className="text-justify">4.2. {t('contracts.template.s4p2', "To'lov muddati o'tgan taqdirda, muassasa qo'shimcha chora ko'rish huquqiga ega.")}</p>
          </div>

          {/* Section 5 */}
          <div className="mb-5">
            <h2 className="font-bold text-sm mb-2 uppercase">
              {t('contracts.template.section5Title', '5. SHARTNOMA MUDDATI VA BEKOR QILISH')}
            </h2>
            <p className="mb-1 text-justify">5.1. {t('contracts.template.s5p1', "Ushbu shartnoma imzolangan kundan boshlab bir o'quv yili davomida amal qiladi.")}</p>
            <p className="mb-1 text-justify">5.2. {t('contracts.template.s5p2', 'Har bir tomon shartnomani bekor qilish uchun kamida 30 kun oldin yozma bildirishnoma yuborishi shart.')}</p>
            <p className="text-justify">5.3. {t('contracts.template.s5p3', 'Shartnoma shartlari buzilgan taqdirda, aybdor tomon javobgar hisoblanadi.')}</p>
          </div>

          {/* Section 6 */}
          <div className="mb-8">
            <h2 className="font-bold text-sm mb-2 uppercase">
              {t('contracts.template.section6Title', '6. YAKUNIY QOIDALAR')}
            </h2>
            <p className="mb-1 text-justify">6.1. {t('contracts.template.s6p1', "Ushbu shartnoma ikki nusxada tuzilgan bo'lib, har bir tomon uchun bir nusxa mo'ljallangan.")}</p>
            <p className="text-justify">6.2. {t('contracts.template.s6p2', "Shartnomaga kiritilgan barcha o'zgartirish va qo'shimchalar yozma ravishda rasmiylashtiriladi.")}</p>
          </div>

          {/* Signatures */}
          <div className="mt-12 grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-sm mb-4 uppercase">{t('contracts.template.institutionSide', 'MUASSASA')}</h3>
              <div className="space-y-3 text-sm">
                <p>{kindergartenName}</p>
                <div className="mt-8 pt-1 border-t border-gray-400 w-48">
                  <span className="text-[11px] text-gray-500">{t('contracts.template.signatureLine', 'Imzo / M.O.')}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-sm mb-4 uppercase">{t('contracts.template.parentSide', 'OTA-ONA')}</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">{t('contracts.template.fullName', 'F.I.SH:')}</span> {parentFullName}</p>
                <p><span className="text-gray-500">{t('contracts.template.passportLabel', 'Pasport:')}</span> {passportSeries}</p>
                <p><span className="text-gray-500">{t('contracts.template.addressLabel', 'Manzil:')}</span> {parentAddress}</p>
                <p><span className="text-gray-500">{t('contracts.template.phoneLabel', 'Telefon:')}</span> {parentPhone}</p>
                <div className="mt-8 pt-1 border-t border-gray-400 w-48">
                  <span className="text-[11px] text-gray-500">{t('contracts.template.signatureLine', 'Imzo / M.O.')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ContractTemplate.displayName = 'ContractTemplate';

export default ContractTemplate;
