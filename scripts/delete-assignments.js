#!/usr/bin/env node

// Delete all assignments from Firestore
// Usage: node scripts/delete-assignments.js <admin-email> <admin-password>

require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function deleteAllAssignments() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: node scripts/delete-assignments.js <admin-email> <admin-password>');
    process.exit(1);
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log('✓ Signed in as admin\n');

    const snapshot = await getDocs(collection(db, 'assignments'));
    console.log(`Found ${snapshot.size} assignments to delete...\n`);

    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, 'assignments', docSnap.id));
    }

    console.log(`✓ Deleted ${snapshot.size} assignments`);
  } catch (error) {
    console.error('Error:', error.message);
  }

  process.exit(0);
}

deleteAllAssignments();
