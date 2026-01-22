"use client";

import * as React from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: 'caddie' | 'admin' | null;
  userName: string | null;
  roleLoading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [userRole, setUserRole] = React.useState<'caddie' | 'admin' | null>(null);
  const [userName, setUserName] = React.useState<string | null>(null);
  const [roleLoading, setRoleLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    if (!user) {
      setUserRole(null);
      setUserName(null);
      setRoleLoading(false);
      return;
    }

    setRoleLoading(true);
    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserRole(data.role || 'caddie');
          setUserName(data.name || null);
        } else {
          await setDoc(userDocRef, {
            email: user.email,
            name: user.displayName || '',
            role: 'caddie',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          setUserRole('caddie');
          setUserName(user.displayName || null);
        }
        setRoleLoading(false);
      },
      (error) => {
        console.error("Error fetching user role:", error);
        setUserRole('caddie');
        setUserName(null);
        setRoleLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const signUp = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email: email,
      name: name,
      role: 'caddie',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      // Map Firebase error codes to user-friendly messages
      const errorCode = error?.code;
      switch (errorCode) {
        case "auth/user-not-found":
          throw new Error("No account exists with this email address");
        case "auth/invalid-email":
          throw new Error("Invalid email address");
        case "auth/too-many-requests":
          throw new Error("Too many reset requests. Please try again later");
        default:
          throw error;
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, userRole, userName, roleLoading, signUp, signIn, signOut, sendPasswordReset }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
