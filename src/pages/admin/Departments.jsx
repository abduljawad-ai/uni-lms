
import { useEffect, useState } from 'react'
import { db } from '../../firebase/config'
import { collection, getDocs, addDoc, doc, deleteDoc, setDoc } from 'firebase/firestore'
import { Building2, Plus, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ id:'', name:'', shortName:'' })

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(collection(db,'departments'))
        setDepartments(snap.docs.map(d=>({id:d.id,...d.data()})))
      } catch {} finally { setLoading(false) }
    }
    fetch()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.id || !form.name) return toast.error('Fill required fields')
    setSaving(true)
    try {
      await setDoc(doc(db,'departments',form.id.toLowerCase()), { name:form.name, shortName:form.shortName, id:form.id.toLowerCase() })
      setDepartments(p=>[...p.filter(d=>d.id!==form.id.toLowerCase()), { id:form.id.toLowerCase(), name:form.name, shortName:form.shortName }].sort((a,b)=>a.name.localeCompare(b.name)))
      setShowForm(false); setForm({id:'',name:'',shortName:''})
      toast.success('Department saved!')
    } catch { toast.error('Failed') } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete department?')) return
    await deleteDoc(doc(db,'departments',id))
    setDepartments(p=>p.filter(d=>d.id!==id))
    toast.success('Deleted')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1f35]" style={{fontFamily:'Outfit,sans-serif'}}>Departments</h1>
          <p className="text-gray-500 text-sm">{departments.length} departments</p>
        </div>
        <button onClick={()=>setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4"/>Add Department</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800" style={{fontFamily:'Outfit,sans-serif'}}>Add Department</h3>
            <button onClick={()=>setShowForm(false)}><X className="w-5 h-5 text-gray-400"/></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">ID (unique key) *</label>
              <input type="text" value={form.id} onChange={e=>setForm(p=>({...p,id:e.target.value}))} className="input-field" placeholder="cs, it, ee..." required/>
            </div>
            <div>
              <label className="label">Full Name *</label>
              <input type="text" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} className="input-field" placeholder="Computer Science" required/>
            </div>
            <div>
              <label className="label">Short Name</label>
              <input type="text" value={form.shortName} onChange={e=>setForm(p=>({...p,shortName:e.target.value}))} className="input-field" placeholder="CS"/>
            </div>
            <div className="sm:col-span-3 flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<Plus className="w-4 h-4"/>}
                {saving?'Saving...':'Save Department'}
              </button>
              <button type="button" onClick={()=>setShowForm(false)} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <p className="text-gray-400 text-sm col-span-3 text-center py-8">Loading...</p>
          : departments.map(d=>(
          <div key={d.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0d1f35] rounded-xl flex items-center justify-center">
                <span className="text-white text-xs font-bold">{d.shortName||d.id.toUpperCase().slice(0,2)}</span>
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{d.name}</p>
                <p className="text-gray-400 text-xs">ID: {d.id}</p>
              </div>
            </div>
            <button onClick={()=>handleDelete(d.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all">
              <Trash2 className="w-4 h-4"/>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
