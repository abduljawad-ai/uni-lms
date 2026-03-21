
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase/config'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { BookOpen, Users, ChevronRight, AlertCircle } from 'lucide-react'

const COLORS = ['bg-blue-500','bg-indigo-500','bg-purple-500','bg-green-500','bg-teal-500','bg-orange-500']

export default function TeacherCourses() {
  const { userProfile } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      if (!userProfile?.uid) return setLoading(false)
      try {
        const snap = await getDocs(query(collection(db,'courses'), where('teacherId','==',userProfile.uid)))
        setCourses(snap.docs.map(d=>({id:d.id,...d.data()})))
      } catch {} finally { setLoading(false) }
    }
    fetch()
  }, [userProfile])

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-[#1a2e4a]/20 border-t-[#1a2e4a] rounded-full animate-spin"/></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1a2e4a]" style={{fontFamily:'Outfit,sans-serif'}}>My Courses</h1>
        <span className="badge-blue">{courses.length} Assigned</span>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3"/>
          <h3 className="font-bold text-gray-700 mb-1">No Courses Assigned</h3>
          <p className="text-gray-500 text-sm">The admin hasn't assigned any courses to you yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c, i) => (
            <Link key={c.id} to={`/teacher/courses/${c.id}`}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <div className={`${COLORS[i%COLORS.length]} p-5 relative overflow-hidden`}>
                <div className="absolute right-3 top-3 w-16 h-16 bg-white/10 rounded-full"/>
                <p className="text-white/70 text-xs font-medium">{c.courseCode}</p>
                <h3 className="text-white font-bold text-base leading-tight mt-1" style={{fontFamily:'Outfit,sans-serif'}}>{c.name}</h3>
                <p className="text-white/70 text-xs mt-1">{c.creditHours||3} Credits · {c.type||'Theory'}</p>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Program: <span className="font-medium text-gray-700">{c.programName||'N/A'}</span></p>
                    <p className="text-xs text-gray-500 mt-0.5">Semester: <span className="font-medium text-gray-700">{c.semester}</span></p>
                    <p className="text-xs text-gray-500 mt-0.5">Batch: <span className="font-medium text-gray-700">{c.batch||'N/A'}</span></p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#1a2e4a] transition-colors"/>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
