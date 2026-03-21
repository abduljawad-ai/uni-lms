
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

export const NOTIF_TYPE = {
  INFO:   'INFO',    
  EXAM:   'EXAM',    
  FEE:    'FEE',     
  URGENT: 'URGENT',  
  CLASS:  'CLASS',   
};

export async function createNotification({
  title,
  body,
  type = NOTIF_TYPE.INFO,
  createdBy,
  createdByRole,          
  targetDepartmentId,     
  targetYear = null,      
  targetSemesterId = null, 
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

export async function fetchStudentNotifications(studentProfile) {
  const {
    departmentId,
    currentYear,
    currentSemesterId,
  } = studentProfile;

  if (!departmentId) return []; 

  const [q1Snap, q2Snap, q3Snap] = await Promise.all([

    getDocs(query(
      collection(db, 'notifications'),
      where('targetDepartmentId', '==', departmentId),
      where('targetYear',         '==', null),
      where('targetSemesterId',   '==', null),
      where('isActive',           '==', true),
      orderBy('createdAt', 'desc')
    )),

    getDocs(query(
      collection(db, 'notifications'),
      where('targetDepartmentId', '==', departmentId),
      where('targetYear',         '==', currentYear),
      where('targetSemesterId',   '==', null),
      where('isActive',           '==', true),
      orderBy('createdAt', 'desc')
    )),

    getDocs(query(
      collection(db, 'notifications'),
      where('targetDepartmentId', '==', departmentId),
      where('targetYear',         '==', currentYear),
      where('targetSemesterId',   '==', currentSemesterId),
      where('isActive',           '==', true),
      orderBy('createdAt', 'desc')
    )),
  ]);

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

  all.sort((a, b) => {
    const tA = a.createdAt?.toMillis?.() ?? 0;
    const tB = b.createdAt?.toMillis?.() ?? 0;
    return tB - tA;
  });

  return all;
}

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

export async function toggleNotification(notifId, isActive) {
  await updateDoc(doc(db, 'notifications', notifId), {
    isActive,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteNotification(notifId) {
  await deleteDoc(doc(db, 'notifications', notifId));
}
