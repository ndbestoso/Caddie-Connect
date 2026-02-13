#!/usr/bin/env node

// Script to add test caddie availability with correct time options
// Usage: node scripts/update-test-availability.js [admin-email] [admin-password]
// If admin credentials provided, old records will be deleted first

require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, query, where, getDocs, deleteDoc, addDoc, doc } = require('firebase/firestore');

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

const testCaddies = [
  { email: 'john.smith@test.com', password: 'TestPass123!' },
  { email: 'mike.johnson@test.com', password: 'TestPass123!' },
  { email: 'sarah.williams@test.com', password: 'TestPass123!' },
  { email: 'david.brown@test.com', password: 'TestPass123!' },
  { email: 'emily.davis@test.com', password: 'TestPass123!' },
];

// Correct time options from the app
const TIME_OPTIONS = ['7am', '8am', '9am', '10am', '11am', '12pm'];

function getWeekDates() {
  const dates = [];
  const today = new Date();
  const dayOfWeek = today.getDay();
  // Start from Sunday
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);

  for (let i = 0; i < 8; i++) {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

function getRandomTime() {
  return TIME_OPTIONS[Math.floor(Math.random() * TIME_OPTIONS.length)];
}

async function updateTestAvailability() {
  const adminEmail = process.argv[2];
  const adminPassword = process.argv[3];

  const weekDates = getWeekDates();
  console.log('Adding availability for week:', weekDates[0], 'to', weekDates[7]);
  console.log('');

  if (adminEmail && adminPassword) {
    try {
      console.log('Signing in as admin to delete old records...');
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      console.log('✓ Signed in as admin\n');

      for (const caddie of testCaddies) {
        const availQuery = query(
          collection(db, 'availability'),
          where('userEmail', '==', caddie.email)
        );
        const availSnapshot = await getDocs(availQuery);
        for (const docSnap of availSnapshot.docs) {
          await deleteDoc(doc(db, 'availability', docSnap.id));
        }
        console.log(`✓ Deleted ${availSnapshot.size} old records for ${caddie.email}`);
      }
      console.log('');
    } catch (error) {
      console.error('Admin sign-in failed:', error.message);
      process.exit(1);
    }
  }

  // Sign in as each caddie and add fresh availability
  for (const caddie of testCaddies) {
    try {
      console.log(`Processing ${caddie.email}...`);

      // Sign in as this caddie
      const userCredential = await signInWithEmailAndPassword(auth, caddie.email, caddie.password);
      const user = userCredential.user;

      // Create availability for each day of the week with exactly one time
      const addedEntries = [];
      for (const dateStr of weekDates) {
        const time = getRandomTime();
        const date = new Date(dateStr + 'T12:00:00');

        await addDoc(collection(db, 'availability'), {
          userId: user.uid,
          userEmail: caddie.email,
          date: date.toISOString(),
          time: time,
          createdAt: new Date().toISOString(),
        });
        addedEntries.push(`${dateStr}: ${time}`);
      }
      console.log(`  ✓ Added ${addedEntries.length} days (one time each):`);
      addedEntries.forEach(e => console.log(`    ${e}`));

    } catch (error) {
      console.error(`  ✗ Error: ${error.message}`);
    }
  }

  console.log('\nDone! Availability added with correct time options.');
  console.log('Time options:', TIME_OPTIONS.join(', '));

  process.exit(0);
}

updateTestAvailability();
