
import { useEffect, useState } from 'react'
import { db } from '../../firebase/config'
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { UserCheck, Search, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminTeachers() {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(query(collection(db,'users'), where('role','==','teacher')))
        setTeachers(snap.docs.map(d=>({id:d.id,...d.data()})))
      } catch {} finally { setLoading(false) }
    }
    fetch()
  }, [])

  const handleApprove = async (uid) => {
    await updateDoc(doc(db,'users',uid), { isApproved: true })
    setTeachers(p=>p.map(t=>t.id===uid?{...t,isApproved:true}:t))
    toast.success('Teacher approved! They can now login.')
  }

  const handleRevoke = async (uid) => {
    if (!confirm('Revoke this teacher\'s access?')) return
    await updateDoc(doc(db,'users',uid), { isApproved: false })
    setTeachers(p=>p.map(t=>t.id===uid?{...t,isApproved:false}:t))
    toast.success('Access revoked')
  }

  const handleDelete = async (uid) => {
    if (!confirm('Delete this teacher account?')) return
    await deleteDoc(doc(db,'users',uid))
    setTeachers(p=>p.filter(t=>t.id!==uid))
    toast.success('Teacher removed')
  }

  const filtered = teachers.filter(t =>
    !search || t.name?.toLowerCase().includes(search.toLowerCase()) || t.email?.toLowerCase().includes(search.toLowerCase())
  )

  const pending = teachers.filter(t=>!t.isApproved).length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1f35]" style={{fontFamily:'Outfit,sans-serif'}}>Teachers</h1>
          <p className="text-gray-500 text-sm">{teachers.length} registered teachers</p>
        </div>
        {pending > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-amber-800 text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4"/>{pending} pending approval
          </div>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search teachers..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0d1f35] text-sm bg-white"/>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-[#0d1f35]/20 border-t-[#0d1f35] rounded-full animate-spin mx-auto"/></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center"><UserCheck className="w-12 h-12 text-gray-200 mx-auto mb-3"/><p className="text-gray-500 text-sm">No teachers found.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Phone</th>
                <th className="table-header">Designation</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map(t=>(
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#0d1f35] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">{t.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}</span>
                        </div>
                        <span className="font-medium text-sm">{t.name}</span>
                      </div>
                    </td>
                    <td className="table-cell text-xs text-gray-500">{t.email}</td>
                    <td className="table-cell text-xs">{t.phone||'-'}</td>
                    <td className="table-cell text-xs">{t.designation||'Lecturer'}</td>
                    <td className="table-cell">
                      {t.isApproved
                        ? <span className="badge-green flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3"/>Approved</span>
                        : <span className="badge-yellow flex items-center gap-1 w-fit"><Clock className="w-3 h-3"/>Pending</span>}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        {!t.isApproved ? (
                          <button onClick={()=>handleApprove(t.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition-all">
                            <CheckCircle className="w-3 h-3"/>Approve
                          </button>
                        ) : (
                          <button onClick={()=>handleRevoke(t.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold hover:bg-orange-200 transition-all">
                            <XCircle className="w-3 h-3"/>Revoke
                          </button>
                        )}
                        <button onClick={()=>handleDelete(t.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all ml-1">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </div>
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
