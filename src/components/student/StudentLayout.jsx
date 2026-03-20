// src/components/student/StudentLayout.jsx
import { useState } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, BookOpen, ClipboardList, BarChart2,
  CreditCard, Award, Bell, Clock, Library, Video, User,
  LogOut, Menu, X, GraduationCap, ChevronDown, Download,
  FileText, Star, Mic2, Home, MapPin, ChevronRight
} from 'lucide-react'

const navGroups = [
  {
    label: 'Main',
    items: [
      { to: '/student', label: 'LMS Dashboard', icon: LayoutDashboard, end: true },
      { to: '/student/enrollment', label: 'Choose Program', icon: GraduationCap },
      { to: '/student/virtual-class', label: 'Virtual Class Room', icon: Video },
      { to: '/student/attendance', label: 'Attendance', icon: ClipboardList },
    ]
  },
  {
    label: 'Academic',
    items: [
      { to: '/student/exam-form', label: 'Course Selection / Exam Form', icon: FileText },
      { to: '/student/courses', label: 'My Courses', icon: BookOpen },
      { to: '/student/results', label: 'Exams Result Board', icon: BarChart2 },
      { to: '/student/evaluation', label: 'Course Evaluation', icon: Star },
      { to: '/student/hec-survey', label: 'HEC Survey Form', icon: Mic2 },
      { to: '/student/timetable', label: 'Timetable', icon: Clock },
    ]
  },
  {
    label: 'Finance',
    items: [
      { to: '/student/challan', label: 'Admission / Fee Challan', icon: CreditCard },
      { to: '/student/scholarship', label: 'Scholarship', icon: Award },
    ]
  },
  {
    label: 'Services',
    items: [
      { to: '/student/notices', label: 'Notice Board', icon: Bell },
      { to: '/student/library', label: 'Koha Library', icon: Library },
      { to: '/student/hostel', label: 'Hostel', icon: Home },
      { to: '/student/transport', label: 'Points Pick/Drop', icon: MapPin },
      { to: '/student/downloads', label: 'Downloads', icon: Download },
    ]
  },
  {
    label: 'Account',
    items: [
      { to: '/student/profile', label: 'My Profile', icon: User },
    ]
  }
]

export default function StudentLayout() {
  const { userProfile, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const initials = userProfile?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'ST'

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1e3a5f] flex flex-col transform transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
              <img src="/images/logo.png" alt="UniPortal Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>UniPortal</div>
              <div className="text-blue-300 text-xs">Student Portal</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#f59e0b] rounded-full flex items-center justify-center flex-shrink-0">
              {userProfile?.profileImage
                ? <img src={userProfile.profileImage} alt="" className="w-10 h-10 rounded-full object-cover" />
                : <span className="text-white font-bold text-sm">{initials}</span>}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-sm font-semibold truncate">{userProfile?.name || 'Student'}</p>
              <p className="text-blue-300 text-xs truncate">{userProfile?.rollNumber || userProfile?.email?.split('@')[0]}</p>
              {userProfile?.program && <p className="text-blue-200 text-xs truncate">{userProfile.program}</p>}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll py-3 px-2 space-y-4">
          {navGroups.map(group => (
            <div key={group.label}>
              <p className="text-blue-400 text-xs font-bold uppercase tracking-widest px-3 mb-1">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <NavLink key={item.to} to={item.to} end={item.end}
                    className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
                    onClick={() => setSidebarOpen(false)}>
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate text-xs">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10 flex-shrink-0">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:text-white hover:bg-red-600/30 transition-all">
            <LogOut className="w-4 h-4" />Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-gray-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {userProfile?.universityName || 'University LMS'}
              </h1>
              {userProfile?.batch && userProfile?.department && (
                <p className="text-xs text-gray-400">{userProfile.batch} · {userProfile.department}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/student/notices">
              <button className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </Link>
            <div className="relative">
              <button onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 hover:bg-gray-100 rounded-xl px-3 py-1.5 transition-all">
                <div className="w-7 h-7 bg-[#1e3a5f] rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{initials}</span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[100px] truncate">
                  {userProfile?.name?.split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  <Link to="/student/profile" onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <User className="w-4 h-4" /> My Profile
                  </Link>
                  <hr className="my-1" />
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
