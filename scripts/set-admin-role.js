#!/usr/bin/env node

// Script to set admin role for a user in Firestore using REST API
// Usage: node scripts/set-admin-role.js <user-id> <email>

require('dotenv').config({ path: '.env.local' });

const userId = process.argv[2];
const email = process.argv[3];

if (!userId || !email) {
  console.error('Usage: node scripts/set-admin-role.js <user-id> <email>');
  console.error('Example: node scripts/set-admin-role.js abc123 admin@example.com');
  process.exit(1);
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}`;

const userData = {
  fields: {
    email: { stringValue: email },
    role: { stringValue: 'admin' },
    createdAt: { stringValue: new Date().toISOString() },
    updatedAt: { stringValue: new Date().toISOString() }
  }
};

async function setAdminRole() {
  try {
    console.log('Setting admin role for user:', userId);

    const response = await fetch(`${firestoreUrl}?key=${apiKey}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    console.log('✓ Admin role set successfully!');
    console.log('\nUser Details:');
    console.log('Email:', email);
    console.log('User ID:', userId);
    console.log('Role: admin');
    console.log('\nYou can now sign in at http://localhost:9002/admin');

  } catch (error) {
    console.error('Error setting admin role:', error.message);
    process.exit(1);
  }
}

setAdminRole();
