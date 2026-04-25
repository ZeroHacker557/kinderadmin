import type { Child, GroupInfo } from '@/types';

export const groups: GroupInfo[] = [
  { id: 'g1', name: 'Quyoshlar', capacity: 20, currentCount: 18, teacher: 'Maria Rodriguez', ageRange: '2-3', color: '#f59e0b' },
  { id: 'g2', name: 'Kapalaklar', capacity: 20, currentCount: 16, teacher: 'Sarah Johnson', ageRange: '3-4', color: '#8b5cf6' },
  { id: 'g3', name: 'Kamalaklar', capacity: 22, currentCount: 20, teacher: 'Emily Davis', ageRange: '4-5', color: '#3b82f6' },
  { id: 'g4', name: 'Yulduzlar', capacity: 22, currentCount: 14, teacher: 'Anna Wilson', ageRange: '5-6', color: '#10b981' },
  { id: 'g5', name: 'Delfinlar', capacity: 18, currentCount: 12, teacher: 'Lisa Thompson', ageRange: '6-7', color: '#06b6d4' },
];

export const childrenData: Child[] = [
  {
    id: 'ch-001', firstName: 'Emma', lastName: 'Johnson', dateOfBirth: '2022-03-15', gender: 'female',
    group: 'Quyoshlar', groupId: 'g1', status: 'active', enrollmentDate: '2024-09-01', attendanceRate: 96,
    address: 'Toshkent sh., Chilonzor tumani, 12-kvartal',
    parents: [
      { id: 'p1', firstName: 'Michael', lastName: 'Johnson', relation: 'father', phone: '+998 90 123-45-67', email: 'michael.j@email.com', occupation: 'Dasturchi' },
      { id: 'p2', firstName: 'Sarah', lastName: 'Johnson', relation: 'mother', phone: '+998 90 123-45-68', email: 'sarah.j@email.com', occupation: 'Arxitektor' },
    ],
    medical: { bloodType: 'A+', allergies: ['Yeryong\'oq'], medications: [], conditions: [], emergencyContact: 'Sarah Johnson', emergencyPhone: '+998 90 123-45-68' },
    payments: [
      { id: 'pay-1', month: '2026-04', amount: 2500000, paidAmount: 2500000, status: 'paid', dueDate: '2026-04-05', paidDate: '2026-04-03' },
      { id: 'pay-2', month: '2026-03', amount: 2500000, paidAmount: 2500000, status: 'paid', dueDate: '2026-03-05', paidDate: '2026-03-04' },
    ],
  },
  {
    id: 'ch-002', firstName: 'Liam', lastName: 'Chen', dateOfBirth: '2021-07-22', gender: 'male',
    group: 'Kapalaklar', groupId: 'g2', status: 'active', enrollmentDate: '2024-09-01', attendanceRate: 92,
    address: 'Toshkent sh., Yakkasaroy tumani, Shota Rustaveli ko\'chasi',
    parents: [
      { id: 'p3', firstName: 'David', lastName: 'Chen', relation: 'father', phone: '+998 91 234-56-78', email: 'david.chen@email.com', occupation: 'Shifokor' },
      { id: 'p4', firstName: 'Mei', lastName: 'Chen', relation: 'mother', phone: '+998 91 234-56-79', email: 'mei.chen@email.com', occupation: 'Farmatsevt' },
    ],
    medical: { bloodType: 'B+', allergies: [], medications: [], conditions: ['Yengil astma'], emergencyContact: 'David Chen', emergencyPhone: '+998 91 234-56-78', doctorName: 'Dr. Roberts', doctorPhone: '+998 71 999-00-01' },
    payments: [
      { id: 'pay-3', month: '2026-04', amount: 2500000, paidAmount: 2500000, status: 'paid', dueDate: '2026-04-05', paidDate: '2026-04-02' },
      { id: 'pay-4', month: '2026-03', amount: 2500000, paidAmount: 2500000, status: 'paid', dueDate: '2026-03-05', paidDate: '2026-03-01' },
    ],
  },
  {
    id: 'ch-003', firstName: 'Sophia', lastName: 'Martinez', dateOfBirth: '2022-01-10', gender: 'female',
    group: 'Quyoshlar', groupId: 'g1', status: 'active', enrollmentDate: '2025-01-15', attendanceRate: 88,
    address: 'Toshkent sh., Mirzo Ulug\'bek tumani, 7-kvartal',
    parents: [
      { id: 'p5', firstName: 'Carlos', lastName: 'Martinez', relation: 'father', phone: '+998 93 345-67-89', email: 'carlos.m@email.com', occupation: 'O\'qituvchi' },
    ],
    medical: { bloodType: 'O+', allergies: ['Sut mahsulotlari', 'Gluten'], medications: ['Laktaid'], conditions: [], emergencyContact: 'Carlos Martinez', emergencyPhone: '+998 93 345-67-89' },
    payments: [
      { id: 'pay-5', month: '2026-04', amount: 2500000, paidAmount: 1600000, status: 'partial', dueDate: '2026-04-05' },
      { id: 'pay-6', month: '2026-03', amount: 2500000, paidAmount: 2500000, status: 'paid', dueDate: '2026-03-05', paidDate: '2026-03-07' },
    ],
  },
  {
    id: 'ch-004', firstName: 'Noah', lastName: 'Williams', dateOfBirth: '2020-11-25', gender: 'male',
    group: 'Kamalaklar', groupId: 'g3', status: 'active', enrollmentDate: '2023-09-01', attendanceRate: 94,
    address: 'Toshkent sh., Sergeli tumani, 3-kvartal',
    parents: [
      { id: 'p6', firstName: 'James', lastName: 'Williams', relation: 'father', phone: '+998 94 456-78-90', email: 'james.w@email.com', occupation: 'Advokat' },
      { id: 'p7', firstName: 'Rachel', lastName: 'Williams', relation: 'mother', phone: '+998 94 456-78-91', email: 'rachel.w@email.com', occupation: 'Buxgalter' },
    ],
    medical: { bloodType: 'AB+', allergies: [], medications: [], conditions: [], emergencyContact: 'Rachel Williams', emergencyPhone: '+998 94 456-78-91' },
    payments: [
      { id: 'pay-7', month: '2026-04', amount: 2500000, paidAmount: 0, status: 'overdue', dueDate: '2026-04-05' },
      { id: 'pay-8', month: '2026-03', amount: 2500000, paidAmount: 2500000, status: 'paid', dueDate: '2026-03-05', paidDate: '2026-03-03' },
    ],
  },
  {
    id: 'ch-005', firstName: 'Olivia', lastName: 'Brown', dateOfBirth: '2021-05-14', gender: 'female',
    group: 'Kapalaklar', groupId: 'g2', status: 'active', enrollmentDate: '2024-01-10', attendanceRate: 98,
    address: 'Toshkent sh., Yunusobod tumani, 19-kvartal',
    parents: [
      { id: 'p8', firstName: 'Robert', lastName: 'Brown', relation: 'father', phone: '+998 95 567-89-01', email: 'robert.b@email.com', occupation: 'Tadbirkor' },
      { id: 'p9', firstName: 'Jennifer', lastName: 'Brown', relation: 'mother', phone: '+998 95 567-89-02', email: 'jennifer.b@email.com', occupation: 'Hamshira' },
    ],
    medical: { bloodType: 'A-', allergies: [], medications: [], conditions: [], emergencyContact: 'Jennifer Brown', emergencyPhone: '+998 95 567-89-02' },
    payments: [
      { id: 'pay-9', month: '2026-04', amount: 2500000, paidAmount: 2500000, status: 'paid', dueDate: '2026-04-05', paidDate: '2026-04-01' },
      { id: 'pay-10', month: '2026-03', amount: 2500000, paidAmount: 2500000, status: 'paid', dueDate: '2026-03-05', paidDate: '2026-03-02' },
    ],
  },
  {
    id: 'ch-006', firstName: 'James', lastName: 'Davis', dateOfBirth: '2020-09-08', gender: 'male',
    group: 'Kamalaklar', groupId: 'g3', status: 'active', enrollmentDate: '2023-09-01', attendanceRate: 90,
    address: 'Toshkent sh., Olmazor tumani, Bunyodkor ko\'chasi',
    parents: [
      { id: 'p10', firstName: 'Thomas', lastName: 'Davis', relation: 'father', phone: '+998 97 678-90-12', email: 'thomas.d@email.com', occupation: 'Muhandis' },
      { id: 'p11', firstName: 'Amanda', lastName: 'Davis', relation: 'mother', phone: '+998 97 678-90-13', email: 'amanda.d@email.com', occupation: 'Dizayner' },
    ],
    medical: { bloodType: 'O-', allergies: ['Asalari chaqishi'], medications: ['EpiPen'], conditions: [], emergencyContact: 'Amanda Davis', emergencyPhone: '+998 97 678-90-13' },
    payments: [
      { id: 'pay-11', month: '2026-04', amount: 2500000, paidAmount: 2500000, status: 'paid', dueDate: '2026-04-05', paidDate: '2026-04-04' },
      { id: 'pay-12', month: '2026-03', amount: 2500000, paidAmount: 2500000, status: 'paid', dueDate: '2026-03-05', paidDate: '2026-03-05' },
    ],
  },
  {
    id: 'ch-007', firstName: 'Ava', lastName: 'Miller', dateOfBirth: '2021-12-03', gender: 'female',
    group: 'Kapalaklar', groupId: 'g2', status: 'trial', enrollmentDate: '2026-03-15', attendanceRate: 100,
    address: 'Toshkent sh., Mirobod tumani, Amir Temur ko\'chasi',
    parents: [
      { id: 'p12', firstName: 'Daniel', lastName: 'Miller', relation: 'father', phone: '+998 90 789-01-23', email: 'daniel.m@email.com', occupation: 'Menejer' },
    ],
    medical: { bloodType: 'B-', allergies: [], medications: [], conditions: [], emergencyContact: 'Daniel Miller', emergencyPhone: '+998 90 789-01-23' },
    payments: [
      { id: 'pay-13', month: '2026-04', amount: 0, paidAmount: 0, status: 'pending', dueDate: '2026-04-15' },
    ],
  },
  {
    id: 'ch-008', firstName: 'Alexander', lastName: 'Wilson', dateOfBirth: '2019-08-20', gender: 'male',
    group: 'Yulduzlar', groupId: 'g4', status: 'active', enrollmentDate: '2022-09-01', attendanceRate: 95,
    address: 'Toshkent sh., Shayxontohur tumani, Navoiy ko\'chasi',
    parents: [
      { id: 'p13', firstName: 'Mark', lastName: 'Wilson', relation: 'father', phone: '+998 91 890-12-34', email: 'mark.w@email.com', occupation: 'Uchuvchi' },
      { id: 'p14', firstName: 'Laura', lastName: 'Wilson', relation: 'mother', phone: '+998 91 890-12-35', email: 'laura.w@email.com', occupation: 'Professor' },
    ],
    medical: { bloodType: 'A+', allergies: ['Dengiz mahsulotlari'], medications: [], conditions: [], emergencyContact: 'Laura Wilson', emergencyPhone: '+998 91 890-12-35' },
    payments: [
      { id: 'pay-14', month: '2026-04', amount: 2500000, paidAmount: 2500000, status: 'paid', dueDate: '2026-04-05', paidDate: '2026-04-01' },
      { id: 'pay-15', month: '2026-03', amount: 2500000, paidAmount: 2500000, status: 'paid', dueDate: '2026-03-05', paidDate: '2026-03-01' },
    ],
  },
  {
    id: 'ch-009', firstName: 'Isabella', lastName: 'Anderson', dateOfBirth: '2020-04-17', gender: 'female',
    group: 'Yulduzlar', groupId: 'g4', status: 'active', enrollmentDate: '2023-01-10', attendanceRate: 91,
    address: 'Toshkent sh., Bektemir tumani, 1-kvartal',
    parents: [
      { id: 'p15', firstName: 'Kevin', lastName: 'Anderson', relation: 'father', phone: '+998 93 901-23-45', email: 'kevin.a@email.com', occupation: 'Oshpaz' },
      { id: 'p16', firstName: 'Monica', lastName: 'Anderson', relation: 'mother', phone: '+998 93 901-23-46', email: 'monica.a@email.com', occupation: 'Jurnalist' },
    ],
    medical: { bloodType: 'O+', allergies: [], medications: [], conditions: ['Ekzema'], emergencyContact: 'Monica Anderson', emergencyPhone: '+998 93 901-23-46' },
    payments: [
      { id: 'pay-16', month: '2026-04', amount: 2500000, paidAmount: 1250000, status: 'partial', dueDate: '2026-04-05' },
      { id: 'pay-17', month: '2026-03', amount: 2500000, paidAmount: 2500000, status: 'paid', dueDate: '2026-03-05', paidDate: '2026-03-06' },
    ],
  },
  {
    id: 'ch-010', firstName: 'Ethan', lastName: 'Taylor', dateOfBirth: '2022-06-28', gender: 'male',
    group: 'Quyoshlar', groupId: 'g1', status: 'active', enrollmentDate: '2025-09-01', attendanceRate: 87,
    address: 'Toshkent sh., Uchtepa tumani, 5-kvartal',
    parents: [
      { id: 'p17', firstName: 'Chris', lastName: 'Taylor', relation: 'father', phone: '+998 94 012-34-56', email: 'chris.t@email.com', occupation: 'O\'t o\'chiruvchi' },
      { id: 'p18', firstName: 'Lisa', lastName: 'Taylor', relation: 'mother', phone: '+998 94 012-34-57', email: 'lisa.t@email.com', occupation: 'Veterinar' },
    ],
    medical: { bloodType: 'B+', allergies: ['Tuxum'], medications: [], conditions: [], emergencyContact: 'Lisa Taylor', emergencyPhone: '+998 94 012-34-57' },
    payments: [
      { id: 'pay-18', month: '2026-04', amount: 2500000, paidAmount: 0, status: 'pending', dueDate: '2026-04-05' },
      { id: 'pay-19', month: '2026-03', amount: 2500000, paidAmount: 2500000, status: 'paid', dueDate: '2026-03-05', paidDate: '2026-03-04' },
    ],
  },
  {
    id: 'ch-011', firstName: 'Mia', lastName: 'Thomas', dateOfBirth: '2019-02-11', gender: 'female',
    group: 'Delfinlar', groupId: 'g5', status: 'active', enrollmentDate: '2022-01-15', attendanceRate: 97,
    address: 'Toshkent sh., Yashnobod tumani, Mahalliy ko\'chasi',
    parents: [
      { id: 'p19', firstName: 'Patrick', lastName: 'Thomas', relation: 'father', phone: '+998 95 111-22-33', email: 'patrick.t@email.com', occupation: 'Advokat' },
      { id: 'p20', firstName: 'Diana', lastName: 'Thomas', relation: 'mother', phone: '+998 95 111-22-34', email: 'diana.t@email.com', occupation: 'Stomatolog' },
    ],
    medical: { bloodType: 'AB-', allergies: [], medications: [], conditions: [], emergencyContact: 'Diana Thomas', emergencyPhone: '+998 95 111-22-34' },
    payments: [
      { id: 'pay-20', month: '2026-04', amount: 2500000, paidAmount: 2500000, status: 'paid', dueDate: '2026-04-05', paidDate: '2026-04-02' },
      { id: 'pay-21', month: '2026-03', amount: 2500000, paidAmount: 2500000, status: 'paid', dueDate: '2026-03-05', paidDate: '2026-03-03' },
    ],
  },
  {
    id: 'ch-012', firstName: 'Lucas', lastName: 'Garcia', dateOfBirth: '2020-10-05', gender: 'male',
    group: 'Kamalaklar', groupId: 'g3', status: 'inactive', enrollmentDate: '2023-09-01', attendanceRate: 0,
    notes: 'Oila ko\'chishi sababli vaqtincha ta\'tilga chiqdi',
    address: 'Toshkent sh., Mirobod tumani, Afrosiyob ko\'chasi',
    parents: [
      { id: 'p21', firstName: 'Ricardo', lastName: 'Garcia', relation: 'father', phone: '+998 97 222-33-44', email: 'ricardo.g@email.com', occupation: 'Qurilishchi' },
      { id: 'p22', firstName: 'Elena', lastName: 'Garcia', relation: 'mother', phone: '+998 97 222-33-45', email: 'elena.g@email.com', occupation: 'Ijtimoiy xodim' },
    ],
    medical: { bloodType: 'A+', allergies: ['Lateks'], medications: [], conditions: [], emergencyContact: 'Elena Garcia', emergencyPhone: '+998 97 222-33-45' },
    payments: [
      { id: 'pay-22', month: '2026-04', amount: 0, paidAmount: 0, status: 'pending', dueDate: '2026-04-05' },
    ],
  },
];
