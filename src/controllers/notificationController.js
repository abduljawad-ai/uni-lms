// src/controllers/notificationController.js
// ============================================================
//  UniPortal — Notification Controller  (v2 — Full Rewrite)
//
//  Key design:
//  - Notifications are targeted at (departmentId, year, semesterId)
//  - Students query only the notifications that match their profile
//  - A student with (dept=IT, year=2, sem=Fall2025) will see
//    any notification where:
//      targetDepartmentId == 'IT_id'
//      AND (targetYear == null OR targetYear == 2)
//      AND (targetSemesterId == null OR targetSemesterId == 'Fall2025_id')
//  - This is enforced in both Firestore rules AND this controller
// ============================================================

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Notification types
export const NOTIF_TYPE = {
  INFO:   'INFO',    // General announcement
  EXAM:   'EXAM',    // Exam schedule / result notice
  FEE:    'FEE',     // Fee / challan notice
  URGENT: 'URGENT',  // Critical / urgent
  CLASS:  'CLASS',   // Class cancellation, rescheduling
};

// ─────────────────────────────────────────────────────────────
//  1. ADMIN / TEACHER — Create a targeted notification
//
//  targetYear: null = all years in department
//  targetSemesterId: null = all semesters
// ─────────────────────────────────────────────────────────────
export async function createNotification({
  title,
  body,
  type = NOTIF_TYPE.INFO,
  createdBy,
  createdByRole,          // 'admin' | 'teacher'
  targetDepartmentId,     // REQUIRED — must always target a department
  targetYear = null,      // Optional: 1 | 2 | 3 | 4
  targetSemesterId = null, // Optional: specific semester
}) {
  if (!title || !body)            throw new Error('Title and body are required.');
  if (!targetDepartmentId)        throw new Error('targetDepartmentId is required.');
  if (!Object.values(NOTIF_TYPE).includes(type))
    throw new Error(`Invalid notification type: ${type}`);

  const ref = await addDoc(collection(db, 'notifications'), {
    title,
    body,
    type,
    createdBy,
    createdByRole,
    targetDepartmentId,
    targetYear,
    targetSemesterId,
    isActive:  true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

// ─────────────────────────────────────────────────────────────
//  2. STUDENT DASHBOARD — Fetch all notifications for a student
//
//  Called on dashboard mount. Queries Firestore with the
//  student's exact profile. Multiple targeted queries are
//  ORed client-side (Firestore doesn't support OR on different
//  fields — we run 2-3 queries and merge).
//
//  Query strategy:
//    Q1: dept match, targetYear == null, targetSemesterId == null
//        (broadcast to entire department)
//    Q2: dept match, targetYear == student.currentYear,
//        targetSemesterId == null
//        (broadcast to student's year only)
//    Q3: dept match, targetYear == student.currentYear,
//        targetSemesterId == student.currentSemesterId
//        (targeted to exact cohort)
// ─────────────────────────────────────────────────────────────
export async function fetchStudentNotifications(studentProfile) {
  const {
    departmentId,
    currentYear,
    currentSemesterId,
  } = studentProfile;

  if (!departmentId) return []; // Unenrolled student — no notifications

  // Run all 3 targeted queries in parallel
  const [q1Snap, q2Snap, q3Snap] = await Promise.all([
    // Q1: All department notifications (no year/semester filter)
    getDocs(query(
      collection(db, 'notifications'),
      where('targetDepartmentId', '==', departmentId),
      where('targetYear',         '==', null),
      where('targetSemesterId',   '==', null),
      where('isActive',           '==', true),
      orderBy('createdAt', 'desc')
    )),

    // Q2: Department + year (no semester filter)
    getDocs(query(
      collection(db, 'notifications'),
      where('targetDepartmentId', '==', departmentId),
      where('targetYear',         '==', currentYear),
      where('targetSemesterId',   '==', null),
      where('isActive',           '==', true),
      orderBy('createdAt', 'desc')
    )),

    // Q3: Department + year + specific semester (exact cohort)
    getDocs(query(
      collection(db, 'notifications'),
      where('targetDepartmentId', '==', departmentId),
      where('targetYear',         '==', currentYear),
      where('targetSemesterId',   '==', currentSemesterId),
      where('isActive',           '==', true),
      orderBy('createdAt', 'desc')
    )),
  ]);

  // Merge and deduplicate by doc ID
  const seen = new Set();
  const all  = [];

  [q1Snap, q2Snap, q3Snap].forEach((snap) => {
    snap.docs.forEach((d) => {
      if (!seen.has(d.id)) {
        seen.add(d.id);
        all.push({ id: d.id, ...d.data() });
      }
    });
  });

  // Sort merged results by createdAt descending
  all.sort((a, b) => {
    const tA = a.createdAt?.toMillis?.() ?? 0;
    const tB = b.createdAt?.toMillis?.() ?? 0;
    return tB - tA;
  });

  return all;
}

// ─────────────────────────────────────────────────────────────
//  3. ADMIN / TEACHER — Fetch notifications they sent
// ─────────────────────────────────────────────────────────────
export async function fetchMyNotifications(uid, role) {
  const q = role === 'admin'
    ? query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc')
      )
    : query(
        collection(db, 'notifications'),
        where('createdBy', '==', uid),
        orderBy('createdAt', 'desc')
      );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─────────────────────────────────────────────────────────────
//  4. ADMIN — Toggle notification active/inactive
// ─────────────────────────────────────────────────────────────
export async function toggleNotification(notifId, isActive) {
  await updateDoc(doc(db, 'notifications', notifId), {
    isActive,
    updatedAt: serverTimestamp(),
  });
}

// ─────────────────────────────────────────────────────────────
//  5. ADMIN — Delete notification
// ─────────────────────────────────────────────────────────────
export async function deleteNotification(notifId) {
  await deleteDoc(doc(db, 'notifications', notifId));
}
