import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  Child,
  Employee,
  FinanceTransaction,
  AttendanceRecord,
  GroupInfo,
  Kindergarten,
} from '@/types';

// =========================
// Tenant-aware path helpers
// =========================

/** Returns a Firestore CollectionReference scoped to a kindergarten */
export function kgCollection(kindergartenId: string, collectionName: string) {
  return collection(db, 'kindergartens', kindergartenId, collectionName);
}

/** Returns a Firestore DocumentReference scoped to a kindergarten */
export function kgDoc(kindergartenId: string, collectionName: string, docId: string) {
  return doc(db, 'kindergartens', kindergartenId, collectionName, docId);
}

// =========================
// Children Service
// =========================
export const childrenService = {
  getAll: (kindergartenId: string, onData: (data: Child[]) => void, groupId?: string) => {
    let q: any = kgCollection(kindergartenId, 'children');
    if (groupId) {
      q = query(q, where('groupId', '==', groupId));
    }
    return onSnapshot(q, (snap: any) => {
      onData(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Child)));
    });
  },
  getById: async (kindergartenId: string, id: string): Promise<Child | null> => {
    const d: any = await getDoc(kgDoc(kindergartenId, 'children', id));
    return d.exists() ? ({ id: d.id, ...d.data() } as Child) : null;
  },
  create: async (kindergartenId: string, data: Omit<Child, 'id' | 'createdAt'>) => {
    const docRef = await addDoc(kgCollection(kindergartenId, 'children'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...data };
  },
  update: async (kindergartenId: string, id: string, data: Partial<Child>) => {
    await updateDoc(kgDoc(kindergartenId, 'children', id), data);
  },
  delete: async (kindergartenId: string, id: string) => {
    await deleteDoc(kgDoc(kindergartenId, 'children', id));
  },
  search: async (kindergartenId: string, searchQuery: string): Promise<Child[]> => {
    const snap: any = await getDocs(kgCollection(kindergartenId, 'children'));
    const all = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Child));
    const lowerQ = searchQuery.toLowerCase();
    return all.filter((c: any) => 
      c.firstName.toLowerCase().includes(lowerQ) || 
      c.lastName.toLowerCase().includes(lowerQ)
    );
  }
};

// =========================
// Employees Service
// =========================
export const employeesService = {
  getAll: (kindergartenId: string, onData: (data: Employee[]) => void) => {
    return onSnapshot(kgCollection(kindergartenId, 'employees'), (snap: any) => {
      onData(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Employee)));
    });
  },
  getById: async (kindergartenId: string, id: string): Promise<Employee | null> => {
    const d: any = await getDoc(kgDoc(kindergartenId, 'employees', id));
    return d.exists() ? ({ id: d.id, ...d.data() } as Employee) : null;
  },
  create: async (kindergartenId: string, data: Omit<Employee, 'id' | 'createdAt'>) => {
    const docRef = await addDoc(kgCollection(kindergartenId, 'employees'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...data };
  },
  update: async (kindergartenId: string, id: string, data: Partial<Employee>) => {
    await updateDoc(kgDoc(kindergartenId, 'employees', id), data);
  },
  delete: async (kindergartenId: string, id: string) => {
    await deleteDoc(kgDoc(kindergartenId, 'employees', id));
  }
};

// =========================
// Finances Service
// =========================
export const financesService = {
  getAll: (kindergartenId: string, onData: (data: FinanceTransaction[]) => void, targetMonth?: string, targetYear?: number) => {
    const q = query(kgCollection(kindergartenId, 'transactions'), orderBy('date', 'desc'));
    return onSnapshot(q, (snap: any) => {
      const all = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as FinanceTransaction));
      let filtered = all;
      if (targetMonth && targetYear) {
        // Simple string matching assuming date format is YYYY-MM-DD
        const prefix = `${targetYear}-${targetMonth.padStart(2, '0')}`;
        filtered = all.filter((t: any) => t.date.startsWith(prefix));
      }
      onData(filtered);
    });
  },
  getMonthlyStats: async (kindergartenId: string, year: number) => {
    const snap: any = await getDocs(kgCollection(kindergartenId, 'transactions'));
    const all = snap.docs.map((d: any) => d.data() as FinanceTransaction);
    const filtered = all.filter((t: any) => t.date.startsWith(`${year}-`));
    // Calculate stats... returning empty array for placeholder
    return filtered;
  },
  create: async (kindergartenId: string, data: Omit<FinanceTransaction, 'id' | 'createdAt'>) => {
    const docRef = await addDoc(kgCollection(kindergartenId, 'transactions'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...data };
  },
  update: async (kindergartenId: string, id: string, data: Partial<FinanceTransaction>) => {
    await updateDoc(kgDoc(kindergartenId, 'transactions', id), data);
  },
  delete: async (kindergartenId: string, id: string) => {
    await deleteDoc(kgDoc(kindergartenId, 'transactions', id));
  },
  getTotalIncome: async () => {
    return 0; // Simplified
  },
  getTotalExpense: async () => {
    return 0; // Simplified
  }
};

