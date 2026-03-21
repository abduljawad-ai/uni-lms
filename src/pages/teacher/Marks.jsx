
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase/config'
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { BarChart2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'

const EXAM_TYPES = ['Regular','Improvement','Failure']
const SEMESTERS = ['First Semester','Second Semester','Third Semester','Fourth Semester','Fifth Semester','Sixth Semester','Seventh Semester','Eighth Semester']

const calcGrade = (obtained, total) => {
  const pct = (obtained / total) * 100
  if (pct >= 90) return { grade: 'A+', qp: 4.0 }
  if (pct >= 80) return { grade: 'A', qp: 4.0 }
  if (pct >= 75) return { grade: 'B+', qp: 3.5 }
  if (pct >= 70) return { grade: 'B', qp: 3.0 }
  if (pct >= 65) return { grade: 'C+', qp: 2.5 }
  if (pct >= 60) return { grade: 'C', qp: 2.0 }
  if (pct >= 50) return { grade: 'D', qp: 1.0 }
  return { grade: 'F', qp: 0.0 }
}

export default function TeacherMarks() {
  const { userProfile } = useAuth()
  const location = useLocation()
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(location.state?.courseId || '')
  const [examType, setExamType] = useState('Regular')
  const [examYear, setExamYear] = useState(new Date().getFullYear().toString())
  const [semester, setSemester] = useState('First Semester')
  const [students, setStudents] = useState([])
  const [marks, setMarks] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(query(collection(db,'courses'), where('teacherId','==',userProfile.uid)))
      const list = snap.docs.map(d=>({id:d.id,...d.data()}))
      setCourses(list)
    }
    if (userProfile?.uid) fetch()
  }, [userProfile])

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedCourse) return
      setLoading(true)
      try {
        const c = courses.find(x=>x.id===selectedCourse)
        if (!c) return
        const snap = await getDocs(query(
          collection(db,'users'),
          where('programId','==',c.programId||''),
          where('role','==','student'),
          where('currentSemester','==',c.semester)
        ))
        const sList = snap.docs.map(d=>({id:d.id,...d.data()}))
        setStudents(sList)
        const init = {}
        sList.forEach(s=>{
          init[s.id] = { attendance: '', assignment: '', mid: '', final: '' }
        })
        setMarks(init)
      } catch {} finally { setLoading(false) }
    }
    fetchStudents()
  }, [selectedCourse, courses])

  const setMark = (sid, field, value) => {
    setMarks(p=>({...p,[sid]:{...p[sid],[field]:value}}))
  }

  const handleSave = async () => {
    if (!selectedCourse || students.length===0) return toast.error('No students loaded')
    setSaving(true)
    try {
      const course = courses.find(c=>c.id===selectedCourse)
      await Promise.all(students.map(async s => {
        const m = marks[s.id] || {}
        const att = parseFloat(m.attendance)||0
        const ass = parseFloat(m.assignment)||0
        const mid = parseFloat(m.mid)||0
        const fin = parseFloat(m.final)||0
        const obtained = att + ass + mid + fin
        const total = 10 + 10 + 30 + 50
        const { grade, qp } = calcGrade(obtained, total)
        const remarks = obtained >= 50 ? 'pass' : 'fail'
        const docId = `${selectedCourse}_${s.id}_${examYear}_${examType}`
        await setDoc(doc(db,'results',docId), {
          courseId: selectedCourse,
          courseCode: course?.courseCode || '',
          courseName: course?.name || '',
          studentId: s.id,
          studentName: s.name,
          rollNumber: s.rollNumber || '',
          teacherId: userProfile.uid,
          semester,
          examYear,
          examType,
          attendanceMarks: att,
          assignmentMarks: ass,
          midMarks: mid,
          finalMarks: fin,
          obtainedMarks: obtained,
          totalMarks: total,
          grade,
          qualityPoints: qp,
          remarks,
          updatedAt: serverTimestamp(),
        }, { merge: true })
      }))
      toast.success(`Marks saved for ${students.length} students!`)
    } catch (e) {
      console.error(e)
      toast.error('Failed to save marks')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#1a2e4a] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <BarChart2 className="w-6 h-6 text-blue-300"/>
          <div>
            <h1 className="text-xl font-bold" style={{fontFamily:'Outfit,sans-serif'}}>Enter Marks</h1>
            <p className="text-blue-200 text-sm">Record marks: Attendance(10) + Assignment(10) + Mid(30) + Final(50)</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label">Select Course</label>
            <select value={selectedCourse} onChange={e=>setSelectedCourse(e.target.value)} className="input-field">
              <option value="">-- Select --</option>
              {courses.map(c=><option key={c.id} value={c.id}>{c.name} ({c.courseCode})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Semester</label>
            <select value={semester} onChange={e=>setSemester(e.target.value)} className="input-field">
              {SEMESTERS.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Exam Year</label>
            <input type="text" value={examYear} onChange={e=>setExamYear(e.target.value)} className="input-field" placeholder="2025"/>
          </div>
          <div>
            <label className="label">Exam Type</label>
            <select value={examType} onChange={e=>setExamType(e.target.value)} className="input-field">
              {EXAM_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {selectedCourse && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-[#1a2e4a] px-5 py-3">
            <h3 className="text-white font-bold" style={{fontFamily:'Outfit,sans-serif'}}>
              Student Marks Entry — {courses.find(c=>c.id===selectedCourse)?.name}
            </h3>
          </div>
          {loading ? (
            <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-[#1a2e4a]/20 border-t-[#1a2e4a] rounded-full animate-spin mx-auto"/></div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No students found for this course.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr>
                  <th className="table-header">S.No</th>
                  <th className="table-header">Roll No</th>
                  <th className="table-header">Name</th>
                  <th className="table-header text-center">Atten.<br/><span className="font-normal">/10</span></th>
                  <th className="table-header text-center">Assign.<br/><span className="font-normal">/10</span></th>
                  <th className="table-header text-center">Mid<br/><span className="font-normal">/30</span></th>
                  <th className="table-header text-center">Final<br/><span className="font-normal">/50</span></th>
                  <th className="table-header text-center">Total</th>
                  <th className="table-header text-center">Grade</th>
                </tr></thead>
                <tbody>
                  {students.map((s,i)=>{
                    const m = marks[s.id]||{}
                    const att=parseFloat(m.attendance)||0, ass=parseFloat(m.assignment)||0
                    const mid=parseFloat(m.mid)||0, fin=parseFloat(m.final)||0
                    const total=att+ass+mid+fin
                    const {grade}=calcGrade(total,100)
                    return (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="table-cell text-xs">{i+1}</td>
                        <td className="table-cell font-mono text-xs font-semibold">{s.rollNumber||'-'}</td>
                        <td className="table-cell font-medium text-sm">{s.name}</td>
                        {['attendance','assignment','mid','final'].map(f=>(
                          <td key={f} className="table-cell text-center">
                            <input type="number" value={m[f]||''} onChange={e=>setMark(s.id,f,e.target.value)}
                              className="w-14 text-center border border-gray-200 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]"
                              min="0" max={f==='attendance'?10:f==='assignment'?10:f==='mid'?30:50}/>
                          </td>
                        ))}
                        <td className="table-cell text-center font-bold text-sm">{total||'-'}</td>
                        <td className={`table-cell text-center font-bold text-sm ${total>=50?'text-green-600':'text-red-600'}`}>{total>0?grade:'-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          {students.length>0 && (
            <div className="px-5 py-4 border-t border-gray-100">
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<Save className="w-4 h-4"/>}
                {saving?'Saving...':'Save All Marks'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
