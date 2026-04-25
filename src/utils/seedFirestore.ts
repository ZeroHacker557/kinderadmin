import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { childrenData } from '@/data/seeds/childrenData';
import { employeesData } from '@/data/seeds/employeesData';
import { transactionsData } from '@/data/seeds/financesData';
import { groupsDetailData } from '@/data/seeds/groupsData';

export async function seedFirestore() {
  const batch = writeBatch(db);

  // Seed Children
  childrenData.forEach(child => {
    const ref = doc(collection(db, 'children'));
    batch.set(ref, { ...child, id: undefined });
  });

  // Seed Employees
  employeesData.forEach(emp => {
    const ref = doc(collection(db, 'employees'));
    batch.set(ref, { ...emp, id: undefined });
  });

  // Seed Finances
  transactionsData.forEach(tx => {
    const ref = doc(collection(db, 'finances'));
    batch.set(ref, { ...tx, id: undefined });
  });

  // Seed Groups
  groupsDetailData.forEach(group => {
    const ref = doc(collection(db, 'groups'));
    batch.set(ref, { ...group, id: undefined });
  });

  try {
    await batch.commit();
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}
