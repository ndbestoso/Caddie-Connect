/**
 * Caddie Connect — Firestore Schema Types
 *
 * Central source of truth for all Firestore document shapes.
 * Every component should import from here instead of defining local interfaces.
 *
 * Collection structure:
 *   users/{uid}            — keyed by Firebase Auth UID
 *   availability/{uid}_{date} — deterministic IDs (userId + date)
 *   assignments/{autoId}   — auto-generated document IDs
 *   announcements/{autoId} — auto-generated document IDs
 *   events/{autoId}        — auto-generated document IDs
 */

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

/** Valid arrival time slots for availability and assignments */
export const TIME_SLOTS = ["7am", "8am", "9am", "10am", "11am", "12pm"] as const;
export type TimeSlot = (typeof TIME_SLOTS)[number];

/** User roles */
export const USER_ROLES = ["caddie", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Assignment types (optional field on assignments) */
export const ASSIGNMENT_TYPES = ["Forecaddie", "Single Bag", "Double Bag"] as const;
export type AssignmentType = (typeof ASSIGNMENT_TYPES)[number];

// ---------------------------------------------------------------------------
// Collection: users/{uid}
// ---------------------------------------------------------------------------

/** Firestore document shape for /users/{uid} */
export interface UserDoc {
  email: string;
  firstName: string;
  lastName: string;
  name: string; // computed: `${firstName} ${lastName}`
  role: UserRole;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/** UserDoc with the Firestore document ID attached */
export interface UserData extends UserDoc {
  id: string; // Firebase Auth UID (also the doc ID)
}

// ---------------------------------------------------------------------------
// Collection: availability/{autoId}
// ---------------------------------------------------------------------------

/** Firestore document shape for /availability/{uid}_{date} */
export interface AvailabilityDoc {
  userId: string;    // Firebase Auth UID of the caddie
  userEmail: string; // denormalized for display without extra reads
  date: string;      // ISO 8601 — the day they're available
  time: string;      // preferred arrival time (current: TimeSlot; legacy data may have "7am-9am")
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/** AvailabilityDoc with the Firestore document ID attached */
export interface AvailabilityData extends AvailabilityDoc {
  id: string;
}

// ---------------------------------------------------------------------------
// Collection: assignments/{autoId}
// ---------------------------------------------------------------------------

/** Firestore document shape for /assignments/{autoId} */
export interface AssignmentDoc {
  caddieId: string;           // Firebase Auth UID of the assigned caddie
  caddieEmail: string;        // denormalized for display
  date: string;               // ISO 8601
  time: TimeSlot;             // assigned arrival time
  notes: string;              // course name / special instructions
  assignment?: AssignmentType; // optional: type of caddie job
  createdBy: string;          // admin's Firebase Auth UID
  createdAt: string;          // ISO 8601
  updatedAt: string;          // ISO 8601
}

/** AssignmentDoc with the Firestore document ID attached */
export interface AssignmentData extends AssignmentDoc {
  id: string;
}

// ---------------------------------------------------------------------------
// Collection: announcements/{autoId}
// ---------------------------------------------------------------------------

/** Firestore document shape for /announcements/{autoId} */
export interface AnnouncementDoc {
  title: string;
  content: string;     // rich HTML from contentEditable editor
  date: string;        // ISO 8601 — display/sort date
  isActive: boolean;   // true = visible to caddies, false = archived
  createdBy: string;   // admin's Firebase Auth UID
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}

/** AnnouncementDoc with the Firestore document ID attached */
export interface AnnouncementData extends AnnouncementDoc {
  id: string;
}

// ---------------------------------------------------------------------------
// Collection: events/{autoId}
// ---------------------------------------------------------------------------

/** Firestore document shape for /events/{autoId} */
export interface EventDoc {
  title: string;
  description: string;  // multiline text, can be empty
  date: string;         // ISO 8601
  startTime: string;    // 24-hour "HH:MM" (e.g. "08:00")
  endTime: string;      // 24-hour "HH:MM" (e.g. "17:00")
  createdBy: string;    // admin's Firebase Auth UID
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}

/** EventDoc with the Firestore document ID attached */
export interface EventData extends EventDoc {
  id: string;
}

// ---------------------------------------------------------------------------
// Firestore collection name constants (prevents typos)
// ---------------------------------------------------------------------------

export const COLLECTIONS = {
  USERS: "users",
  AVAILABILITY: "availability",
  ASSIGNMENTS: "assignments",
  ANNOUNCEMENTS: "announcements",
  EVENTS: "events",
} as const;
