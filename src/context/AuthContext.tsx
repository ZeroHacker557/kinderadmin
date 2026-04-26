import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';
import type { AppUser, UserRole, LoginCredentials, AuthState, Kindergarten } from '@/types';
import { kindergartenService } from '@/services/firestore';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: { firstName: string; lastName: string; kindergartenName: string; email: string; password: string; rememberMe: boolean }) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (actionOrRole: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = getAuth(app);
  const [user, setUser] = useState<AppUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [kindergartenId, setKindergartenId] = useState<string | null>(null);
  const [kindergarten, setKindergarten] = useState<Kindergarten | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setUserRole(null);
        setKindergartenId(null);
        setKindergarten(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        let role: UserRole = 'admin'; // default role for new users is admin of their own kg
        let kgId: string;
        let appUser: AppUser;

        if (userDoc.exists()) {
          const userData = userDoc.data();
          role = (userData.role as UserRole) || 'admin';
          // If for some reason they don't have a kindergartenId, give them a unique one
          kgId = userData.kindergartenId || `kg_${firebaseUser.uid}`;
          appUser = {
            uid: firebaseUser.uid,
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: userData.displayName || firebaseUser.displayName || 'Admin',
            name: userData.displayName || firebaseUser.displayName || 'Admin',
            role,
            kindergartenId: kgId,
            photoURL: userData.photoURL || firebaseUser.photoURL || undefined,
            createdAt: userData.createdAt
          };
          
          // If they didn't have one previously, save it to their user doc
          if (!userData.kindergartenId) {
            await setDoc(userDocRef, { kindergartenId: kgId }, { merge: true });
          }
        } else {
          // BRAND NEW USER - Give them their own unique kindergarten!
          kgId = `kg_${firebaseUser.uid}`;
          
          appUser = {
            uid: firebaseUser.uid,
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Admin',
            name: firebaseUser.displayName || 'Admin',
            role,
            kindergartenId: kgId,
            photoURL: firebaseUser.photoURL || undefined
          };

          // Save the new user document
          await setDoc(userDocRef, {
            email: appUser.email,
            displayName: appUser.displayName,
            role: appUser.role,
            kindergartenId: kgId,
            photoURL: appUser.photoURL,
            createdAt: new Date()
          });

          // Create their new private kindergarten document
          await setDoc(doc(db, 'kindergartens', kgId), {
            name: `${appUser.displayName} bog'chasi`,
            plan: 'free',
            maxChildren: 100,
            isActive: true,
            createdAt: new Date().toISOString()
          });
        }

        // Load kindergarten details
        let kgData: Kindergarten | null = null;
        try {
          kgData = await kindergartenService.getById(kgId);
        } catch (err) {
          console.warn('Could not load kindergarten data:', err);
        }

        setUser(appUser);
        setUserRole(role);
        setKindergartenId(kgId);
        setKindergarten(kgData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUser(null);
        setUserRole(null);
        setKindergartenId(null);
        setKindergarten(null);
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

  const register = useCallback(async (payload: { firstName: string; lastName: string; kindergartenName: string; email: string; password: string; rememberMe: boolean }) => {
    setIsLoading(true);
    try {
      await setPersistence(auth, payload.rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const userCredential = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
      
      const fullName = `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim();
      if (fullName) {
        await updateProfile(userCredential.user, { displayName: fullName });
      }
      
      const uid = userCredential.user.uid;
      const kgId = `kg_${uid}`;

      // Create user doc with unique kindergartenId
      await setDoc(doc(db, 'users', uid), {
        email: payload.email,
        displayName: fullName,
        role: 'admin', // The creator is the admin of their own kindergarten
        kindergartenId: kgId,
        createdAt: new Date()
      });

      // Create their unique kindergarten doc
      await setDoc(doc(db, 'kindergartens', kgId), {
        name: payload.kindergartenName.trim() || `${fullName} bog'chasi`,
        plan: 'free',
        maxChildren: 100,
        isActive: true,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      setIsLoading(false);
      throw error instanceof Error ? error : new Error("Registration failed");
    }
  }, [auth]);


  const logout = useCallback(() => {
    return firebaseSignOut(auth);
  }, [auth]);

  const hasPermission = (actionOrRole: string): boolean => {
    if (!userRole) return false;
    if (userRole === 'superadmin') return true;
    if (userRole === 'admin') return true;
    
    if (actionOrRole === userRole) return true;
    
    const permissions: Record<UserRole, string[]> = {
      superadmin: ['*'],
      admin: ['*'],
      teacher: ['view_children', 'edit_children', 'mark_attendance'],
      accountant: ['view_finances', 'edit_finances'],
      secretary: ['view_children', 'view_employees', 'view_parents']
    };

    return permissions[userRole]?.includes(actionOrRole) || false;
  };

  return (
    <AuthContext.Provider value={{ user, userRole, kindergartenId, kindergarten, isAuthenticated, isLoading, login, register, logout, hasPermission }}>
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
