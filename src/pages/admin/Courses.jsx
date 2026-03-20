// src/pages/admin/Courses.jsx
import { useEffect, useState } from 'react'
import { db } from '../../firebase/config'
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, serverTimestamp } from 'firebase/firestore'
import { BookOpen, Plus, Trash2, X, Search } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminCourses() {
  const [courses, setCourses] = useState([])
  const [programs, setPrograms] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name:'', courseCode:'', programId:'', semester:1, creditHours:3, type:'Theory', teacherId:'', batch:'' })

  useEffect(() => {
    const fetch = async () => {
      try {
        const [cSnap, pSnap, tSnap] = await Promise.all([
          getDocs(collection(db,'courses')),
          getDocs(collection(db,'programs')),
          getDocs(query(collection(db,'users'), where('role','==','teacher'), where('isApproved','==',true)))
        ])
        setCourses(cSnap.docs.map(d=>({id:d.id,...d.data()})))
        setPrograms(pSnap.docs.map(d=>({id:d.id,...d.data()})))
        setTeachers(tSnap.docs.map(d=>({id:d.id,...d.data()})))
      } catch {} finally { setLoading(false) }
    }
    fetch()
  }, [])

  const set = (k,v) => setForm(p=>({...p,[k]:v}))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.programId || !form.courseCode) return toast.error('Fill required fields')
    setSaving(true)
    try {
      const prog = programs.find(p=>p.id===form.programId)
      const teacher = teachers.find(t=>t.id===form.teacherId)
      const ref = await addDoc(collection(db,'courses'), {
        ...form,
        semester: parseInt(form.semester),
        creditHours: parseInt(form.creditHours),
        programName: prog?.name||'',
        teacherName: teacher?.name||'',
        createdAt: serverTimestamp(),
      })
      setCourses(p=>[{id:ref.id,...form,programName:prog?.name||'',teacherName:teacher?.name||''},...p])
      setShowForm(false)
      setForm({ name:'', courseCode:'', programId:'', semester:1, creditHours:3, type:'Theory', teacherId:'', batch:'' })
      toast.success('Course added!')
    } catch (e) { console.error(e); toast.error('Failed') } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this course?')) return
    await deleteDoc(doc(db,'courses',id))
    setCourses(p=>p.filter(c=>c.id!==id))
    toast.success('Deleted')
  }

  const filtered = courses.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.courseCode?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1f35]" style={{fontFamily:'Outfit,sans-serif'}}>Courses</h1>
          <p className="text-gray-500 text-sm">{courses.length} courses in system</p>
        </div>
        <button onClick={()=>setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4"/>Add Course</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-800" style={{fontFamily:'Outfit,sans-serif'}}>Add New Course</h3>
            <button onClick={()=>setShowForm(false)}><X className="w-5 h-5 text-gray-400"/></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Course Name *</label>
                <input type="text" value={form.name} onChange={e=>set('name',e.target.value)} className="input-field" required placeholder="Data Structures & Algorithms"/>
              </div>
              <div>
                <label className="label">Course Code *</label>
                <input type="text" value={form.courseCode} onChange={e=>set('courseCode',e.target.value)} className="input-field" required placeholder="CS-301"/>
              </div>
              <div>
                <label className="label">Program *</label>
                <select value={form.programId} onChange={e=>set('programId',e.target.value)} className="input-field" required>
                  <option value="">Select Program</option>
                  {programs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Assign Teacher</label>
                <select value={form.teacherId} onChange={e=>set('teacherId',e.target.value)} className="input-field">
                  <option value="">TBA</option>
                  {teachers.map(t=><option key={t.id} value={t.id}>{t.name} ({t.designation||'Lecturer'})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Semester</label>
                <select value={form.semester} onChange={e=>set('semester',e.target.value)} className="input-field">
                  {[1,2,3,4,5,6,7,8].map(n=><option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Credit Hours</label>
                <select value={form.creditHours} onChange={e=>set('creditHours',e.target.value)} className="input-field">
                  {[1,2,3,4].map(n=><option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Type</label>
                <select value={form.type} onChange={e=>set('type',e.target.value)} className="input-field">
                  <option>Theory</option><option>Lab</option><option>Sessional</option>
                </select>
              </div>
              <div>
                <label className="label">Batch</label>
                <input type="text" value={form.batch} onChange={e=>set('batch',e.target.value)} className="input-field" placeholder="2K25"/>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<Plus className="w-4 h-4"/>}
                {saving?'Saving...':'Add Course'}
              </button>
              <button type="button" onClick={()=>setShowForm(false)} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search courses..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0d1f35] text-sm bg-white"/>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-[#0d1f35]/20 border-t-[#0d1f35] rounded-full animate-spin mx-auto"/></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center"><BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3"/><p className="text-gray-500 text-sm">No courses found.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="table-header">Code</th>
                <th className="table-header">Course Name</th>
                <th className="table-header">Program</th>
                <th className="table-header">Sem</th>
                <th className="table-header">Credits</th>
                <th className="table-header">Type</th>
                <th className="table-header">Teacher</th>
                <th className="table-header">Batch</th>
                <th className="table-header">Del</th>
              </tr></thead>
              <tbody>
                {filtered.map(c=>(
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="table-cell font-mono text-xs font-bold text-[#0d1f35]">{c.courseCode}</td>
                    <td className="table-cell font-medium text-sm">{c.name}</td>
                    <td className="table-cell text-xs text-gray-500">{c.programName||'-'}</td>
                    <td className="table-cell text-center text-xs">{c.semester}</td>
                    <td className="table-cell text-center text-xs">{c.creditHours||3}</td>
                    <td className="table-cell"><span className="badge-blue text-xs capitalize">{c.type||'Theory'}</span></td>
                    <td className="table-cell text-xs">{c.teacherName||<span className="text-gray-300">TBA</span>}</td>
                    <td className="table-cell text-xs">{c.batch||'-'}</td>
                    <td className="table-cell">
                      <button onClick={()=>handleDelete(c.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-lg">
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
