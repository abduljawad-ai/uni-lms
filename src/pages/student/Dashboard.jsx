// src/pages/student/Dashboard.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase/config'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import {
  BookOpen, ClipboardList, BarChart2, CreditCard, Award,
  Bell, Clock, Library, Video, GraduationCap, AlertCircle,
  Calendar, CheckCircle, XCircle, FileText, Star, Mic2,
  Download, Home, MapPin
} from 'lucide-react'

const quickLinks = [
  { to:'/student/enrollment', label:'Choose Program', icon:GraduationCap, desc:'Select degree program', color:'bg-blue-50 text-blue-600' },
  { to:'/student/virtual-class', label:'Virtual Class Room', icon:Video, desc:'Weekly lecture materials', color:'bg-purple-50 text-purple-600' },
  { to:'/student/attendance', label:'Attendance', icon:ClipboardList, desc:'Check your attendance', color:'bg-green-50 text-green-600' },
  { to:'/student/exam-form', label:'Course Selection / Exam Form', icon:FileText, desc:'Submit exam subject form', color:'bg-orange-50 text-orange-600' },
  { to:'/student/results', label:'Exams Result Notice Board', icon:BarChart2, desc:'View semester results', color:'bg-yellow-50 text-yellow-600' },
  { to:'/student/challan', label:'Admission / Fee Challan', icon:CreditCard, desc:'Fee payment & challan', color:'bg-red-50 text-red-600' },
  { to:'/student/scholarship', label:'Scholarship', icon:Award, desc:'Financial aid office', color:'bg-pink-50 text-pink-600' },
  { to:'/student/evaluation', label:'Course Evaluation', icon:Star, desc:'Higher Education Commission', color:'bg-indigo-50 text-indigo-600' },
  { to:'/student/hec-survey', label:'HEC Survey Form', icon:Mic2, desc:'Higher Education Commission', color:'bg-teal-50 text-teal-600' },
  { to:'/student/downloads', label:'Downloads', icon:Download, desc:'PDFs and other documents', color:'bg-cyan-50 text-cyan-600' },
  { to:'/student/hostel', label:'Hostel', icon:Home, desc:'Form / Paid Fees History', color:'bg-amber-50 text-amber-600' },
  { to:'/student/transport', label:'Points Pick/Drop Locations', icon:MapPin, desc:'University transport', color:'bg-lime-50 text-lime-600' },
  { to:'/student/notices', label:'Notice Board', icon:Bell, desc:'University announcements', color:'bg-rose-50 text-rose-600' },
  { to:'/student/timetable', label:'Timetable', icon:Clock, desc:'Class schedule', color:'bg-sky-50 text-sky-600' },
  { to:'/student/library', label:'Koha Library', icon:Library, desc:'Digital library & resources', color:'bg-violet-50 text-violet-600' },
]

