// src/controllers/enrollmentController.js
// ============================================================
//  UniPortal — Enrollment Controller  (v2 — Full Rewrite)
//
//  Workflow:
//  1. Student submits enrollment request → status = PENDING
//  2. Admin reviews → approves or rejects
//  3. On approval:
//     a. Roll number auto-assigned via atomic Firestore transaction
//     b. User doc updated: enrollmentStatus=APPROVED + dept/program/semester
//     c. Student auto-linked to all active courses for their
//        department + programId + semesterNumber
//  4. On rejection: enrollmentStatus=REJECTED + reason stored
// ============================================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';

// ─── CONSTANTS ────────────────────────────────────────────────
const ENROLLMENT_STATUS = {
  NONE:     'NONE',
  PENDING:  'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

// ─────────────────────────────────────────────────────────────
//  1. STUDENT — Submit Enrollment Request
//     Called from the ChooseProgram page when student clicks
//     "Request Enrollment" (NOT "Enroll Now")
// ─────────────────────────────────────────────────────────────
export async function submitEnrollmentRequest({
  studentId,
  departmentId,
  programId,
  batchYear,    // e.g. "2K23"
  currentYear,  // 1 | 2 | 3 | 4
}) {
  // 1. Guard: student must have enrollmentStatus === NONE
  const userSnap = await getDoc(doc(db, 'users', studentId));
  if (!userSnap.exists()) throw new Error('User not found.');

  const user = userSnap.data();
  if (user.enrollmentStatus !== ENROLLMENT_STATUS.NONE) {
    if (user.enrollmentStatus === ENROLLMENT_STATUS.PENDING) {
      throw new Error('You already have a pending enrollment request.');
    }
    if (user.enrollmentStatus === ENROLLMENT_STATUS.APPROVED) {
      throw new Error('You are already enrolled.');
    }
    // REJECTED — allow re-application
  }

  // 2. Guard: no duplicate pending request
  const existingQuery = query(
    collection(db, 'enrollmentRequests'),
    where('studentId', '==', studentId),
    where('status', '==', ENROLLMENT_STATUS.PENDING)
  );
  const existingSnap = await getDocs(existingQuery);
  if (!existingSnap.empty) {
    throw new Error('A pending enrollment request already exists.');
  }

  // 3. Validate department and program exist
  const [deptSnap, progSnap] = await Promise.all([
    getDoc(doc(db, 'departments', departmentId)),
    getDoc(doc(db, 'programs', programId)),
  ]);
  if (!deptSnap.exists()) throw new Error('Department not found.');
  if (!progSnap.exists()) throw new Error('Program not found.');

  const dept = deptSnap.data();
  const prog = progSnap.data();

  // 4. Create enrollment request document
  const reqRef = await addDoc(collection(db, 'enrollmentRequests'), {
    studentId,
    studentName:    user.displayName,
    studentEmail:   user.email,
    departmentId,
    departmentName: dept.name,
    programId,
    programName:    prog.name,
    batchYear,
    currentYear,
    status:         ENROLLMENT_STATUS.PENDING,
    submittedAt:    serverTimestamp(),
    reviewedAt:     null,
    reviewedBy:     null,
    rejectionReason: null,
  });

  // 5. Update user doc to PENDING (they see a "pending" screen on login)
  await updateDoc(doc(db, 'users', studentId), {
    enrollmentStatus: ENROLLMENT_STATUS.PENDING,
    updatedAt:        serverTimestamp(),
  });

  return reqRef.id;
}

// ─────────────────────────────────────────────────────────────
//  2. ADMIN — Approve Enrollment Request
//     Atomically assigns roll number + updates user doc +
//     links student to all matching active courses
// ─────────────────────────────────────────────────────────────
export async function approveEnrollment({
  requestId,
  adminId,
  currentSemesterId,  // admin selects which active semester to place student in
  semesterNumber,     // 1-8, determines which courses student links to
}) {
  // Load the enrollment request
  const reqRef  = doc(db, 'enrollmentRequests', requestId);
  const reqSnap = await getDoc(reqRef);
  if (!reqSnap.exists())                      throw new Error('Request not found.');
  if (reqSnap.data().status !== 'PENDING')    throw new Error('Request is not pending.');

  const req = reqSnap.data();

  // ── Step 1: Atomically assign a unique roll number ─────────
  // Counter doc: counters/{departmentCode}_{batchYear}
  // Increments atomically, zero race conditions
  const deptSnap = await getDoc(doc(db, 'departments', req.departmentId));
  const deptCode = deptSnap.data().code;  // e.g. "CS", "IT", "SE"
  const counterKey = `${deptCode}_${req.batchYear}`;
  const counterRef = doc(db, 'counters', counterKey);

  let rollNumber;

  await runTransaction(db, async (tx) => {
    const counterSnap = await tx.get(counterRef);
    const nextSerial  = counterSnap.exists() ? counterSnap.data().serial + 1 : 1;
    const serial      = String(nextSerial).padStart(3, '0');
    rollNumber        = `${req.batchYear}/${deptCode}/${serial}`;

    // Write counter
    tx.set(counterRef, { serial: nextSerial, updatedAt: serverTimestamp() });

    // Update user doc — single atomic write with all enrollment fields
    tx.update(doc(db, 'users', req.studentId), {
      enrollmentStatus:  ENROLLMENT_STATUS.APPROVED,
      rollNumber,
      departmentId:      req.departmentId,
      departmentName:    req.departmentName,
      programId:         req.programId,
      programName:       req.programName,
      batchYear:         req.batchYear,
      currentYear:       req.currentYear,
      currentSemesterId,
      semesterNumber,
      updatedAt:         serverTimestamp(),
    });

    // Update enrollment request
    tx.update(reqRef, {
      status:     ENROLLMENT_STATUS.APPROVED,
      rollNumber,
      reviewedAt: serverTimestamp(),
      reviewedBy: adminId,
    });
  });

  // ── Step 2: Link student to all active courses for their cohort ──
  // Query courses matching department + program + semesterNumber
  const coursesQuery = query(
    collection(db, 'courses'),
    where('departmentId',  '==', req.departmentId),
    where('programId',     '==', req.programId),
    where('semesterId',    '==', currentSemesterId),
    where('isActive',      '==', true)
  );
  const coursesSnap = await getDocs(coursesQuery);

  if (!coursesSnap.empty) {
    const batch = writeBatch(db);
    coursesSnap.docs.forEach((courseDoc) => {
      const enrollRef = doc(collection(db, 'courseEnrollments'));
      batch.set(enrollRef, {
        studentId:    req.studentId,
        rollNumber,
        courseId:     courseDoc.id,
        courseName:   courseDoc.data().name,
        departmentId: req.departmentId,
        semesterId:   currentSemesterId,
        enrolledAt:   serverTimestamp(),
        grade:        null,
        isActive:     true,
      });
    });
    await batch.commit();
  }

  // ── Step 3: Send welcome notification ─────────────────────
  await addDoc(collection(db, 'notifications'), {
    title:              'Enrollment Approved',
    body:               `Welcome to ${req.departmentName}! Your roll number is ${rollNumber}. You now have full access to your courses and portal.`,
    type:               'INFO',
    createdBy:          adminId,
    createdByRole:      'admin',
    targetDepartmentId: req.departmentId,
    targetYear:         req.currentYear,
    targetSemesterId:   currentSemesterId,
    isActive:           true,
    createdAt:          serverTimestamp(),
  });

  return { rollNumber };
}

// ─────────────────────────────────────────────────────────────
//  3. ADMIN — Reject Enrollment Request
// ─────────────────────────────────────────────────────────────
export async function rejectEnrollment({
  requestId,
  adminId,
  reason,
}) {
  const reqRef  = doc(db, 'enrollmentRequests', requestId);
  const reqSnap = await getDoc(reqRef);
  if (!reqSnap.exists())                   throw new Error('Request not found.');
  if (reqSnap.data().status !== 'PENDING') throw new Error('Request is not pending.');

  const batch = writeBatch(db);

  batch.update(reqRef, {
    status:          ENROLLMENT_STATUS.REJECTED,
    rejectionReason: reason || 'No reason provided.',
    reviewedAt:      serverTimestamp(),
    reviewedBy:      adminId,
  });

  batch.update(doc(db, 'users', reqSnap.data().studentId), {
    enrollmentStatus: ENROLLMENT_STATUS.REJECTED,
    updatedAt:        serverTimestamp(),
  });

  await batch.commit();
}

// ─────────────────────────────────────────────────────────────
//  4. ADMIN — Fetch All Pending Enrollment Requests
// ─────────────────────────────────────────────────────────────
export async function getPendingEnrollments() {
  const q = query(
    collection(db, 'enrollmentRequests'),
    where('status', '==', ENROLLMENT_STATUS.PENDING),
    orderBy('submittedAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─────────────────────────────────────────────────────────────
//  5. ADMIN — Advance Student to Next Semester
//     Called at end of academic semester by admin
// ─────────────────────────────────────────────────────────────
export async function advanceStudentSemester({
  studentId,
  newSemesterId,
  newSemesterNumber,
  newYear,
  adminId,
}) {
  const userRef  = doc(db, 'users', studentId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists())                       throw new Error('Student not found.');
  if (userSnap.data().enrollmentStatus !== 'APPROVED')
    throw new Error('Student is not an active enrolled student.');

  const user = userSnap.data();

  // Deactivate old course enrollments
  const oldEnrollmentsQuery = query(
    collection(db, 'courseEnrollments'),
    where('studentId', '==', studentId),
    where('isActive',  '==', true)
  );
  const oldSnap = await getDocs(oldEnrollmentsQuery);

  const batch = writeBatch(db);

  oldSnap.docs.forEach((d) => {
    batch.update(d.ref, { isActive: false });
  });

  // Update user's semester
  batch.update(userRef, {
    currentSemesterId: newSemesterId,
    semesterNumber:    newSemesterNumber,
    currentYear:       newYear ?? user.currentYear,
    updatedAt:         serverTimestamp(),
  });

  await batch.commit();

  // Link to new semester's courses
  const coursesQuery = query(
    collection(db, 'courses'),
    where('departmentId', '==', user.departmentId),
    where('programId',    '==', user.programId),
    where('semesterId',   '==', newSemesterId),
    where('isActive',     '==', true)
  );
  const coursesSnap = await getDocs(coursesQuery);

  if (!coursesSnap.empty) {
    const linkBatch = writeBatch(db);
    coursesSnap.docs.forEach((courseDoc) => {
      const enrollRef = doc(collection(db, 'courseEnrollments'));
      linkBatch.set(enrollRef, {
        studentId,
        rollNumber:   user.rollNumber,
        courseId:     courseDoc.id,
        courseName:   courseDoc.data().name,
        departmentId: user.departmentId,
        semesterId:   newSemesterId,
        enrolledAt:   serverTimestamp(),
        grade:        null,
        isActive:     true,
      });
    });
    await linkBatch.commit();
  }
}

// ─────────────────────────────────────────────────────────────
//  6. STUDENT — Get Own Enrollment Request Status
// ─────────────────────────────────────────────────────────────
export async function getMyEnrollmentRequest(studentId) {
  const q = query(
    collection(db, 'enrollmentRequests'),
    where('studentId', '==', studentId),
    orderBy('submittedAt', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}
