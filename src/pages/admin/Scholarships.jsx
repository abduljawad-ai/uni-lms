// src/pages/admin/Scholarships.jsx
import { useEffect, useState } from 'react'
import { db } from '../../firebase/config'
import { collection, getDocs, addDoc, serverTimestamp, doc, deleteDoc, orderBy, query } from 'firebase/firestore'
import { Award, Plus, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminScholarships() {
  const [scholarships, setScholarships] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title:'', category:'NEED-CUM MERIT', startDate:'', endDate:'', description:'' })

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(query(collection(db,'scholarships'), orderBy('startDate','desc')))
        setScholarships(snap.docs.map(d=>({id:d.id,...d.data()})))
      } catch {} finally { setLoading(false) }
    }
    fetch()
  }, [])

  const set = (k,v) => setForm(p=>({...p,[k]:v}))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title||!form.startDate||!form.endDate) return toast.error('Fill required fields')
    setSaving(true)
    try {
      const ref = await addDoc(collection(db,'scholarships'), {
        ...form,
        startDate: new Date(form.startDate),
        endDate: new Date(form.endDate),
        createdAt: serverTimestamp(),
      })
      setScholarships(p=>[{id:ref.id,...form},...p])
      setShowForm(false); setForm({title:'',category:'NEED-CUM MERIT',startDate:'',endDate:'',description:''})
      toast.success('Scholarship added!')
    } catch { toast.error('Failed') } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete scholarship?')) return
    await deleteDoc(doc(db,'scholarships',id))
    setScholarships(p=>p.filter(s=>s.id!==id))
    toast.success('Deleted')
  }

  const fmt = (ts) => ts ? new Date(ts.toDate?.() || ts).toLocaleDateString('en-PK',{day:'2-digit',month:'2-digit',year:'numeric'}) : '-'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1f35]" style={{fontFamily:'Outfit,sans-serif'}}>Scholarships</h1>
          <p className="text-gray-500 text-sm">{scholarships.length} scholarships listed</p>
        </div>
        <button onClick={()=>setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4"/>Add Scholarship</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800" style={{fontFamily:'Outfit,sans-serif'}}>Add Scholarship</h3>
            <button onClick={()=>setShowForm(false)}><X className="w-5 h-5 text-gray-400"/></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Title *</label>
                <input type="text" value={form.title} onChange={e=>set('title',e.target.value)} className="input-field" required placeholder="NEED CUM MERIT 2026"/>
              </div>
              <div>
                <label className="label">Category</label>
                <select value={form.category} onChange={e=>set('category',e.target.value)} className="input-field">
                  {['NEED-CUM MERIT','NEST SCHOLARSHIP','HEC-NEED BASED','ENDOWMENT SCHOLARSHIP','MERIT-BASED','OTHER'].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Start Date *</label>
                <input type="date" value={form.startDate} onChange={e=>set('startDate',e.target.value)} className="input-field" required/>
              </div>
              <div>
                <label className="label">End Date *</label>
                <input type="date" value={form.endDate} onChange={e=>set('endDate',e.target.value)} className="input-field" required/>
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea value={form.description} onChange={e=>set('description',e.target.value)} className="input-field" rows={2} placeholder="Eligibility and details..."/>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<Plus className="w-4 h-4"/>}
                {saving?'Saving...':'Add Scholarship'}
              </button>
              <button type="button" onClick={()=>setShowForm(false)} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-[#0d1f35]/20 border-t-[#0d1f35] rounded-full animate-spin mx-auto"/></div>
        : scholarships.length === 0 ? <div className="p-8 text-center"><Award className="w-12 h-12 text-gray-200 mx-auto mb-3"/><p className="text-gray-500 text-sm">No scholarships added.</p></div>
        : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="table-header">S.No</th>
                <th className="table-header">Category</th>
                <th className="table-header">Title</th>
                <th className="table-header">Start Date</th>
                <th className="table-header">End Date</th>
                <th className="table-header">Del</th>
              </tr></thead>
              <tbody>
                {scholarships.map((s,i)=>(
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="table-cell text-xs">{i+1}</td>
                    <td className="table-cell font-semibold text-xs text-[#0d1f35]">{s.category}</td>
                    <td className="table-cell font-medium text-sm">{s.title}</td>
                    <td className="table-cell text-xs">{fmt(s.startDate)}</td>
                    <td className="table-cell text-xs">{fmt(s.endDate)}</td>
                    <td className="table-cell">
                      <button onClick={()=>handleDelete(s.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-lg">
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
