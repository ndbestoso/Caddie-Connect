"use client";

import * as React from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { doc, setDoc, onSnapshot, getDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: 'caddie' | 'admin' | null;
  userName: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  roleLoading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateEmail: (newEmail: string, currentPassword: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [userRole, setUserRole] = React.useState<'caddie' | 'admin' | null>(null);
  const [userName, setUserName] = React.useState<string | null>(null);
  const [userFirstName, setUserFirstName] = React.useState<string | null>(null);
  const [userLastName, setUserLastName] = React.useState<string | null>(null);
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
      setUserFirstName(null);
      setUserLastName(null);
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
          setUserFirstName(data.firstName || null);
          setUserLastName(data.lastName || null);
        } else {
          await setDoc(userDocRef, {
            email: user.email,
            name: user.displayName || '',
            firstName: '',
            lastName: '',
            role: 'caddie',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          setUserRole('caddie');
          setUserName(user.displayName || null);
          setUserFirstName(null);
          setUserLastName(null);
        }
        setRoleLoading(false);
      },
      (error) => {
        console.error("Error fetching user role:", error);
        setUserRole('caddie');
        setUserName(null);
        setUserFirstName(null);
        setUserLastName(null);
        setRoleLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email: email,
      name: `${firstName} ${lastName}`,
      firstName: firstName,
      lastName: lastName,
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

  const updateEmail = async (newEmail: string, currentPassword: string) => {
    if (!user || !user.email) throw new Error("No user logged in");

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await firebaseUpdateEmail(user, newEmail);

      // Batch-update denormalized email across all collections
      const batch = writeBatch(db);

      // Update users doc
      batch.update(doc(db, "users", user.uid), {
        email: newEmail,
        updatedAt: new Date().toISOString(),
      });

      // Sync userEmail in availability docs
      const availSnap = await getDocs(
        query(collection(db, "availability"), where("userId", "==", user.uid))
      );
      availSnap.docs.forEach((d) => {
        batch.update(d.ref, { userEmail: newEmail });
      });

      // Sync caddieEmail in assignment docs
      const assignSnap = await getDocs(
        query(collection(db, "assignments"), where("caddieId", "==", user.uid))
      );
      assignSnap.docs.forEach((d) => {
        batch.update(d.ref, { caddieEmail: newEmail });
      });

      await batch.commit();
    } catch (error: any) {
      const errorCode = error?.code;
      switch (errorCode) {
        case "auth/wrong-password":
          throw new Error("Current password is incorrect");
        case "auth/invalid-credential":
          throw new Error("Current password is incorrect");
        case "auth/email-already-in-use":
          throw new Error("This email is already in use");
        case "auth/invalid-email":
          throw new Error("Invalid email address");
        default:
          throw error;
      }
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!user || !user.email) throw new Error("No user logged in");

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await firebaseUpdatePassword(user, newPassword);
    } catch (error: any) {
      const errorCode = error?.code;
      switch (errorCode) {
        case "auth/wrong-password":
          throw new Error("Current password is incorrect");
        case "auth/invalid-credential":
          throw new Error("Current password is incorrect");
        case "auth/weak-password":
          throw new Error("New password is too weak");
        default:
          throw error;
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, userRole, userName, userFirstName, userLastName, roleLoading, signUp, signIn, signOut, sendPasswordReset, updateEmail, updatePassword }}>
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
