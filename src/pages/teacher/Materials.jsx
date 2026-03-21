
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase/config'
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore'
import { FileText, Video, Trash2, X, Plus, ExternalLink, Link as LinkIcon, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TeacherMaterials() {
  const { userProfile } = useAuth()
  const [courses, setCourses] = useState([])
  const [materials, setMaterials] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ courseId: '', title: '', type: 'document', url: '' })

  useEffect(() => {
    const fetch = async () => {
      const [cSnap, mSnap] = await Promise.all([
        getDocs(query(collection(db,'courses'), where('teacherId','==',userProfile.uid))),
        getDocs(query(collection(db,'materials'), where('teacherId','==',userProfile.uid)))
      ])
      setCourses(cSnap.docs.map(d=>({id:d.id,...d.data()})))
      setMaterials(mSnap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)))
    }
    if (userProfile?.uid) fetch()
  }, [userProfile])

  const set = (k,v) => setForm(p=>({...p,[k]:v}))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.courseId || !form.title || !form.url) return toast.error('Fill required fields')

    setUploading(true)
    try {
      const course = courses.find(c=>c.id===form.courseId)
      const ref2 = await addDoc(collection(db,'materials'), {
        courseId: form.courseId,
        courseName: course?.name||'',
        title: form.title,
        type: form.type,
        url: form.url,
        teacherId: userProfile.uid,
        teacherName: userProfile.name,
        createdAt: serverTimestamp(),
      })
      setMaterials(p=>[{id:ref2.id,...form,courseName:course?.name||''},...p])
      setShowForm(false)
      setForm({ courseId:'', title:'', type:'document', url:'' })
      toast.success('Material added successfully!')
    } catch (e) { console.error(e); toast.error('Failed to add material') } finally { setUploading(false) }
  }

  const handleDelete = async (m) => {
    if (!confirm('Delete this material?')) return
    await deleteDoc(doc(db,'materials',m.id))
    setMaterials(p=>p.filter(x=>x.id!==m.id))
    toast.success('Deleted')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e4a]" style={{fontFamily:'Outfit,sans-serif'}}>Course Materials</h1>
          <p className="text-gray-500 text-sm">Upload books, slides, videos and resources</p>
        </div>
        <button onClick={()=>setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4"/>Upload Material</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-800" style={{fontFamily:'Outfit,sans-serif'}}>Add Course Material</h3>
            <button onClick={()=>setShowForm(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600"/></button>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 space-y-2 mb-6">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertCircle className="w-4 h-4" />
              <span>How to share from Google Drive / OneDrive:</span>
            </div>
            <p>1. Upload your file to Google Drive or OneDrive.</p>
            <p>2. Right-click the file and select <strong>"Share"</strong> or <strong>"Get link"</strong>.</p>
            <p>3. Set access to <strong>"Anyone with the link"</strong> so students can view it.</p>
            <p>4. Copy the link and paste it below.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Course *</label>
                <select value={form.courseId} onChange={e=>set('courseId',e.target.value)} className="input-field" required>
                  <option value="">Select</option>
                  {courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Material Title *</label>
                <input type="text" value={form.title} onChange={e=>set('title',e.target.value)} className="input-field" required placeholder="e.g., Lecture 1 Slides"/>
              </div>
              <div>
                <label className="label">Resource Type</label>
                <select value={form.type} onChange={e=>set('type',e.target.value)} className="input-field">
                  <option value="document">Document / PDF</option>
                  <option value="video">Video Lecture</option>
                  <option value="slides">Presentation Slides</option>
                  <option value="link">Other Resource Link</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-blue-500" />
                Paste Shared Link (Google Drive / OneDrive / YouTube) *
              </label>
              <input type="url" value={form.url} onChange={e=>set('url',e.target.value)} 
                className="input-field" required placeholder="https://drive.google.com/file/d/..."/>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={uploading} className="btn-primary">
                {uploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Plus className="w-4 h-4"/>}
                {uploading ? 'Adding...' : 'Add Material'}
              </button>
              <button type="button" onClick={()=>setShowForm(false)} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {materials.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <Upload className="w-12 h-12 text-gray-200 mx-auto mb-3"/>
          <h3 className="font-bold text-gray-700 mb-1">No Materials Yet</h3>
          <p className="text-gray-500 text-sm">Upload course materials for your students.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="table-header">Title</th>
                <th className="table-header">Course</th>
                <th className="table-header">Type</th>
                <th className="table-header">Date</th>
                <th className="table-header">Actions</th>
              </tr></thead>
              <tbody>
                {materials.map(m=>(
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium text-sm">{m.title}</td>
                    <td className="table-cell text-xs text-gray-500">{m.courseName}</td>
                    <td className="table-cell"><span className="badge-blue capitalize text-xs">{m.type}</span></td>
                    <td className="table-cell text-xs">{m.createdAt?new Date(m.createdAt.toDate?.() || m.createdAt).toLocaleDateString('en-PK'):'-'}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        {m.url && <a href={m.url} target="_blank" rel="noreferrer" className="text-[#1a2e4a] hover:text-[#0d1f35]"><Download className="w-4 h-4"/></a>}
                        <button onClick={()=>handleDelete(m)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
