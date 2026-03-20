// src/pages/student/Results.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase/config'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { BarChart2, AlertCircle, TrendingUp, Award, Download } from 'lucide-react'
import { Link } from 'react-router-dom'

const SEMESTERS = ['First Semester','Second Semester','Third Semester','Fourth Semester','Fifth Semester','Sixth Semester','Seventh Semester','Eighth Semester']
const YEARS = ['2022','2023','2024','2025','2026']
const EXAM_TYPES = ['Regular','Improvement','Failure']

export default function StudentResults() {
  const { userProfile } = useAuth()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedSem, setSelectedSem] = useState('First Semester')
  const [selectedYear, setSelectedYear] = useState('2025')
  const [selectedType, setSelectedType] = useState('Regular')
  const [searched, setSearched] = useState(false)

  const fetchResults = async () => {
    if (!userProfile?.uid) return
    setLoading(true)
    setSearched(true)
    try {
      const snap = await getDocs(query(
        collection(db, 'results'),
        where('studentId', '==', userProfile.uid),
        where('semester', '==', selectedSem),
        where('examYear', '==', selectedYear),
        where('examType', '==', selectedType)
      ))
      setResults(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const getGradeColor = (grade) => {
    if (!grade) return 'text-gray-500'
    if (grade.startsWith('A')) return 'text-green-600 font-bold'
    if (grade.startsWith('B')) return 'text-blue-600 font-bold'
    if (grade.startsWith('C')) return 'text-yellow-600 font-bold'
    return 'text-red-600 font-bold'
  }

  const totalObtained = results.reduce((s,r) => s + (r.obtainedMarks||0), 0)
  const totalMarks = results.reduce((s,r) => s + (r.totalMarks||100), 0)
  const percentage = totalMarks > 0 ? Math.round((totalObtained/totalMarks)*100) : 0

  if (!userProfile?.isEnrolled) return (
    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
      <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3"/>
      <p className="text-gray-600 text-sm mb-4">Please enroll in a program first.</p>
      <Link to="/student/enrollment" className="btn-primary inline-flex">Enroll Now</Link>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#1e3a5f]" style={{fontFamily:'Outfit,sans-serif'}}>Semester Examination Result Notice Board</h1>
        <p className="text-red-500 text-xs mt-1">This is a digital notice board for display of department result only for students' information. It is not an officially announced result by controller office.</p>
      </div>

      {/* Filter Panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="label">Select Semester</label>
            <select value={selectedSem} onChange={e=>setSelectedSem(e.target.value)} className="input-field">
              {SEMESTERS.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Exam Year</label>
            <select value={selectedYear} onChange={e=>setSelectedYear(e.target.value)} className="input-field">
              {YEARS.map(y=><option key={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Exam Type</label>
            <select value={selectedType} onChange={e=>setSelectedType(e.target.value)} className="input-field">
              {EXAM_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <button onClick={fetchResults} disabled={loading}
          className="btn-primary">
          {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Fetching...</> : <><BarChart2 className="w-4 h-4"/>View Result</>}
        </button>
      </div>

      {/* Results Table */}
      {searched && !loading && (
        results.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <BarChart2 className="w-12 h-12 text-gray-200 mx-auto mb-3"/>
            <h3 className="font-bold text-gray-700 mb-1">No Results Found</h3>
            <p className="text-gray-500 text-sm">No results for the selected semester, year, and type.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header Info */}
            <div className="bg-blue-50 border-b border-blue-100 p-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                {[
                  ['Roll No', userProfile.rollNumber || 'N/A'],
                  ['Exam Year', selectedYear],
                  ['Exam Type', selectedType.toUpperCase()],
                  ['Semester', selectedSem],
                  ['Report Date', new Date().toLocaleDateString('en-PK',{day:'numeric',month:'short',year:'numeric'})],
                ].map(([k,v]) => (
                  <div key={k}>
                    <p className="text-blue-500 text-xs font-medium">{k}</p>
                    <p className="font-bold text-blue-900">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 border-b border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#1e3a5f]">{percentage}%</p>
                <p className="text-xs text-gray-500">Overall Percentage</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-700">{totalObtained}/{totalMarks}</p>
                <p className="text-xs text-gray-500">Marks Obtained</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${results.every(r=>r.remarks==='pass')?'text-green-600':'text-red-600'}`}>
                  {results.every(r=>r.remarks==='pass')?'PASS':'FAIL'}
                </p>
                <p className="text-xs text-gray-500">Overall Status</p>
              </div>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr>
                  <th className="table-header">Course No</th>
                  <th className="table-header">Subject</th>
                  <th className="table-header text-center">Atten.</th>
                  <th className="table-header text-center">Assign.</th>
                  <th className="table-header text-center">Mid</th>
                  <th className="table-header text-center">Final</th>
                  <th className="table-header text-center">Obtained</th>
                  <th className="table-header text-center">Grade</th>
                  <th className="table-header text-center">QP</th>
                  <th className="table-header text-center">Remarks</th>
                </tr></thead>
                <tbody>
                  {results.map(r=>(
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="table-cell font-mono text-xs font-semibold">{r.courseCode||'-'}</td>
                      <td className="table-cell font-medium text-xs">{r.courseName||'-'}</td>
                      <td className="table-cell text-center text-xs">{r.attendanceMarks??'-'}</td>
                      <td className="table-cell text-center text-xs">{r.assignmentMarks??'-'}</td>
                      <td className="table-cell text-center text-xs">{r.midMarks??'-'}</td>
                      <td className="table-cell text-center text-xs">{r.finalMarks??'-'}</td>
                      <td className="table-cell text-center font-semibold text-xs">{r.obtainedMarks??'-'}</td>
                      <td className={`table-cell text-center text-xs ${getGradeColor(r.grade)}`}>{r.grade||'-'}</td>
                      <td className="table-cell text-center text-xs">{r.qualityPoints??'-'}</td>
                      <td className="table-cell text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.remarks==='pass'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
                          {r.remarks?.toUpperCase()||'-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  )
}
