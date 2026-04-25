import type { GroupInfo } from '@/types';

export interface GroupSchedule {
  day: string;
  shortDay: string;
  startTime: string;
  endTime: string;
  subjects: string[];
}

export interface GroupDetail extends GroupInfo {
  description: string;
  room: string;
  assistantTeacher: string;
  schedule: GroupSchedule[];
  monthlyFee: number;
  averageAttendance: number;
  activeChildren: number;
  inactiveChildren: number;
  trialChildren: number;
}

export const groupsDetailData: GroupDetail[] = [
  {
    id: 'g1', name: 'Quyoshlar', capacity: 20, currentCount: 18, teacher: 'Maria Rodriguez',
    ageRange: '2-3', color: '#f59e0b', description: 'Eng kichik bolalar guruhi. Asosiy e\'tibor — ijtimoiylashtirilish va motorik rivojlanish.',
    room: '101-xona', assistantTeacher: 'Nilufar Karimova', monthlyFee: 2500000,
    averageAttendance: 92, activeChildren: 16, inactiveChildren: 1, trialChildren: 1,
    schedule: [
      { day: 'Dushanba', shortDay: 'Du', startTime: '08:00', endTime: '17:00', subjects: ['Ertalabki mashq', 'O\'yin terapiyasi', 'Musiqa'] },
      { day: 'Seshanba', shortDay: 'Se', startTime: '08:00', endTime: '17:00', subjects: ['Rasm chizish', 'Tabiat bilan tanishish', 'Qo\'g\'irchoq teatri'] },
      { day: 'Chorshanba', shortDay: 'Cho', startTime: '08:00', endTime: '17:00', subjects: ['Ritmika', 'Konstruktor', 'Ertak o\'qish'] },
      { day: 'Payshanba', shortDay: 'Pa', startTime: '08:00', endTime: '17:00', subjects: ['Sport mashqlari', 'Applikatsiya', 'Nutq rivojlantirish'] },
      { day: 'Juma', shortDay: 'Ju', startTime: '08:00', endTime: '17:00', subjects: ['Bayram dasturi', 'Erkin o\'yin', 'Kreativ faoliyat'] },
      { day: 'Shanba', shortDay: 'Sha', startTime: '08:00', endTime: '13:00', subjects: ['O\'yin mashg\'ulotlari', 'Hayot ko\'nikmalari'] },
    ],
  },
  {
    id: 'g2', name: 'Kapalaklar', capacity: 20, currentCount: 16, teacher: 'Sarah Johnson',
    ageRange: '3-4', color: '#8b5cf6', description: 'O\'rta guruh. Nutq rivojlantirish, kreativ fikrlash va jamoaviy o\'yinlarga e\'tibor beriladi.',
    room: '102-xona', assistantTeacher: 'Gulnora Toshmatova', monthlyFee: 2500000,
    averageAttendance: 94, activeChildren: 14, inactiveChildren: 1, trialChildren: 1,
    schedule: [
      { day: 'Dushanba', shortDay: 'Du', startTime: '08:00', endTime: '17:00', subjects: ['Matematika asoslari', 'Musiqa', 'Jismoniy tarbiya'] },
      { day: 'Seshanba', shortDay: 'Se', startTime: '08:00', endTime: '17:00', subjects: ['Til o\'rganish', 'Rasm', 'Teatr'] },
      { day: 'Chorshanba', shortDay: 'Cho', startTime: '08:00', endTime: '17:00', subjects: ['Tabiat', 'Lego konstruktor', 'Qo\'shiq'] },
      { day: 'Payshanba', shortDay: 'Pa', startTime: '08:00', endTime: '17:00', subjects: ['Sport', 'Qo\'l mehnati', 'Nutq'] },
      { day: 'Juma', shortDay: 'Ju', startTime: '08:00', endTime: '17:00', subjects: ['Eksperiment', 'Erkin faoliyat', 'Video darslar'] },
      { day: 'Shanba', shortDay: 'Sha', startTime: '08:00', endTime: '13:00', subjects: ['O\'yin', 'Kreativ faoliyat'] },
    ],
  },
  {
    id: 'g3', name: 'Kamalaklar', capacity: 22, currentCount: 20, teacher: 'Emily Davis',
    ageRange: '4-5', color: '#3b82f6', description: 'Katta guruh. Maktabga tayyorlov bosqichi — alifbo, sanash va mantiqiy fikrlash.',
    room: '201-xona', assistantTeacher: 'Dildora Rahimova', monthlyFee: 2500000,
    averageAttendance: 95, activeChildren: 18, inactiveChildren: 1, trialChildren: 1,
    schedule: [
      { day: 'Dushanba', shortDay: 'Du', startTime: '08:00', endTime: '17:00', subjects: ['Alifbo', 'Matematika', 'Ingliz tili'] },
      { day: 'Seshanba', shortDay: 'Se', startTime: '08:00', endTime: '17:00', subjects: ['O\'qish', 'Rasm', 'Jismoniy tarbiya'] },
      { day: 'Chorshanba', shortDay: 'Cho', startTime: '08:00', endTime: '17:00', subjects: ['Mantiq', 'Musiqa', 'Tabiat bilimlari'] },
      { day: 'Payshanba', shortDay: 'Pa', startTime: '08:00', endTime: '17:00', subjects: ['Yozuv', 'Teatr', 'Sport'] },
      { day: 'Juma', shortDay: 'Ju', startTime: '08:00', endTime: '17:00', subjects: ['Loyiha ishi', 'Erkin faoliyat', 'Musiqa'] },
      { day: 'Shanba', shortDay: 'Sha', startTime: '08:00', endTime: '13:00', subjects: ['Takrorlash', 'O\'yin'] },
    ],
  },
  {
    id: 'g4', name: 'Yulduzlar', capacity: 22, currentCount: 14, teacher: 'Anna Wilson',
    ageRange: '5-6', color: '#10b981', description: 'Maktabga tayyorlov guruhi. Kuchli akademik dastur va ijtimoiy ko\'nikmalar.',
    room: '202-xona', assistantTeacher: 'Shahlo Mirzayeva', monthlyFee: 2500000,
    averageAttendance: 93, activeChildren: 13, inactiveChildren: 0, trialChildren: 1,
    schedule: [
      { day: 'Dushanba', shortDay: 'Du', startTime: '08:00', endTime: '17:00', subjects: ['Matematika', 'Ingliz tili', 'Yozuv'] },
      { day: 'Seshanba', shortDay: 'Se', startTime: '08:00', endTime: '17:00', subjects: ['O\'qish', 'Fan tajribalari', 'Rasm'] },
      { day: 'Chorshanba', shortDay: 'Cho', startTime: '08:00', endTime: '17:00', subjects: ['Mantiq', 'Musiqa', 'Jismoniy tarbiya'] },
      { day: 'Payshanba', shortDay: 'Pa', startTime: '08:00', endTime: '17:00', subjects: ['Alifbo', 'Teatr', 'Shaxmat'] },
      { day: 'Juma', shortDay: 'Ju', startTime: '08:00', endTime: '17:00', subjects: ['Loyiha', 'Robototexnika', 'Sport'] },
      { day: 'Shanba', shortDay: 'Sha', startTime: '08:00', endTime: '13:00', subjects: ['Mustaqil ish', 'O\'yin'] },
    ],
  },
  {
    id: 'g5', name: 'Delfinlar', capacity: 18, currentCount: 12, teacher: 'Lisa Thompson',
    ageRange: '6-7', color: '#06b6d4', description: 'Eng katta guruh. Maktab dasturiga to\'liq tayyorgarlik, mustaqillik va liderlik.',
    room: '203-xona', assistantTeacher: 'Malika Abdullayeva', monthlyFee: 2500000,
    averageAttendance: 97, activeChildren: 12, inactiveChildren: 0, trialChildren: 0,
    schedule: [
      { day: 'Dushanba', shortDay: 'Du', startTime: '08:00', endTime: '17:00', subjects: ['Matematika', 'O\'qish', 'Ingliz tili'] },
      { day: 'Seshanba', shortDay: 'Se', startTime: '08:00', endTime: '17:00', subjects: ['Yozuv', 'Tabiat fanlari', 'Sport'] },
      { day: 'Chorshanba', shortDay: 'Cho', startTime: '08:00', endTime: '17:00', subjects: ['Mantiq', 'Dasturlash asoslari', 'Musiqa'] },
      { day: 'Payshanba', shortDay: 'Pa', startTime: '08:00', endTime: '17:00', subjects: ['Shaxmat', 'San\'at', 'Debat'] },
      { day: 'Juma', shortDay: 'Ju', startTime: '08:00', endTime: '17:00', subjects: ['Loyiha himoyasi', 'Erkin faoliyat', 'Raqs'] },
      { day: 'Shanba', shortDay: 'Sha', startTime: '08:00', endTime: '13:00', subjects: ['Test sinovlari', 'Sport musobaqasi'] },
    ],
  },
];
