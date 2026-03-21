
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase/config'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { BookOpen, Users, ClipboardList, BarChart2, FileText, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function TeacherDashboard() {
  const { userProfile } = useAuth()
  const [stats, setStats] = useState({ courses: 0, students: 0, assignments: 0 })
  const [courses, setCourses] = useState([])

  useEffect(() => {
    const fetch = async () => {
      if (!userProfile?.uid) return
      try {
        const cSnap = await getDocs(query(collection(db,'courses'), where('teacherId','==',userProfile.uid)))
        const courseList = cSnap.docs.map(d=>({id:d.id,...d.data()}))
        setCourses(courseList)

        const aSnap = await getDocs(query(collection(db,'assignments'), where('teacherId','==',userProfile.uid)))
        setStats({ courses: courseList.length, students: 0, assignments: aSnap.size })
      } catch {}
    }
    fetch()
  }, [userProfile])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#1a2e4a] rounded-2xl p-6 text-white">
        <p className="text-blue-200 text-sm">Welcome back,</p>
        <h1 className="text-2xl font-bold" style={{fontFamily:'Outfit,sans-serif'}}>{userProfile?.name}</h1>
        <p className="text-blue-200 text-sm mt-1">{userProfile?.designation || 'Lecturer'} · {userProfile?.department || 'Department'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'My Courses', value: stats.courses, icon: BookOpen, color: 'bg-blue-50 text-blue-600', to: '/teacher/courses' },
          { label: 'Total Students', value: stats.students, icon: Users, color: 'bg-green-50 text-green-600', to: '/teacher/courses' },
          { label: 'Assignments', value: stats.assignments, icon: FileText, color: 'bg-purple-50 text-purple-600', to: '/teacher/assignments' },
        ].map(s=>(
          <Link key={s.label} to={s.to} className="stat-card flex items-center gap-4 hover:-translate-y-0.5 transition-all">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}><s.icon className="w-6 h-6"/></div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800" style={{fontFamily:'Outfit,sans-serif'}}>My Courses</h3>
          <Link to="/teacher/courses" className="text-xs text-[#1a2e4a] font-semibold hover:underline">View All</Link>
        </div>
        {courses.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No courses assigned yet. Contact admin.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {courses.map(c=>(
              <Link key={c.id} to={`/teacher/courses/${c.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50">
                <div className="w-10 h-10 bg-[#1a2e4a] rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-white"/>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-sm">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.courseCode} · Semester {c.semester}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400"/>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { to: '/teacher/attendance', label: 'Mark Attendance', desc: 'Record student attendance', icon: ClipboardList, color: 'bg-green-500' },
          { to: '/teacher/marks', label: 'Enter Marks', desc: 'Update student marks', icon: BarChart2, color: 'bg-blue-500' },
          { to: '/teacher/assignments', label: 'Create Assignment', desc: 'Post new assignment', icon: FileText, color: 'bg-purple-500' },
          { to: '/teacher/materials', label: 'Upload Material', desc: 'Share course resources', icon: BookOpen, color: 'bg-orange-500' },
        ].map(q=>(
          <Link key={q.to} to={q.to} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className={`w-12 h-12 ${q.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <q.icon className="w-6 h-6 text-white"/>
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">{q.label}</p>
              <p className="text-xs text-gray-400">{q.desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 ml-auto"/>
          </Link>
        ))}
      </div>
    </div>
  )
}