export default function StudentDashboard() {
  const { userProfile } = useAuth()
  const [challans, setChallans] = useState([])
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)

  const isEnrolled = userProfile?.isEnrolled && userProfile?.programId

  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile?.uid) return
      try {
        const [cSnap, nSnap] = await Promise.all([
          getDocs(query(collection(db,'challans'), where('studentId','==',userProfile.uid), orderBy('createdAt','desc'), limit(5))),
          getDocs(query(collection(db,'notifications'), where('isActive','==',true), orderBy('createdAt','desc'), limit(3)))
        ])
        setChallans(cSnap.docs.map(d => ({ id:d.id, ...d.data() })))
        setNotices(nSnap.docs.map(d => ({ id:d.id, ...d.data() })))
      } catch { } finally { setLoading(false) }
    }
    fetchData()
  }, [userProfile])

  const unpaidChallans = challans.filter(c => c.status === 'unpaid')

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-[#1e3a5f] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-full opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 rounded-full border-4 border-white" />
          <div className="absolute bottom-4 right-16 w-20 h-20 rounded-full border-2 border-white" />
        </div>
        <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-blue-200 text-sm mb-1">Welcome back,</p>
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily:'Outfit,sans-serif' }}>
              {userProfile?.name || 'Student'}
            </h1>
            {isEnrolled ? (
              <div className="space-y-0.5">
                <p className="text-blue-200 text-sm">{userProfile.program}</p>
                <p className="text-blue-300 text-xs">Roll No: {userProfile.rollNumber || 'N/A'} · Batch: {userProfile.batch || 'N/A'}</p>
                <p className="text-blue-300 text-xs">{userProfile.department} · Semester {userProfile.currentSemester || 1}</p>
              </div>
            ) : (
              <p className="text-amber-300 text-sm font-medium mt-1">⚠️ Program not selected — please enroll</p>
            )}
          </div>
          <div className="bg-white/10 rounded-lg px-3 py-1.5 text-xs text-blue-200 self-start">
            <Calendar className="inline w-3 h-3 mr-1" />
            {new Date().toLocaleDateString('en-PK', { weekday:'short', year:'numeric', month:'short', day:'numeric' })}
          </div>
        </div>
      </div>

      {/* Enrollment Alert */}
      {!isEnrolled && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-sm">Action Required: Select Your Program</p>
            <p className="text-amber-700 text-sm mt-0.5">Select your department, program, and batch to access all portal features.</p>
          </div>
          <Link to="/student/enrollment"
            className="bg-amber-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition-all flex-shrink-0">
            Enroll Now
          </Link>
        </div>
      )}

      {/* Quick Links Grid */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-3" style={{ fontFamily:'Outfit,sans-serif' }}>Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {quickLinks.map(link => (
            <Link key={link.to} to={link.to}
              className="bg-white rounded-2xl p-4 flex flex-col items-start gap-3 border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${link.color}`}>
                <link.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800 group-hover:text-[#1e3a5f] transition-colors leading-tight">{link.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Challans */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800" style={{ fontFamily:'Outfit,sans-serif' }}>Paid / Unpaid Challans</h3>
            <Link to="/student/challan" className="text-xs text-[#1e3a5f] font-semibold hover:underline">View All</Link>
          </div>
          {loading ? (
            <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
          ) : challans.length === 0 ? (
            <div className="p-6 text-center">
              <CreditCard className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No challans found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr>
                  <th className="table-header">Status</th>
                  <th className="table-header">Title</th>
                  <th className="table-header">Semester</th>
                  <th className="table-header">Due Date</th>
                </tr></thead>
                <tbody>
                  {challans.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        {c.status === 'paid'
                          ? <span className="badge-green flex items-center gap-1 w-fit text-xs"><CheckCircle className="w-3 h-3" />Paid</span>
                          : <span className="badge-red flex items-center gap-1 w-fit text-xs"><XCircle className="w-3 h-3" />Unpaid</span>}
                      </td>
                      <td className="table-cell font-medium text-xs">{c.title}</td>
                      <td className="table-cell text-xs">{c.semester || '-'}</td>
                      <td className="table-cell text-xs">
                        {c.dueDate ? new Date(c.dueDate.toDate?.() || c.dueDate).toLocaleDateString('en-PK', { day:'2-digit', month:'2-digit', year:'numeric' }) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {unpaidChallans.length > 0 && (
            <div className="px-5 py-3 bg-red-50 border-t border-red-100">
              <p className="text-red-700 text-xs font-medium">
                ⚠️ You have {unpaidChallans.length} unpaid challan(s). Please pay before the due date to avoid late fees.
              </p>
            </div>
          )}
        </div>

        {/* Notices */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800" style={{ fontFamily:'Outfit,sans-serif' }}>Recent Notices</h3>
            <Link to="/student/notices" className="text-xs text-[#1e3a5f] font-semibold hover:underline">View All</Link>
          </div>
          {loading ? (
            <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
          ) : notices.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No notices yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notices.map(n => (
                <div key={n.id} className="px-5 py-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type==='urgent'?'bg-red-500':n.type==='exam'?'bg-yellow-500':'bg-blue-500'}`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {n.createdAt ? new Date(n.createdAt.toDate?.() || n.createdAt).toLocaleDateString('en-PK', { day:'numeric', month:'short', year:'numeric' }) : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
