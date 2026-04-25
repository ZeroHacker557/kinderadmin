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
} from '@/types';

// =========================
// Children Service
// =========================
export const childrenService = {
  getAll: (onData: (data: Child[]) => void, groupId?: string) => {
    let q = collection(db, 'children');
    if (groupId) {
      q = query(q, where('groupId', '==', groupId)) as any;
    }
    return onSnapshot(q, (snap: any) => {
      onData(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Child)));
    });
  },
  getById: async (id: string): Promise<Child | null> => {
    const d: any = await getDoc(doc(db, 'children', id));
    return d.exists() ? ({ id: d.id, ...d.data() } as Child) : null;
  },
  create: async (data: Omit<Child, 'id' | 'createdAt'>) => {
    const docRef = await addDoc(collection(db, 'children'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...data };
  },
  update: async (id: string, data: Partial<Child>) => {
    await updateDoc(doc(db, 'children', id), data);
  },
  delete: async (id: string) => {
    await deleteDoc(doc(db, 'children', id));
  },
  search: async (searchQuery: string): Promise<Child[]> => {
    const snap: any = await getDocs(collection(db, 'children'));
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
  getAll: (onData: (data: Employee[]) => void) => {
    return onSnapshot(collection(db, 'employees'), (snap: any) => {
      onData(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Employee)));
    });
  },
  getById: async (id: string): Promise<Employee | null> => {
    const d: any = await getDoc(doc(db, 'employees', id));
    return d.exists() ? ({ id: d.id, ...d.data() } as Employee) : null;
  },
  create: async (data: Omit<Employee, 'id' | 'createdAt'>) => {
    const docRef = await addDoc(collection(db, 'employees'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...data };
  },
  update: async (id: string, data: Partial<Employee>) => {
    await updateDoc(doc(db, 'employees', id), data);
  },
  delete: async (id: string) => {
    await deleteDoc(doc(db, 'employees', id));
  }
};

// =========================
// Finances Service
// =========================
export const financesService = {
  getAll: (onData: (data: FinanceTransaction[]) => void, targetMonth?: string, targetYear?: number) => {
    const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
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
  getMonthlyStats: async (year: number) => {
    const snap: any = await getDocs(collection(db, 'transactions'));
    const all = snap.docs.map((d: any) => d.data() as FinanceTransaction);
    const filtered = all.filter((t: any) => t.date.startsWith(`${year}-`));
    // Calculate stats... returning empty array for placeholder
    return filtered;
  },
  create: async (data: Omit<FinanceTransaction, 'id' | 'createdAt'>) => {
    const docRef = await addDoc(collection(db, 'transactions'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...data };
  },
  update: async (id: string, data: Partial<FinanceTransaction>) => {
    await updateDoc(doc(db, 'transactions', id), data);
  },
  delete: async (id: string) => {
    await deleteDoc(doc(db, 'transactions', id));
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
  getByDate: (date: string, onData: (data: AttendanceRecord[]) => void) => {
    const q = query(collection(db, 'attendance'), where('date', '==', date));
    return onSnapshot(q, (snap: any) => {
      onData(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as AttendanceRecord)));
    });
  },
  getByDateRange: (startDate: string, endDate: string, onData: (data: AttendanceRecord[]) => void) => {
    const q = query(collection(db, 'attendance'), 
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    return onSnapshot(q, (snap: any) => {
      onData(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as AttendanceRecord)));
    });
  },
  getByChild: async (childId: string, startDate: string, endDate: string) => {
    const q = query(collection(db, 'attendance'), 
      where('childId', '==', childId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    const snap: any = await getDocs(q);
    return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
  },
  mark: async (childId: string, date: string, status: 'present' | 'absent' | 'late') => {
    await addDoc(collection(db, 'attendance'), {
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
  getAll: (onData: (data: GroupInfo[]) => void) => {
    return onSnapshot(collection(db, 'groups'), (snap: any) => {
      onData(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as GroupInfo)));
    });
  },
  create: async (data: Omit<GroupInfo, 'id' | 'createdAt'>) => {
    const docRef = await addDoc(collection(db, 'groups'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...data };
  },
  update: async (id: string, data: Partial<GroupInfo>) => {
    await updateDoc(doc(db, 'groups', id), data);
  },
  delete: async (id: string) => {
    await deleteDoc(doc(db, 'groups', id));
  }
};

export const subscribeChildren = childrenService.getAll;
export const subscribeEmployees = employeesService.getAll;
export const subscribeGroups = groupsService.getAll;
export const subscribeTransactions = financesService.getAll;
export const subscribeAttendance = attendanceService.getByDate;
export const subscribeAttendanceByDate = attendanceService.getByDate;
export const subscribeAttendanceByDateRange = attendanceService.getByDateRange;
export const saveAttendanceForDay = async (_data: any) => {};
export const setAttendanceDayClosed = async (_data: any) => {};
export const subscribeAttendanceDay = (_groupId: string, _date: string, cb: any) => { cb(null); return () => {}; };

export const createGroup = groupsService.create;
export const updateGroup = (data: GroupInfo) => groupsService.update(data.id, data);
export const deleteGroup = groupsService.delete;

export const updateEmployee = (data: Employee) => employeesService.update(data.id, data);
export const createEmployee = employeesService.create;
export const deleteEmployee = employeesService.delete;

export const updateChild = (data: Child) => childrenService.update(data.id, data);
export const createChild = childrenService.create;
export const deleteChild = childrenService.delete;

export const createTransaction = financesService.create;
export const deleteTransaction = financesService.delete;

// Dummy departments
export const subscribeDepartments = (onData: any) => { onData([]); return () => {}; };
export const createDepartment = async (_data?: any) => { return ''; };
export const deleteDepartment = async (_id?: string) => {};

export const getUserProfile = async (uid: string) => {
  const d = await getDoc(doc(db, 'users', uid));
  return d.exists() ? d.data() : null;
};
export const upsertUserProfile = async (uid: string, data: any) => {
  await setDoc(doc(db, 'users', uid), data, { merge: true });
};
