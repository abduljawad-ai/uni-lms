// src/firebase/seed.js
// Run this once to populate initial data: departments, programs, batches
import { db } from './config';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';

export const seedInitialData = async () => {
  // Departments
  const departments = [
    { id: 'cs', name: 'Computer Science', shortName: 'CS' },
    { id: 'it', name: 'Information Technology', shortName: 'IT' },
    { id: 'se', name: 'Software Engineering', shortName: 'SE' },
    { id: 'ee', name: 'Electrical Engineering', shortName: 'EE' },
    { id: 'me', name: 'Mechanical Engineering', shortName: 'ME' },
    { id: 'ba', name: 'Business Administration', shortName: 'BBA' },
    { id: 'eco', name: 'Economics', shortName: 'ECO' },
    { id: 'eng', name: 'English Literature', shortName: 'ENG' },
    { id: 'math', name: 'Mathematics', shortName: 'MATH' },
    { id: 'phy', name: 'Physics', shortName: 'PHY' },
  ];

  const programs = [
    { id: 'bscs', departmentId: 'cs', name: 'BS Computer Science', degree: 'BS', duration: 4 },
    { id: 'mscs', departmentId: 'cs', name: 'MS Computer Science', degree: 'MS', duration: 2 },
    { id: 'bsit', departmentId: 'it', name: 'BS Information Technology', degree: 'BS', duration: 4 },
    { id: 'bsse', departmentId: 'se', name: 'BS Software Engineering', degree: 'BS', duration: 4 },
    { id: 'bsee', departmentId: 'ee', name: 'BS Electrical Engineering', degree: 'BS', duration: 4 },
    { id: 'bsme', departmentId: 'me', name: 'BS Mechanical Engineering', degree: 'BS', duration: 4 },
    { id: 'bba', departmentId: 'ba', name: 'Bachelor of Business Administration', degree: 'BBA', duration: 4 },
    { id: 'mba', departmentId: 'ba', name: 'Master of Business Administration', degree: 'MBA', duration: 2 },
    { id: 'bsmath', departmentId: 'math', name: 'BS Mathematics', degree: 'BS', duration: 4 },
    { id: 'bseng', departmentId: 'eng', name: 'BS English', degree: 'BS', duration: 4 },
  ];

  const batches = ['2K19', '2K20', '2K21', '2K22', '2K23', '2K24', '2K25'];

  for (const dept of departments) {
    await setDoc(doc(db, 'departments', dept.id), dept);
  }

  for (const prog of programs) {
    await setDoc(doc(db, 'programs', prog.id), prog);
  }

  await setDoc(doc(db, 'settings', 'batches'), { list: batches });

  console.log('✅ Initial data seeded successfully');
};
