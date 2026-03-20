// src/pages/admin/Enrollments.jsx
import { useEffect, useState } from 'react'
import { db } from '../../firebase/config'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { ClipboardList, Search } from 'lucide-react'

export default function AdminEnrollments() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(query(collection(db,'users'), where('role','==','student'), where('isEnrolled','==',true)))
        setStudents(snap.docs.map(d=>({id:d.id,...d.data()})))
      } catch {} finally { setLoading(false) }
    }
    fetch()
  }, [])

  const filtered = students.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.rollNumber?.toLowerCase().includes(search.toLowerCase()) || s.program?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#0d1f35]" style={{fontFamily:'Outfit,sans-serif'}}>Enrollments</h1>
        <p className="text-gray-500 text-sm">{students.length} enrolled students</p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search enrolled students..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0d1f35] text-sm bg-white"/>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-[#0d1f35]/20 border-t-[#0d1f35] rounded-full animate-spin mx-auto"/></div>
        : filtered.length === 0 ? <div className="p-8 text-center text-gray-500 text-sm">No enrollments found.</div>
        : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="table-header">Roll No</th>
                <th className="table-header">Name</th>
                <th className="table-header">Program</th>
                <th className="table-header">Department</th>
                <th className="table-header">Batch</th>
                <th className="table-header">Semester</th>
              </tr></thead>
              <tbody>
                {filtered.map(s=>(
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="table-cell font-mono text-xs font-bold text-[#0d1f35]">{s.rollNumber||'-'}</td>
                    <td className="table-cell font-medium text-sm">{s.name}</td>
                    <td className="table-cell text-xs">{s.program||'-'}</td>
                    <td className="table-cell text-xs">{s.department||'-'}</td>
                    <td className="table-cell text-xs">{s.batch||'-'}</td>
                    <td className="table-cell text-center"><span className="badge-blue">Sem {s.currentSemester||1}</span></td>
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
