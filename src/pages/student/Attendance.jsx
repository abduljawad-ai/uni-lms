// src/pages/student/Attendance.jsx - Updated with semester selector
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase/config'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { ClipboardList, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'

const SEMESTERS = [
  'First Semester','Second Semester','Third Semester','Fourth Semester',
  'Fifth Semester','Sixth Semester','Seventh Semester','Eighth Semester',
  'Ninth Semester','Tenth Semester'
]

export default function StudentAttendance() {
  const { userProfile } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [grouped, setGrouped] = useState({})
  const [selectedSem, setSelectedSem] = useState('')
  const [searched, setSearched] = useState(false)

  const fetchAttendance = async () => {
    if (!userProfile?.uid) return
    setLoading(true)
    setSearched(true)
    try {
      const snap = await getDocs(query(
        collection(db, 'attendance'),
        where('studentId', '==', userProfile.uid)
      ))
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setRecords(data)
      const g = {}
      data.forEach(r => {
        const key = r.courseName || r.courseCode || r.courseId
        if (!g[key]) g[key] = []
        g[key].push(r)
      })
      setGrouped(g)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  if (!userProfile?.isEnrolled) return (
    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
      <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
      <p className="text-gray-600 text-sm mb-4">Please enroll in a program first.</p>
      <Link to="/student/enrollment" className="btn-primary inline-flex">Enroll Now</Link>
    </div>
  )

  const totalPresent = records.filter(r => r.status === 'present').length
  const totalAbsent = records.filter(r => r.status === 'absent').length
  const totalLeave = records.filter(r => r.status === 'leave').length
  const total = records.length
  const percentage = total > 0 ? Math.round((totalPresent / total) * 100) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-[#1e3a5f] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-blue-300" />
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit,sans-serif' }}>Your Semester Attendance</h1>
            <p className="text-blue-200 text-sm">{userProfile.program} · Roll No: {userProfile.rollNumber}</p>
          </div>
        </div>
      </div>

      {/* Semester Selector */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <label className="label">Select Semester</label>
        <select value={selectedSem} onChange={e => setSelectedSem(e.target.value)} className="input-field max-w-md">
          <option value="">Select</option>
          {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={fetchAttendance} disabled={!selectedSem || loading}
          className="btn-primary mt-4 disabled:opacity-50">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ClipboardList className="w-4 h-4" />}
          {loading ? 'Loading...' : 'View Attendance'}
        </button>
      </div>

      {/* Results */}
      {searched && !loading && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Overall %', value: `${percentage}%`, icon: TrendingUp, color: percentage >= 75 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600', bg: percentage >= 75 ? 'bg-green-50' : 'bg-red-50' },
              { label: 'Present', value: totalPresent, icon: CheckCircle, color: 'bg-green-100 text-green-600', bg: 'bg-green-50' },
              { label: 'Absent', value: totalAbsent, icon: XCircle, color: 'bg-red-100 text-red-600', bg: 'bg-red-50' },
              { label: 'Leave', value: totalLeave, icon: AlertCircle, color: 'bg-yellow-100 text-yellow-600', bg: 'bg-yellow-50' },
            ].map((s, i) => (
              <div key={i} className={`${s.bg} rounded-2xl p-4 border border-gray-100`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">{s.label}</span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              </div>
            ))}
          </div>

          {percentage < 75 && total > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">
              ⚠️ <strong>Warning:</strong> Your attendance is below 75%. You may be disallowed from sitting the exam.
            </div>
          )}

          {total === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
              <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <h3 className="font-bold text-gray-700 mb-1">No Records Found</h3>
              <p className="text-gray-500 text-sm">No attendance records found for {selectedSem}.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([courseName, courseRecords]) => {
                const p = courseRecords.filter(r => r.status === 'present').length
                const pct = Math.round((p / courseRecords.length) * 100)
                return (
                  <div key={courseName} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm">{courseName}</h3>
                        <p className="text-xs text-gray-400">{courseRecords.length} classes</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${pct >= 75 ? 'text-green-600' : 'text-red-600'}`}>{pct}%</p>
                        <p className="text-xs text-gray-400">{p}/{courseRecords.length} present</p>
                      </div>
                    </div>
                    <div className="px-5 py-2">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${pct >= 75 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead><tr>
                          <th className="table-header">Date</th>
                          <th className="table-header">Status</th>
                          <th className="table-header">Remarks</th>
                        </tr></thead>
                        <tbody>
                          {courseRecords.slice(-10).reverse().map(r => (
                            <tr key={r.id} className="hover:bg-gray-50">
                              <td className="table-cell text-xs">
                                {r.dateStr || (r.date ? new Date(r.date.toDate?.() || r.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '-')}
                              </td>
                              <td className="table-cell">
                                {r.status === 'present' ? <span className="badge-green text-xs">Present</span>
                                  : r.status === 'leave' ? <span className="badge-yellow text-xs">Leave</span>
                                  : <span className="badge-red text-xs">Absent</span>}
                              </td>
                              <td className="table-cell text-xs text-gray-400">{r.remarks || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
