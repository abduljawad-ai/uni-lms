
import { useEffect, useState } from 'react'
import { db } from '../../firebase/config'
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, orderBy, query } from 'firebase/firestore'
import { Bell, Plus, Trash2, X, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminNotices() {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title:'', content:'', type:'general', targetRole:'all' })

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(query(collection(db,'notifications'), orderBy('createdAt','desc')))
        setNotices(snap.docs.map(d=>({id:d.id,...d.data()})))
      } catch {} finally { setLoading(false) }
    }
    fetch()
  }, [])

  const set = (k,v) => setForm(p=>({...p,[k]:v}))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.content) return toast.error('Fill required fields')
    setSaving(true)
    try {
      const ref = await addDoc(collection(db,'notifications'), { ...form, isActive:true, postedBy:'Admin', createdAt: serverTimestamp() })
      setNotices(p=>[{id:ref.id,...form,isActive:true,postedBy:'Admin'},...p])
      setShowForm(false); setForm({title:'',content:'',type:'general',targetRole:'all'})
      toast.success('Notice posted!')
    } catch { toast.error('Failed') } finally { setSaving(false) }
  }

  const toggleActive = async (n) => {
    await updateDoc(doc(db,'notices',n.id), { isActive: !n.isActive })
    setNotices(p=>p.map(x=>x.id===n.id?{...x,isActive:!x.isActive}:x))
    toast.success(n.isActive?'Notice hidden':'Notice activated')
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete notice?')) return
    await deleteDoc(doc(db,'notices',id))
    setNotices(p=>p.filter(n=>n.id!==id))
    toast.success('Deleted')
  }

  const TYPE_COLORS = { urgent:'bg-red-100 text-red-700', exam:'bg-yellow-100 text-yellow-700', academic:'bg-blue-100 text-blue-700', general:'bg-gray-100 text-gray-700' }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1f35]" style={{fontFamily:'Outfit,sans-serif'}}>Notice Board</h1>
          <p className="text-gray-500 text-sm">{notices.filter(n=>n.isActive).length} active notices</p>
        </div>
        <button onClick={()=>setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4"/>Post Notice</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800" style={{fontFamily:'Outfit,sans-serif'}}>Post New Notice</h3>
            <button onClick={()=>setShowForm(false)}><X className="w-5 h-5 text-gray-400"/></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Title *</label>
                <input type="text" value={form.title} onChange={e=>set('title',e.target.value)} className="input-field" required placeholder="Notice title..."/>
              </div>
              <div>
                <label className="label">Type</label>
                <select value={form.type} onChange={e=>set('type',e.target.value)} className="input-field">
                  <option value="general">General</option>
                  <option value="urgent">Urgent</option>
                  <option value="exam">Exam</option>
                  <option value="academic">Academic</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Content *</label>
              <textarea value={form.content} onChange={e=>set('content',e.target.value)} className="input-field" rows={4} required placeholder="Notice details..."/>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<Plus className="w-4 h-4"/>}
                {saving?'Posting...':'Post Notice'}
              </button>
              <button type="button" onClick={()=>setShowForm(false)} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-[#0d1f35]/20 border-t-[#0d1f35] rounded-full animate-spin"/></div>
      : notices.length === 0 ? <div className="bg-white rounded-2xl p-8 text-center border border-gray-100"><Bell className="w-12 h-12 text-gray-200 mx-auto mb-3"/><p className="text-gray-500 text-sm">No notices yet.</p></div>
      : (
        <div className="space-y-3">
          {notices.map(n=>(
            <div key={n.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 ${!n.isActive?'opacity-50':''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-gray-800 text-sm">{n.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[n.type]||TYPE_COLORS.general}`}>{n.type}</span>
                    {!n.isActive && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Hidden</span>}
                  </div>
                  <p className="text-gray-600 text-sm">{n.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{n.createdAt?new Date(n.createdAt.toDate?.() || n.createdAt).toLocaleDateString('en-PK',{day:'numeric',month:'long',year:'numeric'}):''}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={()=>toggleActive(n)} className={`p-1.5 rounded-lg transition-all ${n.isActive?'text-green-500 hover:bg-green-50':'text-gray-400 hover:bg-gray-100'}`}>
                    {n.isActive?<Eye className="w-4 h-4"/>:<EyeOff className="w-4 h-4"/>}
                  </button>
                  <button onClick={()=>handleDelete(n.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
