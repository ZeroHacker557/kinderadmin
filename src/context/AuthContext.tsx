import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';
import type { AppUser, UserRole, LoginCredentials, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: { name: string; email: string; password: string; rememberMe: boolean }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (actionOrRole: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = getAuth(app);
  const [user, setUser] = useState<AppUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setUserRole(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        let role: UserRole = 'admin'; // default role for testing if doc is absent
        let appUser: AppUser;

        if (userDoc.exists()) {
          const userData = userDoc.data();
          role = (userData.role as UserRole) || 'admin';
          appUser = {
            uid: firebaseUser.uid,
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: userData.displayName || firebaseUser.displayName || 'Admin',
            name: userData.displayName || firebaseUser.displayName || 'Admin',
            role,
            photoURL: userData.photoURL || firebaseUser.photoURL || undefined,
            createdAt: userData.createdAt
          };
        } else {
          appUser = {
            uid: firebaseUser.uid,
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Admin',
            name: firebaseUser.displayName || 'Admin',
            role,
            photoURL: firebaseUser.photoURL || undefined
          };
        }

        setUser(appUser);
        setUserRole(role);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUser(null);
        setUserRole(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubAuth();
  }, [auth]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      await setPersistence(auth, credentials.rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    } catch (error) {
      setIsLoading(false);
      throw error instanceof Error ? error : new Error("Login failed");
    }
  }, [auth]);

  const register = useCallback(async (payload: { name: string; email: string; password: string; rememberMe: boolean }) => {
    setIsLoading(true);
    try {
      await setPersistence(auth, payload.rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const userCredential = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
      if (payload.name.trim()) {
        await updateProfile(userCredential.user, { displayName: payload.name.trim() });
      }
      
      // Create user doc
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: payload.email,
        displayName: payload.name.trim(),
        role: 'teacher', // new registrations are teachers by default
        createdAt: new Date()
      });
    } catch (error) {
      setIsLoading(false);
      throw error instanceof Error ? error : new Error("Registration failed");
    }
  }, [auth]);

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      setIsLoading(false);
      throw error instanceof Error ? error : new Error('Google login failed');
    }
  }, [auth]);

  const logout = useCallback(() => {
    return firebaseSignOut(auth);
  }, [auth]);

  const hasPermission = (actionOrRole: string): boolean => {
    if (!userRole) return false;
    if (userRole === 'admin') return true;
    
    if (actionOrRole === userRole) return true;
    
    const permissions: Record<UserRole, string[]> = {
      admin: ['*'],
      teacher: ['view_children', 'edit_children', 'mark_attendance'],
      accountant: ['view_finances', 'edit_finances'],
      secretary: ['view_children', 'view_employees', 'view_parents']
    };

    return permissions[userRole]?.includes(actionOrRole) || false;
  };

  return (
    <AuthContext.Provider value={{ user, userRole, isAuthenticated, isLoading, login, register, loginWithGoogle, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
