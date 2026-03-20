// src/components/routing/ProtectedRoute.jsx
// ============================================================
//  UniPortal — Route Guards  (v2)
//
//  Guards:
//    <AdminRoute>         — admin only
//    <TeacherRoute>       — approved teacher only
//    <StudentRoute>       — any authenticated student
//    <ApprovedStudentRoute> — only approved (enrolled) students
//    <EnrollmentGate>     — student enrollment funnel:
//                           NONE → ChooseProgram
//                           PENDING → EnrollmentPending
//                           REJECTED → EnrollmentRejected
//                           APPROVED → renders children
// ============================================================

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// ─── Generic auth guard ────────────────────────────────────────
function RequireAuth({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!currentUser) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

// ─── Admin only ────────────────────────────────────────────────
export function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isAdmin) return <Navigate to="/unauthorized" replace />;
  return children;
}

// ─── Approved teacher only ─────────────────────────────────────
export function TeacherRoute({ children }) {
  const { isApprovedTeacher, isTeacher, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isTeacher) return <Navigate to="/unauthorized" replace />;
  if (!isApprovedTeacher) return <Navigate to="/teacher/pending-approval" replace />;
  return children;
}

// ─── Student enrollment funnel ─────────────────────────────────
//  Routes APPROVED students through; redirects others to
//  the correct holding page based on their enrollment state.
export function ApprovedStudentRoute({ children }) {
  const {
    isStudent,
    isApprovedStudent,
    isPendingStudent,
    isRejectedStudent,
    isUnenrolledStudent,
    loading,
  } = useAuth();

  if (loading) return <PageLoader />;
  if (!isStudent) return <Navigate to="/unauthorized" replace />;

  if (isUnenrolledStudent) return <Navigate to="/student/choose-program" replace />;
  if (isPendingStudent) return <Navigate to="/student/enrollment-pending" replace />;
  if (isRejectedStudent) return <Navigate to="/student/enrollment-rejected" replace />;
  if (!isApprovedStudent) return <Navigate to="/student/choose-program" replace />;

  return children;
}

// ─── Tiny loader ────────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', fontFamily: 'sans-serif', color: '#6b7280',
    }}>
      Loading…
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  App.jsx route setup — paste this into your <Routes> block
//
//  <Route path="/admin/*"   element={<AdminRoute><AdminLayout /></AdminRoute>} />
//  <Route path="/teacher/*" element={<TeacherRoute><TeacherLayout /></TeacherRoute>} />
//
//  Student routes — approved students only:
//  <Route path="/student/dashboard"  element={<ApprovedStudentRoute><Dashboard /></ApprovedStudentRoute>} />
//  <Route path="/student/courses"    element={<ApprovedStudentRoute><Courses /></ApprovedStudentRoute>} />
//  ... all other student pages
//
//  Enrollment funnel — always accessible to any student:
//  <Route path="/student/choose-program"       element={<ChooseProgram />} />
//  <Route path="/student/enrollment-pending"   element={<EnrollmentPending />} />
//  <Route path="/student/enrollment-rejected"  element={<EnrollmentRejected />} />
// ─────────────────────────────────────────────────────────────
