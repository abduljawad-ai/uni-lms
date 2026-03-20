// src/pages/teacher/Attendance.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase/config'
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { ClipboardList, CheckCircle, XCircle, Minus, Save, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'

export default function TeacherAttendance() {
  const { userProfile } = useAuth()
  const location = useLocation()
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(location.state?.courseId || '')
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      if (!userProfile?.uid) return
      const snap = await getDocs(query(collection(db,'courses'), where('teacherId','==',userProfile.uid)))
      setCourses(snap.docs.map(d=>({id:d.id,...d.data()})))
    }
    fetch()
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
        sList.forEach(s=>{ init[s.id] = 'present' })
        setAttendance(init)
      } catch {} finally { setLoading(false) }
    }
    fetchStudents()
  }, [selectedCourse, courses])

  const setStatus = (sid, status) => setAttendance(p=>({...p,[sid]:status}))
  const markAll = (status) => {
    const a = {}
    students.forEach(s=>{ a[s.id] = status })
    setAttendance(a)
  }

  const handleSave = async () => {
    if (!selectedCourse || students.length === 0) return toast.error('Select a course with students')
    setSaving(true)
    try {
      const course = courses.find(c=>c.id===selectedCourse)
      const batch = await Promise.all(students.map(async s => {
        const docId = `${selectedCourse}_${s.id}_${date}`
        await setDoc(doc(db,'attendance',docId), {
          courseId: selectedCourse,
          courseName: course?.name || '',
          courseCode: course?.courseCode || '',
          studentId: s.id,
          studentName: s.name,
          rollNumber: s.rollNumber || '',
          teacherId: userProfile.uid,
          status: attendance[s.id] || 'absent',
          date: new Date(date),
          dateStr: date,
          createdAt: serverTimestamp(),
        }, { merge: true })
      }))
      toast.success(`Attendance saved for ${students.length} students!`)
    } catch (e) {
      console.error(e)
      toast.error('Failed to save attendance')
    } finally { setSaving(false) }
  }

  const present = Object.values(attendance).filter(v=>v==='present').length
  const absent = Object.values(attendance).filter(v=>v==='absent').length
  const leave = Object.values(attendance).filter(v=>v==='leave').length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#1a2e4a] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-blue-300"/>
          <div>
            <h1 className="text-xl font-bold" style={{fontFamily:'Outfit,sans-serif'}}>Mark Attendance</h1>
            <p className="text-blue-200 text-sm">Record student attendance for a class</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Select Course</label>
            <select value={selectedCourse} onChange={e=>setSelectedCourse(e.target.value)} className="input-field">
              <option value="">-- Select Course --</option>
              {courses.map(c=><option key={c.id} value={c.id}>{c.name} ({c.courseCode})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="input-field"/>
          </div>
        </div>
      </div>

      {selectedCourse && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Present', value: present, color: 'bg-green-50 text-green-600' },
              { label: 'Absent', value: absent, color: 'bg-red-50 text-red-600' },
              { label: 'Leave', value: leave, color: 'bg-yellow-50 text-yellow-600' },
            ].map(s=>(
              <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-3">
              <h3 className="font-bold text-gray-800" style={{fontFamily:'Outfit,sans-serif'}}>
                Students ({students.length})
              </h3>
              <div className="flex gap-2 flex-wrap">
                <button onClick={()=>markAll('present')} className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition-all">
                  <CheckCircle className="w-3.5 h-3.5"/>All Present
                </button>
                <button onClick={()=>markAll('absent')} className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200 transition-all">
                  <XCircle className="w-3.5 h-3.5"/>All Absent
                </button>
              </div>
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
                    <th className="table-header">Student Name</th>
                    <th className="table-header text-center">Present</th>
                    <th className="table-header text-center">Absent</th>
                    <th className="table-header text-center">Leave</th>
                  </tr></thead>
                  <tbody>
                    {students.map((s,i)=>(
                      <tr key={s.id} className={`hover:bg-gray-50 ${attendance[s.id]==='absent'?'bg-red-50/30':attendance[s.id]==='leave'?'bg-yellow-50/30':''}`}>
                        <td className="table-cell text-xs">{i+1}</td>
                        <td className="table-cell font-mono text-xs font-semibold text-[#1a2e4a]">{s.rollNumber||'-'}</td>
                        <td className="table-cell font-medium text-sm">{s.name}</td>
                        {['present','absent','leave'].map(status=>(
                          <td key={status} className="table-cell text-center">
                            <button onClick={()=>setStatus(s.id,status)}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mx-auto transition-all ${
                                attendance[s.id]===status
                                  ? status==='present' ? 'bg-green-500 border-green-500' : status==='absent' ? 'bg-red-500 border-red-500' : 'bg-yellow-500 border-yellow-500'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}>
                              {attendance[s.id]===status && <div className="w-2 h-2 bg-white rounded-full"/>}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {students.length > 0 && (
              <div className="px-5 py-4 border-t border-gray-100">
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save className="w-4 h-4"/>}
                  {saving ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
