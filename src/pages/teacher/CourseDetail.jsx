
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { db } from '../../firebase/config'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { ArrowLeft, Users, ClipboardList, BarChart2, FileText, Upload } from 'lucide-react'

export default function TeacherCourseDetail() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const cSnap = await getDoc(doc(db,'courses',courseId))
        if (cSnap.exists()) {
          const cData = { id: cSnap.id, ...cSnap.data() }
          setCourse(cData)
          if (cData.programId && cData.semester) {
            const sSnap = await getDocs(query(
              collection(db,'users'),
              where('programId','==',cData.programId),
              where('role','==','student'),
              where('currentSemester','==',cData.semester)
            ))
            setStudents(sSnap.docs.map(d=>({id:d.id,...d.data()})))
          }
        }
      } catch {} finally { setLoading(false) }
    }
    fetch()
  }, [courseId])

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-[#1a2e4a]/20 border-t-[#1a2e4a] rounded-full animate-spin"/></div>
  if (!course) return <div className="card text-center text-gray-500 py-12">Course not found.</div>

  const actions = [
    { to: '/teacher/attendance', label: 'Mark Attendance', icon: ClipboardList, color: 'bg-green-500', state: { courseId, courseName: course.name } },
    { to: '/teacher/marks', label: 'Enter Marks', icon: BarChart2, color: 'bg-blue-500', state: { courseId, courseName: course.name } },
    { to: '/teacher/assignments', label: 'Add Assignment', icon: FileText, color: 'bg-purple-500', state: { courseId, courseName: course.name } },
    { to: '/teacher/materials', label: 'Upload Material', icon: Upload, color: 'bg-orange-500', state: { courseId, courseName: course.name } },
  ]

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <Link to="/teacher/courses" className="flex items-center gap-2 text-[#1a2e4a] text-sm font-medium hover:underline">
        <ArrowLeft className="w-4 h-4"/>Back to Courses
      </Link>

      <div className="bg-[#1a2e4a] rounded-2xl p-6 text-white">
        <p className="text-blue-300 text-sm">{course.courseCode}</p>
        <h1 className="text-2xl font-bold mt-1" style={{fontFamily:'Outfit,sans-serif'}}>{course.name}</h1>
        <div className="flex flex-wrap gap-3 mt-3 text-blue-200 text-sm">
          <span>{course.creditHours||3} Credit Hours</span>
          <span>·</span><span>Semester {course.semester}</span>
          <span>·</span><span>{course.programName||'N/A'}</span>
          <span>·</span><span>Batch {course.batch||'N/A'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map(a=>(
          <Link key={a.label} to={a.to} state={a.state}
            className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center gap-2 text-center hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className={`w-10 h-10 ${a.color} rounded-xl flex items-center justify-center`}>
              <a.icon className="w-5 h-5 text-white"/>
            </div>
            <p className="text-xs font-semibold text-gray-700">{a.label}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800" style={{fontFamily:'Outfit,sans-serif'}}>Enrolled Students</h3>
          <span className="badge-blue">{students.length}</span>
        </div>
        {students.length === 0 ? (
          <div className="p-8 text-center"><Users className="w-10 h-10 text-gray-200 mx-auto mb-2"/><p className="text-gray-400 text-sm">No students enrolled in this course yet.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="table-header">S.No</th>
                <th className="table-header">Roll No</th>
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Batch</th>
              </tr></thead>
              <tbody>
                {students.map((s,i)=>(
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="table-cell text-xs">{i+1}</td>
                    <td className="table-cell font-mono text-xs font-semibold text-[#1a2e4a]">{s.rollNumber||'-'}</td>
                    <td className="table-cell font-medium text-sm">{s.name}</td>
                    <td className="table-cell text-xs text-gray-500">{s.email}</td>
                    <td className="table-cell text-xs">{s.batch||'-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
