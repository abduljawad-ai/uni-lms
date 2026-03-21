
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase/config'
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore'
import { FileText, Plus, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TeacherAssignments() {
  const { userProfile } = useAuth()
  const [courses, setCourses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ courseId: '', title: '', description: '', dueDate: '', totalMarks: 10 })

  useEffect(() => {
    const fetch = async () => {
      const [cSnap, aSnap] = await Promise.all([
        getDocs(query(collection(db,'courses'), where('teacherId','==',userProfile.uid))),
        getDocs(query(collection(db,'assignments'), where('teacherId','==',userProfile.uid), ))
      ])
      setCourses(cSnap.docs.map(d=>({id:d.id,...d.data()})))
      setAssignments(aSnap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)))
    }
    if (userProfile?.uid) fetch()
  }, [userProfile])

  const set = (k,v) => setForm(p=>({...p,[k]:v}))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.courseId || !form.title || !form.dueDate) return toast.error('Fill required fields')
    setSaving(true)
    try {
      const course = courses.find(c=>c.id===form.courseId)
      const ref = await addDoc(collection(db,'assignments'), {
        ...form,
        totalMarks: parseInt(form.totalMarks)||10,
        dueDate: new Date(form.dueDate),
        teacherId: userProfile.uid,
        teacherName: userProfile.name,
        courseName: course?.name||'',
        courseCode: course?.courseCode||'',
        createdAt: serverTimestamp(),
      })
      const newA = { id: ref.id, ...form, courseName: course?.name||'' }
      setAssignments(p=>[newA,...p])
      setShowForm(false)
      setForm({ courseId:'', title:'', description:'', dueDate:'', totalMarks:10 })
      toast.success('Assignment posted!')
    } catch { toast.error('Failed to post assignment') } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this assignment?')) return
    await deleteDoc(doc(db,'assignments',id))
    setAssignments(p=>p.filter(a=>a.id!==id))
    toast.success('Deleted')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e4a]" style={{fontFamily:'Outfit,sans-serif'}}>Assignments</h1>
          <p className="text-gray-500 text-sm">Post and manage course assignments</p>
        </div>
        <button onClick={()=>setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4"/>New Assignment
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-800" style={{fontFamily:'Outfit,sans-serif'}}>Create Assignment</h3>
            <button onClick={()=>setShowForm(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600"/></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Course *</label>
                <select value={form.courseId} onChange={e=>set('courseId',e.target.value)} className="input-field" required>
                  <option value="">Select course</option>
                  {courses.map(c=><option key={c.id} value={c.id}>{c.name} ({c.courseCode})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Title *</label>
                <input type="text" value={form.title} onChange={e=>set('title',e.target.value)} className="input-field" required placeholder="Assignment title"/>
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea value={form.description} onChange={e=>set('description',e.target.value)} className="input-field" rows={3} placeholder="Assignment instructions..."/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Due Date *</label>
                <input type="datetime-local" value={form.dueDate} onChange={e=>set('dueDate',e.target.value)} className="input-field" required/>
              </div>
              <div>
                <label className="label">Total Marks</label>
                <input type="number" value={form.totalMarks} onChange={e=>set('totalMarks',e.target.value)} className="input-field" min="1" max="100"/>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<Plus className="w-4 h-4"/>}
                {saving?'Posting...':'Post Assignment'}
              </button>
              <button type="button" onClick={()=>setShowForm(false)} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3"/>
          <h3 className="font-bold text-gray-700 mb-1">No Assignments Yet</h3>
          <p className="text-gray-500 text-sm">Create your first assignment above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map(a=>{
            const due = a.dueDate ? new Date(a.dueDate.toDate?.() || a.dueDate) : null
            const isPast = due && due < new Date()
            return (
              <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-800" style={{fontFamily:'Outfit,sans-serif'}}>{a.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isPast?'bg-red-100 text-red-600':'bg-green-100 text-green-600'}`}>
                        {isPast?'Closed':'Active'}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">{a.courseName} · {a.courseCode}</p>
                    {a.description && <p className="text-gray-600 text-sm mt-1">{a.description}</p>}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                      {due && <span>Due: {due.toLocaleDateString('en-PK',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</span>}
                      <span>Total Marks: {a.totalMarks}</span>
                    </div>
                  </div>
                  <button onClick={()=>handleDelete(a.id)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
