// src/components/admin/AdminLayout.jsx
import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Users, UserCheck, Building2, BookOpen, Layers,
  ClipboardList, CreditCard, Bell, Award, Clock, BarChart2,
  Settings, LogOut, Menu, X, GraduationCap, User, ChevronRight
} from 'lucide-react'

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    ]
  },
  {
    label: 'Users',
    items: [
      { to: '/admin/students', label: 'Students', icon: Users },
      { to: '/admin/teachers', label: 'Teachers', icon: UserCheck },
    ]
  },
  {
    label: 'Academic',
    items: [
      { to: '/admin/departments', label: 'Departments', icon: Building2 },
      { to: '/admin/courses', label: 'Courses', icon: BookOpen },
      { to: '/admin/programs', label: 'Programs', icon: GraduationCap },
      { to: '/admin/batches', label: 'Batches', icon: Layers },
      { to: '/admin/enrollments', label: 'Enrollments', icon: ClipboardList },
      { to: '/admin/timetable', label: 'Timetable', icon: Clock },
      { to: '/admin/results', label: 'Results', icon: BarChart2 },
    ]
  },
  {
    label: 'Finance & Admin',
    items: [
      { to: '/admin/challans', label: 'Fee Challans', icon: CreditCard },
      { to: '/admin/scholarships', label: 'Scholarships', icon: Award },
      { to: '/admin/notices', label: 'Notice Board', icon: Bell },
    ]
  },
  {
    label: 'System',
    items: [
      { to: '/admin/profile', label: 'Profile', icon: User },
      { to: '/admin/settings', label: 'Settings', icon: Settings },
    ]
  }
]

export default function AdminLayout() {
  const { userProfile, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => { await logout(); toast.success('Logged out'); navigate('/login') }
  const initials = userProfile?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)||'AD'

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0d1f35] flex flex-col transform transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen?'translate-x-0':'-translate-x-full'}`}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
              <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="UniPortal Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-white font-bold text-base" style={{fontFamily:'Outfit,sans-serif'}}>UniPortal</div>
              <div className="text-blue-400 text-xs">Admin Panel</div>
            </div>
          </div>
          <button onClick={()=>setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white"><X className="w-5 h-5"/></button>
        </div>

        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">{initials}</span>
            </div>
            <div>
              <p className="text-white text-sm font-semibold truncate">{userProfile?.name||'Admin'}</p>
              <p className="text-blue-400 text-xs">System Administrator</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto sidebar-scroll p-3 space-y-4">
          {navGroups.map(group=>(
            <div key={group.label}>
              <p className="text-blue-500 text-xs font-bold uppercase tracking-widest px-4 mb-1">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map(item=>(
                  <NavLink key={item.to} to={item.to} end={item.end}
                    className={({isActive})=>isActive?'sidebar-link-active':'sidebar-link'}
                    onClick={()=>setSidebarOpen(false)}>
                    <item.icon className="w-4 h-4 flex-shrink-0"/>
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:text-white hover:bg-red-600/30 transition-all">
            <LogOut className="w-4 h-4"/>Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={()=>setSidebarOpen(false)}/>}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={()=>setSidebarOpen(true)} className="lg:hidden text-gray-500"><Menu className="w-5 h-5"/></button>
            <span className="font-semibold text-gray-800 text-sm hidden sm:block" style={{fontFamily:'Outfit,sans-serif'}}>Admin Panel</span>
          </div>
          <div className="flex items-center gap-2 hover:bg-gray-100 rounded-xl px-3 py-1.5 cursor-pointer" onClick={()=>navigate('/admin/profile')}>
            <div className="w-7 h-7 bg-[#0d1f35] rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">{userProfile?.name?.split(' ')[0]}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6"><Outlet/></main>
      </div>
    </div>
  )
}