// =========================
// Attendance Service
// =========================
export const attendanceService = {
  getByDate: (kindergartenId: string, date: string, onData: (data: AttendanceRecord[]) => void) => {
    const q = query(kgCollection(kindergartenId, 'attendance'), where('date', '==', date));
    return onSnapshot(q, (snap: any) => {
      onData(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as AttendanceRecord)));
    });
  },
  getByDateRange: (kindergartenId: string, startDate: string, endDate: string, onData: (data: AttendanceRecord[]) => void) => {
    const q = query(kgCollection(kindergartenId, 'attendance'), 
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    return onSnapshot(q, (snap: any) => {
      onData(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as AttendanceRecord)));
    });
  },
  getByChild: async (kindergartenId: string, childId: string, startDate: string, endDate: string) => {
    const q = query(kgCollection(kindergartenId, 'attendance'), 
      where('childId', '==', childId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    const snap: any = await getDocs(q);
    return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
  },
  mark: async (kindergartenId: string, childId: string, date: string, status: 'present' | 'absent' | 'late') => {
    await addDoc(kgCollection(kindergartenId, 'attendance'), {
      childId,
      date,
      status,
      markedAt: new Date().toISOString()
    });
  },
  getMonthlyReport: async () => {
    return [];
  }
};

// =========================
// Groups Service
// =========================
export const groupsService = {
  getAll: (kindergartenId: string, onData: (data: GroupInfo[]) => void) => {
    return onSnapshot(kgCollection(kindergartenId, 'groups'), (snap: any) => {
      onData(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as GroupInfo)));
    });
  },
  create: async (kindergartenId: string, data: Omit<GroupInfo, 'id' | 'createdAt'>) => {
    const docRef = await addDoc(kgCollection(kindergartenId, 'groups'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...data };
  },
  update: async (kindergartenId: string, id: string, data: Partial<GroupInfo>) => {
    await updateDoc(kgDoc(kindergartenId, 'groups', id), data);
  },
  delete: async (kindergartenId: string, id: string) => {
    await deleteDoc(kgDoc(kindergartenId, 'groups', id));
  }
};

// =========================
// Kindergarten Service
// =========================
export const kindergartenService = {
  getById: async (kindergartenId: string): Promise<Kindergarten | null> => {
    const d = await getDoc(doc(db, 'kindergartens', kindergartenId));
    return d.exists() ? ({ id: d.id, ...d.data() } as Kindergarten) : null;
  },
  update: async (kindergartenId: string, data: Partial<Kindergarten>) => {
    await updateDoc(doc(db, 'kindergartens', kindergartenId), data);
  },
  create: async (data: Omit<Kindergarten, 'id'>) => {
    const docRef = await addDoc(collection(db, 'kindergartens'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  }
};

// =========================
// Convenience aliases (tenant-aware)
// =========================

// Children
export const subscribeChildren = (kgId: string, onData: (data: Child[]) => void, groupId?: string) => childrenService.getAll(kgId, onData, groupId);
export const createChild = (kgId: string, data: Omit<Child, 'id' | 'createdAt'>) => childrenService.create(kgId, data);
export const updateChild = (kgId: string, data: Child) => childrenService.update(kgId, data.id, data);
export const deleteChild = (kgId: string, id: string) => childrenService.delete(kgId, id);

// Employees
export const subscribeEmployees = (kgId: string, onData: (data: Employee[]) => void) => employeesService.getAll(kgId, onData);
export const createEmployee = (kgId: string, data: Omit<Employee, 'id' | 'createdAt'>) => employeesService.create(kgId, data);
export const updateEmployee = (kgId: string, data: Employee) => employeesService.update(kgId, data.id, data);
export const deleteEmployee = (kgId: string, id: string) => employeesService.delete(kgId, id);

// Groups
export const subscribeGroups = (kgId: string, onData: (data: GroupInfo[]) => void) => groupsService.getAll(kgId, onData);
export const createGroup = (kgId: string, data: Omit<GroupInfo, 'id' | 'createdAt'>) => groupsService.create(kgId, data);
export const updateGroup = (kgId: string, data: GroupInfo) => groupsService.update(kgId, data.id, data);
export const deleteGroup = (kgId: string, id: string) => groupsService.delete(kgId, id);

// Finances
export const subscribeTransactions = (kgId: string, onData: (data: FinanceTransaction[]) => void, targetMonth?: string, targetYear?: number) => financesService.getAll(kgId, onData, targetMonth, targetYear);
export const createTransaction = (kgId: string, data: Omit<FinanceTransaction, 'id' | 'createdAt'>) => financesService.create(kgId, data);
export const deleteTransaction = (kgId: string, id: string) => financesService.delete(kgId, id);

// Attendance
export const subscribeAttendance = (kgId: string, date: string, onData: (data: AttendanceRecord[]) => void) => attendanceService.getByDate(kgId, date, onData);
export const subscribeAttendanceByDate = (kgId: string, date: string, onData: (data: AttendanceRecord[]) => void) => attendanceService.getByDate(kgId, date, onData);
export const subscribeAttendanceByDateRange = (kgId: string, startDate: string, endDate: string, onData: (data: AttendanceRecord[]) => void) => attendanceService.getByDateRange(kgId, startDate, endDate, onData);
export const saveAttendanceForDay = async (_kgId: string, _data: any) => {};
export const setAttendanceDayClosed = async (_kgId: string, _data: any) => {};
export const subscribeAttendanceDay = (_kgId: string, _groupId: string, _date: string, cb: any) => { cb(null); return () => {}; };

// Departments (stub)
export const subscribeDepartments = (_kgId: string, onData: any) => { onData([]); return () => {}; };
export const createDepartment = async (_kgId: string, _data?: any) => { return ''; };
export const deleteDepartment = async (_kgId: string, _id?: string) => {};

// =========================
// User Profile (root-level, no tenant scoping)
// =========================
export const getUserProfile = async (uid: string) => {
  const d = await getDoc(doc(db, 'users', uid));
  return d.exists() ? d.data() : null;
};
export const upsertUserProfile = async (uid: string, data: any) => {
  await setDoc(doc(db, 'users', uid), data, { merge: true });
};
