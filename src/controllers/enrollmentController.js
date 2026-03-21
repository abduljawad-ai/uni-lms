
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

const ENROLLMENT_STATUS = {
  NONE:     'NONE',
  PENDING:  'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

export async function submitEnrollmentRequest({
  studentId,
  departmentId,
  programId,
  batchYear,    
  currentYear,  
}) {

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

  }

  const existingQuery = query(
    collection(db, 'enrollmentRequests'),
    where('studentId', '==', studentId),
    where('status', '==', ENROLLMENT_STATUS.PENDING)
  );
  const existingSnap = await getDocs(existingQuery);
  if (!existingSnap.empty) {
    throw new Error('A pending enrollment request already exists.');
  }

  const [deptSnap, progSnap] = await Promise.all([
    getDoc(doc(db, 'departments', departmentId)),
    getDoc(doc(db, 'programs', programId)),
  ]);
  if (!deptSnap.exists()) throw new Error('Department not found.');
  if (!progSnap.exists()) throw new Error('Program not found.');

  const dept = deptSnap.data();
  const prog = progSnap.data();

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

  await updateDoc(doc(db, 'users', studentId), {
    enrollmentStatus: ENROLLMENT_STATUS.PENDING,
    updatedAt:        serverTimestamp(),
  });

  return reqRef.id;
}

export async function approveEnrollment({
  requestId,
  adminId,
  currentSemesterId,  
  semesterNumber,     
}) {

  const reqRef  = doc(db, 'enrollmentRequests', requestId);
  const reqSnap = await getDoc(reqRef);
  if (!reqSnap.exists())                      throw new Error('Request not found.');
  if (reqSnap.data().status !== 'PENDING')    throw new Error('Request is not pending.');

  const req = reqSnap.data();

  const deptSnap = await getDoc(doc(db, 'departments', req.departmentId));
  const deptCode = deptSnap.data().code;  
  const counterKey = `${deptCode}_${req.batchYear}`;
  const counterRef = doc(db, 'counters', counterKey);

  let rollNumber;

  await runTransaction(db, async (tx) => {
    const counterSnap = await tx.get(counterRef);
    const nextSerial  = counterSnap.exists() ? counterSnap.data().serial + 1 : 1;
    const serial      = String(nextSerial).padStart(3, '0');
    rollNumber        = `${req.batchYear}/${deptCode}/${serial}`;

    tx.set(counterRef, { serial: nextSerial, updatedAt: serverTimestamp() });

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

    tx.update(reqRef, {
      status:     ENROLLMENT_STATUS.APPROVED,
      rollNumber,
      reviewedAt: serverTimestamp(),
      reviewedBy: adminId,
    });
  });

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

export async function getPendingEnrollments() {
  const q = query(
    collection(db, 'enrollmentRequests'),
    where('status', '==', ENROLLMENT_STATUS.PENDING),
    orderBy('submittedAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

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

  batch.update(userRef, {
    currentSemesterId: newSemesterId,
    semesterNumber:    newSemesterNumber,
    currentYear:       newYear ?? user.currentYear,
    updatedAt:         serverTimestamp(),
  });

  await batch.commit();

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
