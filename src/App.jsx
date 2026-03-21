// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'

import Landing from './pages/Landing'

// Student Pages
import StudentLayout from './components/student/StudentLayout'
import StudentDashboard from './pages/student/Dashboard'
import StudentEnrollment from './pages/student/Enrollment'
import StudentCourses from './pages/student/Courses'
import StudentCourseDetail from './pages/student/CourseDetail'
import StudentAttendance from './pages/student/Attendance'
import StudentResults from './pages/student/Results'
import StudentChallan from './pages/student/Challan'
import StudentScholarship from './pages/student/Scholarship'
import StudentProfile from './pages/student/Profile'
import StudentNotices from './pages/student/Notices'
import StudentTimetable from './pages/student/Timetable'
import StudentLibrary from './pages/student/Library'
import VirtualClassroom from './pages/student/VirtualClassroom'
import CourseSelectionForm from './pages/student/CourseSelectionForm'
import CourseEvaluation from './pages/student/CourseEvaluation'
import HECSurvey from './pages/student/HECSurvey'
import Downloads from './pages/student/Downloads'
import Hostel from './pages/student/Hostel'
import Transport from './pages/student/Transport'

// Teacher Pages
import TeacherLayout from './components/teacher/TeacherLayout'
import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherCourses from './pages/teacher/Courses'
import TeacherCourseDetail from './pages/teacher/CourseDetail'
import TeacherAttendance from './pages/teacher/Attendance'
import TeacherMarks from './pages/teacher/Marks'
import TeacherAssignments from './pages/teacher/Assignments'
import TeacherProfile from './pages/teacher/Profile'
import TeacherTimetable from './pages/teacher/Timetable'
import TeacherMaterials from './pages/teacher/Materials'

// Admin Pages
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminStudents from './pages/admin/Students'
import AdminTeachers from './pages/admin/Teachers'
import AdminDepartments from './pages/admin/Departments'
import AdminCourses from './pages/admin/Courses'
import AdminPrograms from './pages/admin/Programs'
import AdminBatches from './pages/admin/Batches'
import AdminEnrollments from './pages/admin/Enrollments'
import AdminChallans from './pages/admin/Challans'
import AdminNotices from './pages/admin/Notices'
import AdminScholarships from './pages/admin/Scholarships'
import AdminTimetable from './pages/admin/Timetable'
import AdminResults from './pages/admin/Results'
import AdminProfile from './pages/admin/Profile'
import AdminSettings from './pages/admin/Settings'

const PrivateRoute = ({ children, allowedRoles }) => {
  const { currentUser, userProfile } = useAuth()
  if (!currentUser) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(userProfile?.role)) return <Navigate to="/login" replace />

  // Students who are not approved can only access enrollment page
  if (userProfile?.role === 'student' && userProfile?.enrollmentStatus !== 'APPROVED') {
    const path = window.location.pathname
    if (!path.includes('/student/enrollment')) {
      return <Navigate to="/student/enrollment" replace />
    }
  }
  return children
}

const PublicRoute = ({ children }) => {
  const { currentUser, userProfile } = useAuth()
  if (currentUser && userProfile) {
    if (userProfile.role === 'admin') return <Navigate to="/admin" replace />
    if (userProfile.role === 'teacher') return <Navigate to="/teacher" replace />
    return <Navigate to="/student" replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/" element={<Landing />} />

      {/* Student Routes */}
      <Route path="/student" element={<PrivateRoute allowedRoles={['student']}><StudentLayout /></PrivateRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="enrollment" element={<StudentEnrollment />} />
        <Route path="courses" element={<StudentCourses />} />
        <Route path="courses/:courseId" element={<StudentCourseDetail />} />
        <Route path="attendance" element={<StudentAttendance />} />
        <Route path="results" element={<StudentResults />} />
        <Route path="challan" element={<StudentChallan />} />
        <Route path="scholarship" element={<StudentScholarship />} />
        <Route path="notices" element={<StudentNotices />} />
        <Route path="timetable" element={<StudentTimetable />} />
        <Route path="library" element={<StudentLibrary />} />
        <Route path="virtual-class" element={<VirtualClassroom />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="exam-form" element={<CourseSelectionForm />} />
        <Route path="evaluation" element={<CourseEvaluation />} />
        <Route path="hec-survey" element={<HECSurvey />} />
        <Route path="downloads" element={<Downloads />} />
        <Route path="hostel" element={<Hostel />} />
        <Route path="transport" element={<Transport />} />
      </Route>

      {/* Teacher Routes */}
      <Route path="/teacher" element={<PrivateRoute allowedRoles={['teacher']}><TeacherLayout /></PrivateRoute>}>
        <Route index element={<TeacherDashboard />} />
        <Route path="courses" element={<TeacherCourses />} />
        <Route path="courses/:courseId" element={<TeacherCourseDetail />} />
        <Route path="attendance" element={<TeacherAttendance />} />
        <Route path="marks" element={<TeacherMarks />} />
        <Route path="assignments" element={<TeacherAssignments />} />
        <Route path="materials" element={<TeacherMaterials />} />
        <Route path="timetable" element={<TeacherTimetable />} />
        <Route path="profile" element={<TeacherProfile />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<PrivateRoute allowedRoles={['admin']}><AdminLayout /></PrivateRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="teachers" element={<AdminTeachers />} />
        <Route path="departments" element={<AdminDepartments />} />
        <Route path="courses" element={<AdminCourses />} />
        <Route path="programs" element={<AdminPrograms />} />
        <Route path="batches" element={<AdminBatches />} />
        <Route path="enrollments" element={<AdminEnrollments />} />
        <Route path="challans" element={<AdminChallans />} />
        <Route path="notices" element={<AdminNotices />} />
        <Route path="scholarships" element={<AdminScholarships />} />
        <Route path="timetable" element={<AdminTimetable />} />
        <Route path="results" element={<AdminResults />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
