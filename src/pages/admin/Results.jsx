// src/pages/admin/Results.jsx
import { useEffect, useState } from 'react'
import { db } from '../../firebase/config'
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'
import { BarChart2, Search, CheckCircle, XCircle, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

const SEMESTERS = ['First Semester','Second Semester','Third Semester','Fourth Semester','Fifth Semester','Sixth Semester','Seventh Semester','Eighth Semester']
const YEARS = ['2022','2023','2024','2025','2026']
const EXAM_TYPES = ['Regular','Improvement','Failure']

export default function AdminResults() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [filters, setFilters] = useState({ semester:'First Semester', examYear:'2025', examType:'Regular' })
  const [search, setSearch] = useState('')

  const setF = (k,v) => setFilters(p=>({...p,[k]:v}))

  const fetchResults = async () => {
    setLoading(true); setSearched(true)
    try {
      const snap = await getDocs(query(
        collection(db,'results'),
        where('semester','==',filters.semester),
        where('examYear','==',filters.examYear),
        where('examType','==',filters.examType)
      ))
      setResults(snap.docs.map(d=>({id:d.id,...d.data()})))
    } catch (e) { console.error(e); toast.error('Failed to fetch') } finally { setLoading(false) }
  }

  const togglePublish = async (r) => {
    const newVal = !r.published
    await updateDoc(doc(db,'results',r.id), { published: newVal })
    setResults(p=>p.map(x=>x.id===r.id?{...x,published:newVal}:x))
    toast.success(newVal ? 'Result published to students' : 'Result hidden from students')
  }

  const filtered = results.filter(r =>
    !search || r.studentName?.toLowerCase().includes(search.toLowerCase()) || r.rollNumber?.toLowerCase().includes(search.toLowerCase())
  )

  const gradeColor = (g) => {
    if (!g) return 'text-gray-400'
    if (g.startsWith('A')) return 'text-green-600 font-bold'
    if (g.startsWith('B')) return 'text-blue-600 font-bold'
    if (g.startsWith('C')) return 'text-yellow-600 font-bold'
    return 'text-red-600 font-bold'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#0d1f35]" style={{fontFamily:'Outfit,sans-serif'}}>Results Management</h1>
        <p className="text-gray-500 text-sm">View, verify and publish exam results to students</p>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="label">Semester</label>
            <select value={filters.semester} onChange={e=>setF('semester',e.target.value)} className="input-field">
              {SEMESTERS.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Exam Year</label>
            <select value={filters.examYear} onChange={e=>setF('examYear',e.target.value)} className="input-field">
              {YEARS.map(y=><option key={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Exam Type</label>
            <select value={filters.examType} onChange={e=>setF('examType',e.target.value)} className="input-field">
              {EXAM_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <button onClick={fetchResults} disabled={loading} className="btn-primary">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <BarChart2 className="w-4 h-4"/>}
          {loading ? 'Loading...' : 'Fetch Results'}
        </button>
      </div>

      {searched && !loading && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or roll no..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0d1f35] text-sm bg-white"/>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-8 text-center">
                <BarChart2 className="w-12 h-12 text-gray-200 mx-auto mb-3"/>
                <p className="text-gray-500 text-sm">No results found for selected filters.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-600">{filtered.length} records found</p>
                  <button
                    onClick={async () => {
                      for (const r of filtered) {
                        await updateDoc(doc(db,'results',r.id), { published: true })
                      }
                      setResults(p=>p.map(r=>({...r, published:true})))
                      toast.success(`Published ${filtered.length} results!`)
                    }}
                    className="text-xs font-semibold text-green-700 bg-green-100 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-all">
                    Publish All
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr>
                      <th className="table-header">Roll No</th>
                      <th className="table-header">Student</th>
                      <th className="table-header">Course</th>
                      <th className="table-header text-center">Atten.</th>
                      <th className="table-header text-center">Assign.</th>
                      <th className="table-header text-center">Mid</th>
                      <th className="table-header text-center">Final</th>
                      <th className="table-header text-center">Total</th>
                      <th className="table-header text-center">Grade</th>
                      <th className="table-header text-center">Remarks</th>
                      <th className="table-header text-center">Published</th>
                    </tr></thead>
                    <tbody>
                      {filtered.map(r=>(
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="table-cell font-mono text-xs font-bold text-[#0d1f35]">{r.rollNumber||'-'}</td>
                          <td className="table-cell font-medium text-sm">{r.studentName}</td>
                          <td className="table-cell text-xs">{r.courseName} <span className="text-gray-400">({r.courseCode})</span></td>
                          <td className="table-cell text-center text-xs">{r.attendanceMarks??'-'}</td>
                          <td className="table-cell text-center text-xs">{r.assignmentMarks??'-'}</td>
                          <td className="table-cell text-center text-xs">{r.midMarks??'-'}</td>
                          <td className="table-cell text-center text-xs">{r.finalMarks??'-'}</td>
                          <td className="table-cell text-center font-bold text-sm">{r.obtainedMarks??'-'}</td>
                          <td className={`table-cell text-center text-sm ${gradeColor(r.grade)}`}>{r.grade||'-'}</td>
                          <td className="table-cell text-center">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.remarks==='pass'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
                              {r.remarks?.toUpperCase()||'-'}
                            </span>
                          </td>
                          <td className="table-cell text-center">
                            <button onClick={()=>togglePublish(r)}
                              className={`p-1.5 rounded-lg transition-all ${r.published?'text-green-500 hover:bg-green-50':'text-gray-300 hover:bg-gray-100'}`}>
                              {r.published ? <CheckCircle className="w-4 h-4"/> : <XCircle className="w-4 h-4"/>}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
