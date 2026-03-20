// src/pages/student/CourseDetail.jsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { db } from '../../firebase/config'
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { useAuth } from '../../contexts/AuthContext'
import { BookOpen, Download, FileText, Video, ArrowLeft, User, Clock, Calendar } from 'lucide-react'

export default function StudentCourseDetail() {
  const { courseId } = useParams()
  const { userProfile } = useAuth()
  const [course, setCourse] = useState(null)
  const [materials, setMaterials] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseSnap, matSnap, assSnap] = await Promise.all([
          getDoc(doc(db, 'courses', courseId)),
          getDocs(query(collection(db, 'materials'), where('courseId','==',courseId), orderBy('createdAt','desc'))),
          getDocs(query(collection(db, 'assignments'), where('courseId','==',courseId), orderBy('dueDate','desc')))
        ])
        if (courseSnap.exists()) setCourse({ id: courseSnap.id, ...courseSnap.data() })
        setMaterials(matSnap.docs.map(d=>({id:d.id,...d.data()})))
        setAssignments(assSnap.docs.map(d=>({id:d.id,...d.data()})))
      } catch {} finally { setLoading(false) }
    }
    fetchData()
  }, [courseId])

  if (loading) return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin"></div></div>
  if (!course) return <div className="card text-center text-gray-500 py-12">Course not found.</div>

  const typeIcon = (type) => type==='video' ? <Video className="w-4 h-4"/> : <FileText className="w-4 h-4"/>

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <Link to="/student/courses" className="flex items-center gap-2 text-[#1e3a5f] text-sm font-medium hover:underline">
        <ArrowLeft className="w-4 h-4"/>Back to Courses
      </Link>

      <div className="bg-[#1e3a5f] rounded-2xl p-6 text-white">
        <p className="text-blue-300 text-sm mb-1">{course.courseCode}</p>
        <h1 className="text-2xl font-bold mb-3" style={{fontFamily:'Outfit,sans-serif'}}>{course.name}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-blue-200">
          <span className="flex items-center gap-1.5"><User className="w-4 h-4"/>{course.teacherName || 'TBA'}</span>
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4"/>{course.creditHours||3} Credit Hours</span>
          <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4"/>Semester {course.semester}</span>
        </div>
        {course.description && <p className="text-blue-200 text-sm mt-3">{course.description}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Materials */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800" style={{fontFamily:'Outfit,sans-serif'}}>Course Materials</h3>
            <span className="badge-blue text-xs">{materials.length}</span>
          </div>
          {materials.length === 0 ? (
            <div className="p-6 text-center"><FileText className="w-10 h-10 text-gray-200 mx-auto mb-2"/><p className="text-gray-400 text-sm">No materials uploaded yet</p></div>
          ) : (
            <div className="divide-y divide-gray-100">
              {materials.map(m=>(
                <div key={m.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.type==='video'?'bg-purple-100 text-purple-600':'bg-blue-100 text-blue-600'}`}>
                    {typeIcon(m.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{m.title}</p>
                    <p className="text-xs text-gray-400">{m.type} · {m.createdAt ? new Date(m.createdAt.toDate?.() || m.createdAt).toLocaleDateString('en-PK') : ''}</p>
                  </div>
                  {m.url && (
                    <a href={m.url} target="_blank" rel="noreferrer" className="text-[#1e3a5f] hover:text-[#162a47]">
                      <Download className="w-4 h-4"/>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assignments */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800" style={{fontFamily:'Outfit,sans-serif'}}>Assignments</h3>
            <span className="badge-yellow text-xs">{assignments.length}</span>
          </div>
          {assignments.length === 0 ? (
            <div className="p-6 text-center"><Calendar className="w-10 h-10 text-gray-200 mx-auto mb-2"/><p className="text-gray-400 text-sm">No assignments posted yet</p></div>
          ) : (
            <div className="divide-y divide-gray-100">
              {assignments.map(a=>{
                const due = a.dueDate ? new Date(a.dueDate.toDate?.() || a.dueDate) : null
                const isPast = due && due < new Date()
                return (
                  <div key={a.id} className="px-5 py-3 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{a.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.description}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${isPast ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {isPast ? 'Overdue' : 'Active'}
                      </span>
                    </div>
                    {due && <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3"/>Due: {due.toLocaleDateString('en-PK',{day:'numeric',month:'short',year:'numeric'})}</p>}
                    {a.totalMarks && <p className="text-xs text-gray-400">Total Marks: {a.totalMarks}</p>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
