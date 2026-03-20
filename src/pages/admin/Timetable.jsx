// src/pages/admin/Timetable.jsx
import { useEffect, useState } from 'react'
import { db } from '../../firebase/config'
import { collection, getDocs, addDoc, serverTimestamp, doc, deleteDoc, query, where } from 'firebase/firestore'
import { Clock, Plus, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export default function AdminTimetable() {
  const [slots, setSlots] = useState([])
  const [programs, setPrograms] = useState([])
  const [courses, setCourses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterProg, setFilterProg] = useState('')
  const [form, setForm] = useState({ programId:'', semester:1, courseId:'', teacherId:'', day:'Monday', startTime:'08:00', endTime:'09:00', room:'' })

  useEffect(() => {
    const fetch = async () => {
      try {
        const [sSnap,pSnap,cSnap,tSnap] = await Promise.all([
          getDocs(collection(db,'timetable')),
          getDocs(collection(db,'programs')),
          getDocs(collection(db,'courses')),
          getDocs(query(collection(db,'users'), where('role','==','teacher'), where('isApproved','==',true)))
        ])
        setSlots(sSnap.docs.map(d=>({id:d.id,...d.data()})))
        setPrograms(pSnap.docs.map(d=>({id:d.id,...d.data()})))
        setCourses(cSnap.docs.map(d=>({id:d.id,...d.data()})))
        setTeachers(tSnap.docs.map(d=>({id:d.id,...d.data()})))
      } catch {} finally { setLoading(false) }
    }
    fetch()
  }, [])

  const set = (k,v) => setForm(p=>({...p,[k]:v}))
  const filteredCourses = courses.filter(c=>c.programId===form.programId && c.semester===parseInt(form.semester))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.programId||!form.courseId||!form.day) return toast.error('Fill required fields')
    setSaving(true)
    try {
      const prog = programs.find(p=>p.id===form.programId)
      const course = courses.find(c=>c.id===form.courseId)
      const teacher = teachers.find(t=>t.id===form.teacherId)
      const ref = await addDoc(collection(db,'timetable'), {
        ...form,
        semester: parseInt(form.semester),
        programName: prog?.name||'',
        courseName: course?.name||'',
        courseCode: course?.courseCode||'',
        teacherName: teacher?.name||'',
        createdAt: serverTimestamp(),
      })
      setSlots(p=>[{id:ref.id,...form,programName:prog?.name||'',courseName:course?.name||'',teacherName:teacher?.name||''},...p])
      setShowForm(false)
      setForm({programId:'',semester:1,courseId:'',teacherId:'',day:'Monday',startTime:'08:00',endTime:'09:00',room:''})
      toast.success('Timetable slot added!')
    } catch (e){console.error(e);toast.error('Failed')} finally {setSaving(false)}
  }

  const handleDelete = async (id) => {
    await deleteDoc(doc(db,'timetable',id))
    setSlots(p=>p.filter(s=>s.id!==id))
    toast.success('Removed')
  }

  const filtered = filterProg ? slots.filter(s=>s.programId===filterProg) : slots

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1f35]" style={{fontFamily:'Outfit,sans-serif'}}>Timetable Management</h1>
          <p className="text-gray-500 text-sm">{slots.length} timetable slots</p>
        </div>
        <button onClick={()=>setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4"/>Add Slot</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800" style={{fontFamily:'Outfit,sans-serif'}}>Add Timetable Slot</h3>
            <button onClick={()=>setShowForm(false)}><X className="w-5 h-5 text-gray-400"/></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="label">Program *</label>
                <select value={form.programId} onChange={e=>set('programId',e.target.value)} className="input-field" required>
                  <option value="">Select</option>
                  {programs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Semester</label>
                <select value={form.semester} onChange={e=>set('semester',e.target.value)} className="input-field">
                  {[1,2,3,4,5,6,7,8].map(n=><option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Course *</label>
                <select value={form.courseId} onChange={e=>set('courseId',e.target.value)} className="input-field" required>
                  <option value="">Select</option>
                  {filteredCourses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Teacher</label>
                <select value={form.teacherId} onChange={e=>set('teacherId',e.target.value)} className="input-field">
                  <option value="">TBA</option>
                  {teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Day *</label>
                <select value={form.day} onChange={e=>set('day',e.target.value)} className="input-field">
                  {DAYS.map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Start Time</label>
                <input type="time" value={form.startTime} onChange={e=>set('startTime',e.target.value)} className="input-field"/>
              </div>
              <div>
                <label className="label">End Time</label>
                <input type="time" value={form.endTime} onChange={e=>set('endTime',e.target.value)} className="input-field"/>
              </div>
              <div>
                <label className="label">Room</label>
                <input type="text" value={form.room} onChange={e=>set('room',e.target.value)} className="input-field" placeholder="Room 101"/>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<Plus className="w-4 h-4"/>}
                {saving?'Adding...':'Add Slot'}
              </button>
              <button type="button" onClick={()=>setShowForm(false)} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex gap-3 flex-wrap items-center">
        <label className="text-sm font-medium text-gray-600">Filter by Program:</label>
        <select value={filterProg} onChange={e=>setFilterProg(e.target.value)} className="input-field max-w-xs">
          <option value="">All Programs</option>
          {programs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {loading ? <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-[#0d1f35]/20 border-t-[#0d1f35] rounded-full animate-spin"/></div>
      : (
        <div className="space-y-4">
          {DAYS.map(day=>{
            const daySlots = filtered.filter(s=>s.day===day).sort((a,b)=>a.startTime?.localeCompare(b.startTime))
            if (!daySlots.length) return null
            return (
              <div key={day} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-[#0d1f35] px-5 py-2.5"><h3 className="text-white font-semibold text-sm">{day}</h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr>
                      <th className="table-header">Time</th>
                      <th className="table-header">Course</th>
                      <th className="table-header">Program</th>
                      <th className="table-header">Sem</th>
                      <th className="table-header">Teacher</th>
                      <th className="table-header">Room</th>
                      <th className="table-header">Del</th>
                    </tr></thead>
                    <tbody>
                      {daySlots.map(s=>(
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="table-cell font-semibold text-xs">{s.startTime} – {s.endTime}</td>
                          <td className="table-cell font-medium text-sm">{s.courseName} <span className="text-gray-400 text-xs">({s.courseCode})</span></td>
                          <td className="table-cell text-xs text-gray-500">{s.programName}</td>
                          <td className="table-cell text-center text-xs">{s.semester}</td>
                          <td className="table-cell text-xs">{s.teacherName||'TBA'}</td>
                          <td className="table-cell text-xs">{s.room||'-'}</td>
                          <td className="table-cell">
                            <button onClick={()=>handleDelete(s.id)} className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50">
                              <Trash2 className="w-4 h-4"/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
          {filtered.length===0 && <div className="bg-white rounded-2xl p-8 text-center border border-gray-100"><Clock className="w-12 h-12 text-gray-200 mx-auto mb-3"/><p className="text-gray-500 text-sm">No timetable slots. Add one above.</p></div>}
        </div>
      )}
    </div>
  )
}
