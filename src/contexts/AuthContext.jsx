
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export const ENROLLMENT_STATUS = {
  NONE: 'NONE',      
  PENDING: 'PENDING',   
  APPROVED: 'APPROVED',  
  REJECTED: 'REJECTED',  
};

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);  
  const [userProfile, setUserProfile] = useState(null);  
  const [loading, setLoading] = useState(true);

  const isAdmin = userProfile?.role === 'admin';
  const isTeacher = userProfile?.role === 'teacher';
  const isStudent = userProfile?.role === 'student';

  const isApprovedTeacher = isTeacher && userProfile?.isApproved === true;

  const isApprovedStudent =
    isStudent && userProfile?.enrollmentStatus === ENROLLMENT_STATUS.APPROVED;

  const isPendingStudent =
    isStudent && userProfile?.enrollmentStatus === ENROLLMENT_STATUS.PENDING;

  const isRejectedStudent =
    isStudent && userProfile?.enrollmentStatus === ENROLLMENT_STATUS.REJECTED;

  const isUnenrolledStudent =
    isStudent && userProfile?.enrollmentStatus === ENROLLMENT_STATUS.NONE;

  const loadProfile = useCallback(async (uid) => {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      setUserProfile({ id: snap.id, ...snap.data() });
    } else {
      setUserProfile(null);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [loadProfile]);

  async function register({ email, password, displayName, role }) {
    if (role === 'admin') {
      throw new Error('Admin accounts cannot be self-registered.');
    }

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    const baseDoc = {
      uid,
      email,
      displayName,
      role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      photoUrl: null,
      phone: null,
    };

    let roleDoc = {};

    if (role === 'student') {
      roleDoc = {
        enrollmentStatus: ENROLLMENT_STATUS.NONE,

        departmentId: null,
        departmentName: null,
        programId: null,
        programName: null,
        batchYear: null,
        currentYear: null,      
        currentSemesterId: null,
        rollNumber: null,
        cgpa: null,
      };
    }

    if (role === 'teacher') {
      roleDoc = {
        isApproved: false,
        departmentId: null,
        designation: null,
        specialization: null,
        qualification: null,
      };
    }

    await setDoc(doc(db, 'users', uid), { ...baseDoc, ...roleDoc });
    await loadProfile(uid);
    return cred.user;
  }

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await loadProfile(cred.user.uid);
    return cred.user;
  }

  async function logout() {
    await signOut(auth);
    setUserProfile(null);
  }

  async function forgotPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  const PROTECTED = [
    'role', 'isApproved', 'enrollmentStatus',
    'rollNumber', 'departmentId', 'programId',
    'batchYear', 'currentYear', 'currentSemesterId',
    'email', 'uid', 'createdAt',
  ];

  async function updateProfile(fields) {
    if (!currentUser) throw new Error('Not authenticated.');

    const safeFields = Object.fromEntries(
      Object.entries(fields).filter(([k]) => !PROTECTED.includes(k))
    );

    if (Object.keys(safeFields).length === 0) {
      throw new Error('No safe fields to update.');
    }

    safeFields.updatedAt = serverTimestamp();
    await updateDoc(doc(db, 'users', currentUser.uid), safeFields);
    await loadProfile(currentUser.uid);
  }

  async function changePassword(currentPassword, newPassword) {
    if (!currentUser) throw new Error('Not authenticated.');

    const cred = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, cred);
    await updatePassword(currentUser, newPassword);
  }

  async function refreshProfile() {
    if (currentUser) await loadProfile(currentUser.uid);
  }

  const value = {

    currentUser,
    userProfile,
    loading,

    isAdmin,
    isTeacher,
    isStudent,
    isApprovedTeacher,
    isApprovedStudent,
    isPendingStudent,
    isRejectedStudent,
    isUnenrolledStudent,

    register,
    login,
    logout,
    forgotPassword,
    updateProfile,
    changePassword,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
