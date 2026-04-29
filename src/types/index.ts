// ============================================
// KinderAdmin ERP — Core Type Definitions
// ============================================

export type UserRole = 'superadmin' | 'admin' | 'teacher' | 'accountant' | 'secretary';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  kindergartenId: string;
  photoURL?: string;
  createdAt?: string;
  // Compatibility aliases
  id: string;
  name: string;
}

export interface Kindergarten {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logoURL?: string;
  createdAt: any;
  plan: 'free' | 'pro';
  maxChildren: number;
  isActive: boolean;
}

export interface AuthState {
  user: AppUser | null;
  userRole: UserRole | null;
  kindergartenId: string | null;
  kindergarten: Kindergarten | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

export interface SummaryCard {
  id: string;
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  trend: 'up' | 'down' | 'neutral';
  sparklineData: number[];
  icon: string;
  accentColor: string;
}

export interface Transaction {
  id: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface AttendanceRecord {
  id: string;
  childId?: string;
  childName: string;
  groupId?: string;
  group: string;
  date?: string; // YYYY-MM-DD
  checkIn: string;
  checkOut: string | null;
  status: 'present' | 'absent' | 'late';
  markedAt?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  read: boolean;
}

// ============================================
// Children Management Types
// ============================================

export type ChildStatus = 'active' | 'inactive' | 'graduated' | 'trial';
export type Gender = 'male' | 'female';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type PaymentStatus = 'paid' | 'partial' | 'overdue' | 'pending';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'auto';

export interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  relation: 'mother' | 'father' | 'guardian';
  phone: string;
  email: string;
  occupation?: string;
  address?: string;
  passportSeries?: string;
}

export interface MedicalInfo {
  bloodType?: BloodType;
  allergies: string[];
  medications: string[];
  conditions: string[];
  emergencyContact: string;
  emergencyPhone: string;
  doctorName?: string;
  doctorPhone?: string;
  notes?: string;
}

export interface ChildPayment {
  id: string;
  month: string;
  amount: number;
  paidAmount: number;
  status: PaymentStatus;
  dueDate: string;
  paidDate?: string;
}

export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  photo?: string;
  group: string;
  groupId: string;
  status: ChildStatus;
  enrollmentDate: string;
  parents: Parent[];
  medical: MedicalInfo;
  payments: ChildPayment[];
  attendanceRate: number;
  notes?: string;
  address?: string;
}

export interface ChildFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  group: string;
  groupId: string;
  status: ChildStatus;
  address?: string;
  notes?: string;
  parents: Omit<Parent, 'id'>[];
  medical: MedicalInfo;
}

export interface ChildFilters {
  search: string;
  group: string;
  status: ChildStatus | '';
  gender: Gender | '';
  paymentStatus: PaymentStatus | '';
  ageRange: [number, number] | null;
}

export type SortField = 'name' | 'age' | 'group' | 'enrollment' | 'attendance' | 'payment';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export interface GroupInfo {
  id: string;
  name: string;
  capacity: number;
  currentCount: number;
  teacher: string;
  ageRange: string;
  color: string;
}

// ============================================
// Employee Management Types
// ============================================

export type EmployeeStatus = 'active' | 'on_leave' | 'terminated';

export interface LeaveBalance {
  annual: number;
  used: number;
  sick: number;
  usedSick: number;
}

export interface Department {
  id: string;
  name: string;
  color: string;
  headCount: number;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  departmentId: string;
  status: EmployeeStatus;
  phone: string;
  email: string;
  hireDate: string;
  salary: number;
  lastSalaryPaymentDate?: string;
  lastSalaryPaymentAmount?: number;
  assignedGroup?: string;
  assignedGroupId?: string;
  workSchedule: string;
  education: string;
  experience: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  documents: string[];
  skills: string[];
  notes?: string;
  leaveBalance: LeaveBalance;
  performanceRating: number;
}

export interface EmployeeFilters {
  search: string;
  department: string;
  status: EmployeeStatus | '';
  position: string;
}

export type EmployeeSortField = 'name' | 'department' | 'position' | 'hireDate' | 'salary' | 'rating';

export interface EmployeeSortConfig {
  field: EmployeeSortField;
  direction: SortDirection;
}

// ============================================
// Finance Management Types
// ============================================

export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'cancelled';

export type IncomeCategory =
  | 'tuition'       // Oylik to'lov
  | 'registration'  // Ro'yxatdan o'tish
  | 'extra_classes'  // Qo'shimcha mashg'ulotlar
  | 'events'        // Tadbirlar
  | 'other_income'; // Boshqa daromad

export type ExpenseCategory =
  | 'salary'        // Ish haqi
  | 'rent'          // Ijara
  | 'utilities'     // Kommunal
  | 'food'          // Ovqatlanish
  | 'supplies'      // Jihozlar
  | 'maintenance'   // Ta'mirlash
  | 'marketing'     // Marketing
  | 'taxes'         // Soliqlar
  | 'insurance'     // Sug'urta
  | 'other_expense'; // Boshqa xarajat

export type FinanceCategory = IncomeCategory | ExpenseCategory;

export interface FinanceTransaction {
  id: string;
  type: TransactionType;
  category: FinanceCategory;
  description: string;
  amount: number;
  date: string;
  status: TransactionStatus;
  paidBy?: string;
  childId?: string;
  childName?: string;
  employeeId?: string;
  employeeName?: string;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'auto';
  receiptNumber?: string;
  notes?: string;
}

export interface MonthlyFinanceSummary {
  month: string;
  monthLabel: string;
  income: number;
  expense: number;
  profit: number;
}

export interface CategorySummary {
  category: FinanceCategory;
  label: string;
  amount: number;
  color: string;
  percentage: number;
  count: number;
}

export interface FinanceFilters {
  search: string;
  type: TransactionType | '';
  category: FinanceCategory | '';
  status: TransactionStatus | '';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'quarter';
  paymentMethod: string;
}

export type FinanceSortField = 'date' | 'amount' | 'category' | 'status' | 'description';

export interface FinanceSortConfig {
  field: FinanceSortField;
  direction: SortDirection;
}
