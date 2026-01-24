#!/usr/bin/env node

// Script to create an admin user in Firebase
// Usage: node scripts/create-admin.js <email> <password>

require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

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

async function createAdminUser(email, password) {
  try {
    console.log('Creating admin user...');

    // Create the user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('✓ User created:', user.uid);

    // Set user role to admin in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: email,
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log('✓ User role set to admin');
    console.log('\nAdmin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('\nYou can now sign in at http://localhost:9002/admin');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }
}

// Get email and password from command line arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/create-admin.js <email> <password>');
  console.error('Example: node scripts/create-admin.js admin@example.com SecurePass123!');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('Error: Invalid email format');
  process.exit(1);
}

// Validate password length (Firebase requires at least 6 characters)
if (password.length < 6) {
  console.error('Error: Password must be at least 6 characters long');
  process.exit(1);
}

createAdminUser(email, password);
