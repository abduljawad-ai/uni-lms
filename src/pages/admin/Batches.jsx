// src/pages/admin/Batches.jsx
import { useEffect, useState } from 'react'
import { db } from '../../firebase/config'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { Layers, Plus, Trash2, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminBatches() {
  const [batches, setBatches] = useState([])
  const [newBatch, setNewBatch] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDoc(doc(db,'settings','batches'))
      if (snap.exists()) setBatches(snap.data().list || [])
      else setBatches(['2K19','2K20','2K21','2K22','2K23','2K24','2K25'])
    }
    fetch()
  }, [])

  const handleAdd = () => {
    const b = newBatch.trim().toUpperCase()
    if (!b || batches.includes(b)) return toast.error('Invalid or duplicate batch')
    setBatches(p=>[...p, b].sort())
    setNewBatch('')
  }

  const handleRemove = (b) => setBatches(p=>p.filter(x=>x!==b))

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db,'settings','batches'), { list: batches })
      toast.success('Batches saved!')
    } catch { toast.error('Failed') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h1 className="text-2xl font-bold text-[#0d1f35]" style={{fontFamily:'Outfit,sans-serif'}}>Manage Batches</h1>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex gap-3 mb-6">
          <input type="text" value={newBatch} onChange={e=>setNewBatch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAdd()}
            placeholder="e.g. 2K26" className="input-field max-w-xs"/>
          <button onClick={handleAdd} className="btn-primary"><Plus className="w-4 h-4"/>Add</button>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {batches.map(b=>(
            <div key={b} className="flex items-center gap-1.5 bg-[#0d1f35] text-white px-4 py-2 rounded-xl text-sm font-semibold">
              {b}
              <button onClick={()=>handleRemove(b)} className="text-white/60 hover:text-white ml-1"><Trash2 className="w-3 h-3"/></button>
            </div>
          ))}
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<Save className="w-4 h-4"/>}
          {saving?'Saving...':'Save Batches'}
        </button>
      </div>
    </div>
  )
}
