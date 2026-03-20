// src/pages/admin/Students.jsx
import { useEffect, useState } from 'react'
import { db } from '../../firebase/config'
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { Users, Search, Trash2, Edit, ChevronDown, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(query(collection(db,'users'), where('role','==','student')))
        setStudents(snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.name?.localeCompare(b.name)))
      } catch {} finally { setLoading(false) }
    }
    fetch()
  }, [])

  const handleSemesterChange = async (uid, sem) => {
    await updateDoc(doc(db,'users',uid), { currentSemester: parseInt(sem) })
    setStudents(p=>p.map(s=>s.id===uid?{...s,currentSemester:parseInt(sem)}:s))
    toast.success('Semester updated')
  }

  const handleDelete = async (uid) => {
    if (!confirm('Delete this student? This cannot be undone.')) return
    await deleteDoc(doc(db,'users',uid))
    setStudents(p=>p.filter(s=>s.id!==uid))
    toast.success('Student removed')
  }

  const filtered = students.filter(s => {
    const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase()) || s.rollNumber?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter==='all' || (filter==='enrolled' && s.isEnrolled) || (filter==='not-enrolled' && !s.isEnrolled)
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1f35]" style={{fontFamily:'Outfit,sans-serif'}}>Students</h1>
          <p className="text-gray-500 text-sm">{students.length} registered students</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, email, roll no..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0d1f35] text-sm bg-white"/>
        </div>
        <select value={filter} onChange={e=>setFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0d1f35] text-sm bg-white">
          <option value="all">All Students</option>
          <option value="enrolled">Enrolled</option>
          <option value="not-enrolled">Not Enrolled</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-[#0d1f35]/20 border-t-[#0d1f35] rounded-full animate-spin mx-auto"/></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center"><Users className="w-12 h-12 text-gray-200 mx-auto mb-3"/><p className="text-gray-500 text-sm">No students found.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="table-header">S.No</th>
                <th className="table-header">Roll No</th>
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Program</th>
                <th className="table-header">Batch</th>
                <th className="table-header">Semester</th>
                <th className="table-header">Enrolled</th>
                <th className="table-header">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map((s,i)=>(
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="table-cell text-xs">{i+1}</td>
                    <td className="table-cell font-mono text-xs font-bold text-[#0d1f35]">{s.rollNumber||'-'}</td>
                    <td className="table-cell font-semibold text-sm">{s.name}</td>
                    <td className="table-cell text-xs text-gray-500">{s.email}</td>
                    <td className="table-cell text-xs">{s.program||'-'}</td>
                    <td className="table-cell text-xs">{s.batch||'-'}</td>
                    <td className="table-cell">
                      <select value={s.currentSemester||1} onChange={e=>handleSemesterChange(s.id,e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#0d1f35]">
                        {[1,2,3,4,5,6,7,8].map(n=><option key={n} value={n}>{n}</option>)}
                      </select>
                    </td>
                    <td className="table-cell">
                      {s.isEnrolled
                        ? <CheckCircle className="w-4 h-4 text-green-500"/>
                        : <XCircle className="w-4 h-4 text-red-400"/>}
                    </td>
                    <td className="table-cell">
                      <button onClick={()=>handleDelete(s.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </td>
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
