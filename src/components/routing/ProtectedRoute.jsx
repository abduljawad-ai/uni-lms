
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function RequireAuth({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!currentUser) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isAdmin) return <Navigate to="/unauthorized" replace />;
  return children;
}

export function TeacherRoute({ children }) {
  const { isApprovedTeacher, isTeacher, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isTeacher) return <Navigate to="/unauthorized" replace />;
  if (!isApprovedTeacher) return <Navigate to="/teacher/pending-approval" replace />;
  return children;
}

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

