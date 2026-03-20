// src/contexts/AuthContext.jsx
// ============================================================
//  UniPortal — AuthContext  (v2 — Full Rewrite)
//  Handles: auth state, role resolution, enrollment status,
//  teacher approval, profile updates, password change
// ============================================================

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

// ─── Enrollment states ────────────────────────────────────────
export const ENROLLMENT_STATUS = {
  NONE: 'NONE',      // Just registered, no application submitted
  PENDING: 'PENDING',   // Application submitted, awaiting admin review
  APPROVED: 'APPROVED',  // Verified — full student access
  REJECTED: 'REJECTED',  // Rejected — can re-apply or contact admin
};

// ─── Context ──────────────────────────────────────────────────
const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);  // Firebase Auth user
  const [userProfile, setUserProfile] = useState(null);  // Firestore user doc
  const [loading, setLoading] = useState(true);

  // ── Derived convenience flags ──────────────────────────────
  const isAdmin = userProfile?.role === 'admin';
  const isTeacher = userProfile?.role === 'teacher';
  const isStudent = userProfile?.role === 'student';

  // A teacher who has been approved by an admin
  const isApprovedTeacher = isTeacher && userProfile?.isApproved === true;

  // A student whose enrollment was approved (= "real student")
  const isApprovedStudent =
    isStudent && userProfile?.enrollmentStatus === ENROLLMENT_STATUS.APPROVED;

  // Student has submitted an application but it's still pending
  const isPendingStudent =
    isStudent && userProfile?.enrollmentStatus === ENROLLMENT_STATUS.PENDING;

  // Student was rejected — they need to contact admin
  const isRejectedStudent =
    isStudent && userProfile?.enrollmentStatus === ENROLLMENT_STATUS.REJECTED;

  // Student hasn't even applied yet
  const isUnenrolledStudent =
    isStudent && userProfile?.enrollmentStatus === ENROLLMENT_STATUS.NONE;

  // ── Load user profile from Firestore ──────────────────────
  const loadProfile = useCallback(async (uid) => {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      setUserProfile({ id: snap.id, ...snap.data() });
    } else {
      setUserProfile(null);
    }
  }, []);

  // ── Auth state listener ────────────────────────────────────
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

  // ── Register ───────────────────────────────────────────────
  // role: 'student' | 'teacher'  (admin can never self-register)
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
        // These are null until enrollment is approved
        departmentId: null,
        departmentName: null,
        programId: null,
        programName: null,
        batchYear: null,
        currentYear: null,      // 1 | 2 | 3 | 4
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

  // ── Login ──────────────────────────────────────────────────
  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await loadProfile(cred.user.uid);
    return cred.user;
  }

  // ── Logout ─────────────────────────────────────────────────
  async function logout() {
    await signOut(auth);
    setUserProfile(null);
  }

  // ── Forgot password ────────────────────────────────────────
  async function forgotPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // ── Update own safe profile fields ────────────────────────
  // Protected fields (role, enrollmentStatus, rollNumber, etc.)
  // can never be updated through this function
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

  // ── Change password (requires re-auth) ────────────────────
  async function changePassword(currentPassword, newPassword) {
    if (!currentUser) throw new Error('Not authenticated.');

    const cred = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, cred);
    await updatePassword(currentUser, newPassword);
  }

  // ── Refresh profile (call after enrollment state changes) ──
  async function refreshProfile() {
    if (currentUser) await loadProfile(currentUser.uid);
  }

  // ── Context value ──────────────────────────────────────────
  const value = {
    // Auth state
    currentUser,
    userProfile,
    loading,

    // Role flags
    isAdmin,
    isTeacher,
    isStudent,
    isApprovedTeacher,
    isApprovedStudent,
    isPendingStudent,
    isRejectedStudent,
    isUnenrolledStudent,

    // Auth actions
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
