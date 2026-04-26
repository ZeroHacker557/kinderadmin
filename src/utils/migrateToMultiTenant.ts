/**
 * migrateToMultiTenant.ts
 * 
 * One-time migration script to move existing root-level Firestore data
 * into the tenant-scoped path: /kindergartens/{kindergartenId}/...
 * 
 * Run from the Settings page (Danger Zone) or browser console.
 * Idempotent: refuses to run if already completed.
 */
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const DEFAULT_KG_ID = 'kg_default';
const COLLECTIONS_TO_MIGRATE = ['children', 'employees', 'transactions', 'attendance', 'groups'];
const BATCH_SIZE = 400; // Firestore limit is 500

export async function migrateToMultiTenant(
  kindergartenId: string = DEFAULT_KG_ID,
  kindergartenName: string = 'Default Kindergarten'
): Promise<{ success: boolean; message: string; counts: Record<string, number> }> {
  // Check if migration already ran
  const statusRef = doc(db, 'migration', 'status');
  const statusDoc = await getDoc(statusRef);
  if (statusDoc.exists() && statusDoc.data()?.completed) {
    return {
      success: false,
      message: 'Migration already completed. Refusing to run again.',
      counts: {},
    };
  }

  // Ensure kindergarten document exists
  const kgRef = doc(db, 'kindergartens', kindergartenId);
  const kgDoc = await getDoc(kgRef);
  if (!kgDoc.exists()) {
    await setDoc(kgRef, {
      name: kindergartenName,
      address: '',
      phone: '',
      email: '',
      createdAt: new Date().toISOString(),
      plan: 'free',
      maxChildren: 100,
      isActive: true,
    });
  }

  const counts: Record<string, number> = {};

  for (const collName of COLLECTIONS_TO_MIGRATE) {
    const sourceRef = collection(db, collName);
    const snapshot = await getDocs(sourceRef);

    if (snapshot.empty) {
      counts[collName] = 0;
      continue;
    }

    const docs = snapshot.docs;
    counts[collName] = docs.length;

    // Process in batches
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + BATCH_SIZE);

      for (const docSnap of chunk) {
        const targetRef = doc(db, 'kindergartens', kindergartenId, collName, docSnap.id);
        batch.set(targetRef, docSnap.data());
      }

      await batch.commit();
    }

    console.log(`[Migration] ${collName}: ${docs.length} documents copied`);
  }

  // Update all users without kindergartenId to use the default
  const usersSnap = await getDocs(collection(db, 'users'));
  let usersUpdated = 0;
  for (let i = 0; i < usersSnap.docs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = usersSnap.docs.slice(i, i + BATCH_SIZE);

    for (const userDoc of chunk) {
      const data = userDoc.data();
      if (!data.kindergartenId) {
        batch.update(doc(db, 'users', userDoc.id), { kindergartenId });
        usersUpdated++;
      }
    }

    await batch.commit();
  }
  counts['users_updated'] = usersUpdated;

  // Mark migration as completed
  await setDoc(statusRef, {
    completed: true,
    completedAt: new Date().toISOString(),
    kindergartenId,
    counts,
  });

  const totalDocs = Object.values(counts).reduce((sum, c) => sum + c, 0);
  return {
    success: true,
    message: `Migration completed! ${totalDocs} documents processed across ${COLLECTIONS_TO_MIGRATE.length} collections.`,
    counts,
  };
}
