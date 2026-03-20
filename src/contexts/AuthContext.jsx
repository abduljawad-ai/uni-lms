// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
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
  doc, setDoc, getDoc, updateDoc, serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register new user
  const register = async (email, password, userData) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    const profile = {
      uid: user.uid,
      email,
      name: userData.name,
      role: userData.role, // 'student' | 'teacher' | 'admin'
      phone: userData.phone || '',
      profileImage: '',
      isApproved: userData.role === 'student' ? true : userData.role === 'admin' ? true : false, // teachers need admin approval
      isEnrolled: false, // students must enroll in a program
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', user.uid), profile);
    return { user, profile };
  };

  // Login
  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Logout
  const logout = () => signOut(auth);

  // Reset password
  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  // Update profile
  const updateProfile = async (data) => {
    if (!currentUser) return;
    await updateDoc(doc(db, 'users', currentUser.uid), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    setUserProfile(prev => ({ ...prev, ...data }));
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPassword);
  };

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid) => {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const profile = await fetchUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    setUserProfile,
    register,
    login,
    logout,
    resetPassword,
    updateProfile,
    changePassword,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
