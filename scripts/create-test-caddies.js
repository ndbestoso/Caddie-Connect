#!/usr/bin/env node

// Script to create test caddie accounts with random availability
// Usage: node scripts/create-test-caddies.js

require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, collection, addDoc } = require('firebase/firestore');

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
  { firstName: 'John', lastName: 'Smith', email: 'john.smith@test.com' },
  { firstName: 'Mike', lastName: 'Johnson', email: 'mike.johnson@test.com' },
  { firstName: 'Sarah', lastName: 'Williams', email: 'sarah.williams@test.com' },
  { firstName: 'David', lastName: 'Brown', email: 'david.brown@test.com' },
  { firstName: 'Emily', lastName: 'Davis', email: 'emily.davis@test.com' },
];

const timeSlots = ['7am-9am', '9am-12pm', '12pm-3pm', '3pm-6pm'];

function getWeekDates() {
  const dates = [];
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

function getRandomTimeSlots() {
  const numSlots = Math.floor(Math.random() * 3) + 1; // 1-3 slots
  const shuffled = [...timeSlots].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, numSlots);
}

async function createTestCaddies() {
  const weekDates = getWeekDates();
  console.log('Creating test caddies for week:', weekDates[0], 'to', weekDates[6]);
  console.log('');

  for (const caddie of testCaddies) {
    try {
      console.log(`Creating caddie: ${caddie.firstName} ${caddie.lastName}...`);

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        caddie.email,
        'TestPass123!'
      );
      const user = userCredential.user;
      console.log(`  ✓ Account created: ${user.uid}`);

      // Create user document
      await setDoc(doc(db, 'users', user.uid), {
        email: caddie.email,
        firstName: caddie.firstName,
        lastName: caddie.lastName,
        role: 'caddie',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log('  ✓ User profile created');

      // Create random availability for 3-5 days this week
      const numDays = Math.floor(Math.random() * 3) + 3; // 3-5 days
      const shuffledDates = [...weekDates].sort(() => Math.random() - 0.5);
      const selectedDates = shuffledDates.slice(0, numDays);

      for (const date of selectedDates) {
        const slots = getRandomTimeSlots();
        for (const time of slots) {
          await addDoc(collection(db, 'availability'), {
            userId: user.uid,
            userEmail: caddie.email,
            date: date,
            time: time,
            createdAt: new Date().toISOString(),
          });
        }
      }
      console.log(`  ✓ Availability added for ${selectedDates.length} days`);
      console.log('');

    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`  ⚠ Account already exists for ${caddie.email}, skipping...`);
        console.log('');
      } else {
        console.error(`  ✗ Error: ${error.message}`);
        console.log('');
      }
    }
  }

  console.log('Done! Test caddies created with random availability.');
  console.log('');
  console.log('Test accounts (password: TestPass123!):');
  testCaddies.forEach(c => console.log(`  - ${c.email}`));

  process.exit(0);
}

createTestCaddies();
