
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase/config'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { BookOpen, Clock, User, ChevronRight, AlertCircle } from 'lucide-react'

const COLORS = ['bg-blue-500','bg-indigo-500','bg-purple-500','bg-green-500','bg-teal-500','bg-orange-500','bg-pink-500','bg-cyan-500']

export default function StudentCourses() {
  const { userProfile } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      if (!userProfile?.programId || !userProfile?.currentSemester) {
        setLoading(false); return
      }
      try {
        const snap = await getDocs(query(
          collection(db, 'courses'),
          where('programId', '==', userProfile.programId),
          where('semester', '==', userProfile.currentSemester)
        ))
        setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch { } finally { setLoading(false) }
    }
    fetchCourses()
  }, [userProfile])

  if (!userProfile?.isEnrolled) return (
    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
      <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
      <h3 className="font-bold text-gray-700 mb-2" style={{ fontFamily:'Outfit,sans-serif' }}>Not Enrolled Yet</h3>
      <p className="text-gray-500 text-sm mb-4">Please enroll in a program first to view your courses.</p>
      <Link to="/student/enrollment" className="btn-primary inline-flex">Choose Program</Link>
    </div>
  )

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin"></div></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]" style={{ fontFamily:'Outfit,sans-serif' }}>My Courses</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {userProfile.program} · Semester {userProfile.currentSemester} · Batch {userProfile.batch}
          </p>
        </div>
        <span className="badge-blue text-sm px-3 py-1">{courses.length} Courses</span>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h3 className="font-bold text-gray-700 mb-2">No Courses Yet</h3>
          <p className="text-gray-500 text-sm">Courses for your semester haven't been added yet. Check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course, i) => (
            <Link key={course.id} to={`/student/courses/${course.id}`}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
              <div className={`${COLORS[i % COLORS.length]} p-5 relative overflow-hidden`}>
                <div className="absolute right-3 top-3 w-16 h-16 bg-white/10 rounded-full"></div>
                <div className="absolute right-8 top-8 w-8 h-8 bg-white/10 rounded-full"></div>
                <p className="text-white/70 text-xs font-medium mb-1">{course.courseCode}</p>
                <h3 className="text-white font-bold text-base leading-tight" style={{ fontFamily:'Outfit,sans-serif' }}>{course.name}</h3>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <User className="w-3.5 h-3.5" />
                  <span>{course.teacherName || 'TBA'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{course.creditHours || 3} Credit Hours · {course.type || 'Theory'}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="badge-blue text-xs">{course.semester ? `Sem ${course.semester}` : 'Current'}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#1e3a5f] transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
