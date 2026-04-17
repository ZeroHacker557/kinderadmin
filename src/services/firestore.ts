import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  AttendanceRecord,
  Child,
  Department,
  Employee,
  FinanceTransaction,
  GroupInfo,
} from '@/types';

function withId<T>(id: string, payload: Record<string, unknown>) {
  return { id, ...(payload as T) };
}

function subscribeCollection<T>(
  collectionName: string,
  onData: (rows: T[]) => void,
  constraints: any[] = [],
) {
  const ref = collection(db, collectionName);
  const q = constraints.length ? query(ref, ...constraints) : query(ref);
  return onSnapshot(q, (snap: any) => {
    const rows = snap.docs.map((d: any) => withId<T>(d.id, d.data()));
    onData(rows);
  });
}

function stripId<T extends { id: string }>(value: T) {
  const { id, ...rest } = value;
  return rest;
}

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((item) => stripUndefinedDeep(item))
      .filter((item) => item !== undefined) as T;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, stripUndefinedDeep(v)]);
    return Object.fromEntries(entries) as T;
  }

  return value;
}

// =========================
// Children
// =========================
export function subscribeChildren(onData: (children: Child[]) => void) {
  return subscribeCollection<Child>('children', onData);
}

export function createChild(payload: Omit<Child, 'id'>) {
  return addDoc(collection(db, 'children'), stripUndefinedDeep(payload));
}

export function updateChild(payload: Child) {
  return updateDoc(
    doc(db, 'children', payload.id),
    stripUndefinedDeep(stripId(payload)),
  );
}

export function deleteChild(id: string) {
  return deleteDoc(doc(db, 'children', id));
}

// =========================
// Employees
// =========================
export function subscribeEmployees(onData: (employees: Employee[]) => void) {
  return subscribeCollection<Employee>('employees', onData);
}

export function createEmployee(payload: Omit<Employee, 'id'>) {
  return addDoc(collection(db, 'employees'), stripUndefinedDeep(payload));
}

export function updateEmployee(payload: Employee) {
  return updateDoc(
    doc(db, 'employees', payload.id),
    stripUndefinedDeep(stripId(payload)),
  );
}

export function deleteEmployee(id: string) {
  return deleteDoc(doc(db, 'employees', id));
}

// =========================
// Groups
// =========================
export function subscribeGroups(onData: (groups: GroupInfo[]) => void) {
  return subscribeCollection<GroupInfo>('groups', onData);
}

export function createGroup(payload: Omit<GroupInfo, 'id'>) {
  return addDoc(collection(db, 'groups'), stripUndefinedDeep(payload));
}

export function updateGroup(payload: GroupInfo) {
  return updateDoc(
    doc(db, 'groups', payload.id),
    stripUndefinedDeep(stripId(payload)),
  );
}

export function deleteGroup(id: string) {
  return deleteDoc(doc(db, 'groups', id));
}

// =========================
// Departments
// =========================
export function subscribeDepartments(onData: (departments: Department[]) => void) {
  return subscribeCollection<Department>('departments', onData);
}

export function createDepartment(payload: Omit<Department, 'id'>) {
  return addDoc(collection(db, 'departments'), stripUndefinedDeep(payload));
}

export function deleteDepartment(id: string) {
  return deleteDoc(doc(db, 'departments', id));
}

// =========================
// Transactions
// =========================
export function subscribeTransactions(onData: (tx: FinanceTransaction[]) => void) {
  return subscribeCollection<FinanceTransaction>('transactions', onData, [
    orderBy('date', 'desc'),
  ]);
}

export function createTransaction(payload: Omit<FinanceTransaction, 'id'>) {
  return addDoc(collection(db, 'transactions'), stripUndefinedDeep(payload));
}

export function updateTransaction(payload: FinanceTransaction) {
  return updateDoc(
    doc(db, 'transactions', payload.id),
    stripUndefinedDeep(stripId(payload)),
  );
}

export function deleteTransaction(id: string) {
  return deleteDoc(doc(db, 'transactions', id));
}

