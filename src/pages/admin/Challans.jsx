// src/pages/admin/Challans.jsx
import { useEffect, useState } from 'react'
import { db } from '../../firebase/config'
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore'
import { CreditCard, Plus, CheckCircle, XCircle, X, Search } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminChallans() {
  const [challans, setChallans] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ studentId:'', title:'', amount:'', dueDate:'', semester:'', part:'', type:'fee' })
  const [issueAll, setIssueAll] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [cSnap, sSnap] = await Promise.all([
          getDocs(collection(db,'challans')),
          getDocs(query(collection(db,'users'), where('role','==','student'), where('isEnrolled','==',true)))
        ])
        setChallans(cSnap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)))
        setStudents(sSnap.docs.map(d=>({id:d.id,...d.data()})))
      } catch {} finally { setLoading(false) }
    }
    fetch()
  }, [])

  const set = (k,v) => setForm(p=>({...p,[k]:v}))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.amount || !form.dueDate) return toast.error('Fill required fields')
    setSaving(true)
    try {
      const targets = issueAll ? students : students.filter(s=>s.id===form.studentId)
      const newChallans = []
      for (const s of targets) {
        const ref = await addDoc(collection(db,'challans'), {
          studentId: s.id,
          studentName: s.name,
          rollNumber: s.rollNumber||'',
          title: form.title,
          amount: parseFloat(form.amount),
          dueDate: new Date(form.dueDate),
          semester: form.semester,
          part: form.part,
          type: form.type,
          status: 'unpaid',
          createdAt: serverTimestamp(),
        })
        newChallans.push({ id:ref.id, studentName:s.name, rollNumber:s.rollNumber||'', ...form, status:'unpaid' })
      }
      setChallans(p=>[...newChallans,...p])
      setShowForm(false)
      setForm({ studentId:'', title:'', amount:'', dueDate:'', semester:'', part:'', type:'fee' })
      toast.success(`Challan issued to ${targets.length} student(s)!`)
    } catch (e) { console.error(e); toast.error('Failed') } finally { setSaving(false) }
  }

  const markPaid = async (id) => {
    await updateDoc(doc(db,'challans',id), { status:'paid', paidAt: serverTimestamp() })
    setChallans(p=>p.map(c=>c.id===id?{...c,status:'paid'}:c))
    toast.success('Marked as paid')
  }

  const filtered = challans.filter(c =>
    !search || c.studentName?.toLowerCase().includes(search.toLowerCase()) || c.rollNumber?.toLowerCase().includes(search.toLowerCase()) || c.title?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1f35]" style={{fontFamily:'Outfit,sans-serif'}}>Fee Challans</h1>
          <p className="text-gray-500 text-sm">{challans.length} total challans</p>
        </div>
        <button onClick={()=>setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4"/>Issue Challan</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-800" style={{fontFamily:'Outfit,sans-serif'}}>Issue Fee Challan</h3>
            <button onClick={()=>setShowForm(false)}><X className="w-5 h-5 text-gray-400"/></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3">
              <input type="checkbox" id="issueAll" checked={issueAll} onChange={e=>setIssueAll(e.target.checked)} className="w-4 h-4"/>
              <label htmlFor="issueAll" className="text-sm font-medium text-blue-800 cursor-pointer">Issue to ALL enrolled students at once</label>
            </div>
            {!issueAll && (
              <div>
                <label className="label">Student *</label>
                <select value={form.studentId} onChange={e=>set('studentId',e.target.value)} className="input-field" required={!issueAll}>
                  <option value="">Select student</option>
                  {students.map(s=><option key={s.id} value={s.id}>{s.name} ({s.rollNumber||s.email})</option>)}
                </select>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Challan Title *</label>
                <input type="text" value={form.title} onChange={e=>set('title',e.target.value)} className="input-field" required placeholder="Admission to Next Study"/>
              </div>
              <div>
                <label className="label">Amount (PKR) *</label>
                <input type="number" value={form.amount} onChange={e=>set('amount',e.target.value)} className="input-field" required placeholder="25000"/>
              </div>
              <div>
                <label className="label">Due Date *</label>
                <input type="date" value={form.dueDate} onChange={e=>set('dueDate',e.target.value)} className="input-field" required/>
              </div>
              <div>
                <label className="label">Semester</label>
                <input type="text" value={form.semester} onChange={e=>set('semester',e.target.value)} className="input-field" placeholder="THIRD SEMESTER"/>
              </div>
              <div>
                <label className="label">Part / Year</label>
                <input type="text" value={form.part} onChange={e=>set('part',e.target.value)} className="input-field" placeholder="SECOND YEAR"/>
              </div>
              <div>
                <label className="label">Type</label>
                <select value={form.type} onChange={e=>set('type',e.target.value)} className="input-field">
                  <option value="fee">Tuition Fee</option>
                  <option value="hostel">Hostel Fee</option>
                  <option value="exam">Exam Fee</option>
                  <option value="library">Library Fee</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<Plus className="w-4 h-4"/>}
                {saving?'Issuing...':'Issue Challan'}
              </button>
              <button type="button" onClick={()=>setShowForm(false)} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search challans..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0d1f35] text-sm bg-white"/>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-[#0d1f35]/20 border-t-[#0d1f35] rounded-full animate-spin mx-auto"/></div>
        : filtered.length === 0 ? <div className="p-8 text-center text-gray-500 text-sm">No challans found.</div>
        : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="table-header">Student</th>
                <th className="table-header">Roll No</th>
                <th className="table-header">Title</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Semester</th>
                <th className="table-header">Due</th>
                <th className="table-header">Status</th>
                <th className="table-header">Action</th>
              </tr></thead>
              <tbody>
                {filtered.map(c=>(
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium text-sm">{c.studentName}</td>
                    <td className="table-cell font-mono text-xs">{c.rollNumber||'-'}</td>
                    <td className="table-cell text-xs">{c.title}</td>
                    <td className="table-cell font-semibold text-xs">PKR {c.amount?.toLocaleString()}</td>
                    <td className="table-cell text-xs">{c.semester||'-'}</td>
                    <td className="table-cell text-xs">{c.dueDate?new Date(c.dueDate.toDate?.() || c.dueDate).toLocaleDateString('en-PK'):'-'}</td>
                    <td className="table-cell">
                      {c.status==='paid'
                        ? <span className="badge-green flex items-center gap-1 w-fit text-xs"><CheckCircle className="w-3 h-3"/>Paid</span>
                        : <span className="badge-red flex items-center gap-1 w-fit text-xs"><XCircle className="w-3 h-3"/>Unpaid</span>}
                    </td>
                    <td className="table-cell">
                      {c.status!=='paid' && (
                        <button onClick={()=>markPaid(c.id)}
                          className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-lg hover:bg-green-200 transition-all">
                          Mark Paid
                        </button>
                      )}
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
