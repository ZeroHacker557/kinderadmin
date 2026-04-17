import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { app } from '@/lib/firebase';
import type { User, AuthState, LoginCredentials } from '@/types';
import { subscribeUserProfile } from '@/services/firestore';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: { name: string; email: string; password: string; rememberMe: boolean }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = getAuth(app);
  const [state, setState] = useState<AuthState>({ user: null, isAuthenticated: false, isLoading: true });

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Clear previous profile subscription (if any)
      unsubProfile?.();
      unsubProfile = null;

      if (!firebaseUser) {
        setState({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email ?? '',
        name: firebaseUser.displayName ?? 'Admin',
        role: 'admin',
      };
      setState({ user, isAuthenticated: true, isLoading: false });

      // Keep name synced with Firestore profile (settings)
      unsubProfile = subscribeUserProfile(firebaseUser.uid, (profile) => {
        if (!profile) return;
        const firstName = (profile.firstName || '').trim() || 'Admin';
        const lastName = (profile.lastName || '').trim();
        const fullName = `${firstName}${lastName ? ` ${lastName}` : ''}`.trim();
        setState((prev) => {
          if (!prev.user) return prev;
          if (prev.user.name === fullName) return prev;
          return { ...prev, user: { ...prev.user, name: fullName } };
        });
      });
    });
    return () => {
      unsubProfile?.();
      unsubAuth();
    };
  }, [auth]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await setPersistence(auth, credentials.rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error instanceof Error ? error : new Error("Login xatoligi yuz berdi");
    }
  }, [auth]);

  const register = useCallback(async (payload: { name: string; email: string; password: string; rememberMe: boolean }) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await setPersistence(auth, payload.rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const userCredential = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
      if (payload.name.trim()) {
        await updateProfile(userCredential.user, { displayName: payload.name.trim() });
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error instanceof Error ? error : new Error("Ro'yxatdan o'tishda xatolik");
    }
  }, [auth]);

  const loginWithGoogle = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error instanceof Error ? error : new Error('Google login xatoligi');
    }
  }, [auth]);

  const logout = useCallback(() => {
    return signOut(auth);
  }, [auth]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth AuthProvider ichida ishlatilishi kerak');
  }
  return context;
}