// =========================
// Attendance (records)
// =========================
export function subscribeAttendance(onData: (rows: AttendanceRecord[]) => void) {
  return subscribeCollection<AttendanceRecord>('attendance', onData);
}

export function subscribeAttendanceByDate(
  date: string,
  onData: (rows: AttendanceRecord[]) => void,
) {
  return subscribeCollection<AttendanceRecord>('attendance', onData, [
    where('date', '==', date),
  ]);
}

export function subscribeAttendanceByDateRange(
  startDate: string,
  endDate: string,
  onData: (rows: AttendanceRecord[]) => void,
) {
  return subscribeCollection<AttendanceRecord>('attendance', onData, [
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc'),
  ]);
}

// =========================
// Attendance day locking
// =========================
type AttendanceDayMeta = {
  id: string;
  groupId: string;
  groupName: string;
  date: string; // YYYY-MM-DD
  closed: boolean;
  closedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

function attendanceDayId(groupId: string, date: string) {
  return `${groupId}_${date}`;
}

export function subscribeAttendanceDay(
  groupId: string,
  date: string,
  onData: (meta: AttendanceDayMeta | null) => void,
) {
  const ref = doc(db, 'attendanceDays', attendanceDayId(groupId, date));
  return onSnapshot(ref, (snap: any) => {
    if (!snap.exists()) return onData(null);
    onData(withId<AttendanceDayMeta>(snap.id, snap.data()));
  });
}

export async function setAttendanceDayClosed(params: {
  groupId: string;
  groupName: string;
  date: string; // YYYY-MM-DD
  closed: boolean;
}) {
  const { groupId, groupName, date, closed } = params;
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  const dayRef = doc(db, 'attendanceDays', attendanceDayId(groupId, date));

  const payload: Omit<AttendanceDayMeta, 'id'> = {
    groupId,
    groupName,
    date,
    closed,
    updatedAt: now,
    ...(closed ? { closedAt: now } : { closedAt: undefined }),
    createdAt: now,
  };

  batch.set(dayRef, stripUndefinedDeep(payload), { merge: true });
  await batch.commit();
}

export async function saveAttendanceForDay(params: {
  groupId: string;
  groupName: string;
  date: string; // YYYY-MM-DD
  rows: Array<{
    childId: string;
    childName: string;
    status: AttendanceRecord['status'];
  }>;
}) {
  const { groupId, groupName, date, rows } = params;
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  rows.forEach((row) => {
    const recordId = `${date}_${row.childId}`;
    const ref = doc(db, 'attendance', recordId);
    const payload: Omit<AttendanceRecord, 'id'> = {
      childId: row.childId,
      childName: row.childName,
      groupId,
      group: groupName,
      date,
      status: row.status,
      checkIn: now,
      checkOut: null,
      markedAt: now,
    };
    batch.set(ref, stripUndefinedDeep(payload), { merge: true });
  });

  const dayRef = doc(db, 'attendanceDays', attendanceDayId(groupId, date));
  const dayPayload: Omit<AttendanceDayMeta, 'id'> = {
    groupId,
    groupName,
    date,
    closed: true,
    closedAt: now,
    updatedAt: now,
    createdAt: now,
  };
  batch.set(dayRef, stripUndefinedDeep(dayPayload), { merge: true });

  await batch.commit();
}

// =========================
// User profile (settings)
// =========================
export type UserProfile = {
  firstName: string;
  lastName: string;
  updatedAt?: string;
};

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export function subscribeUserProfile(
  userId: string,
  onData: (profile: UserProfile | null) => void,
) {
  const ref = doc(db, 'users', userId);
  return onSnapshot(ref, (snap: any) => {
    if (!snap.exists()) return onData(null);
    onData(snap.data() as UserProfile);
  });
}

export async function upsertUserProfile(userId: string, profile: UserProfile) {
  const ref = doc(db, 'users', userId);
  const payload: UserProfile = { ...profile, updatedAt: new Date().toISOString() };
  await setDoc(ref, stripUndefinedDeep(payload), { merge: true });
}
