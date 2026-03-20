// src/pages/student/Scholarship.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase/config'
import { collection, query, getDocs, orderBy, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { Award, CheckCircle, XCircle, Clock, Download, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StudentScholarship() {
  const { userProfile } = useAuth()
  const [scholarships, setScholarships] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schSnap, appSnap] = await Promise.all([
          getDocs(query(collection(db, 'scholarships'), orderBy('startDate', 'desc'))),
          getDocs(query(collection(db, 'scholarshipApplications'), where('studentId','==', userProfile?.uid || '')))
        ])
        setScholarships(schSnap.docs.map(d=>({id:d.id,...d.data()})))
        setApplications(appSnap.docs.map(d=>({id:d.id,...d.data()})))
      } catch {} finally { setLoading(false) }
    }
    fetchData()
  }, [userProfile])

  const isApplied = (scholarshipId) => applications.some(a => a.scholarshipId === scholarshipId)

  const getStatus = (sch) => {
    const now = new Date()
    const start = sch.startDate ? new Date(sch.startDate.toDate?.() || sch.startDate) : null
    const end = sch.endDate ? new Date(sch.endDate.toDate?.() || sch.endDate) : null
    if (isApplied(sch.id)) return { label: '✓ Application submitted', color: 'text-green-600', canApply: false }
    if (end && end < now) return { label: '✗ Application form submission is over due date', color: 'text-red-500', canApply: false }
    if (sch.eligibilityMet === false) return { label: '✗ You are not eligible', color: 'text-red-500', canApply: false }
    return { label: '⬇ Apply Now', color: 'text-[#1e3a5f]', canApply: true }
  }

  const handleApply = async (sch) => {
    if (!userProfile?.uid) return toast.error('Please login again')
    try {
      await updateDoc(doc(db, 'scholarshipApplications', `${userProfile.uid}_${sch.id}`), {
        studentId: userProfile.uid,
        scholarshipId: sch.id,
        scholarshipTitle: sch.title,
        appliedAt: serverTimestamp(),
        status: 'pending'
      }).catch(async () => {
        const { setDoc } = await import('firebase/firestore')
        await setDoc(doc(db, 'scholarshipApplications', `${userProfile.uid}_${sch.id}`), {
          studentId: userProfile.uid,
          scholarshipId: sch.id,
          scholarshipTitle: sch.title,
          appliedAt: serverTimestamp(),
          status: 'pending'
        })
      })
      setApplications(prev => [...prev, { scholarshipId: sch.id }])
      toast.success('Application submitted successfully!')
    } catch (e) {
      toast.error('Failed to apply. Please try again.')
    }
  }

  const fmt = (ts) => ts ? new Date(ts.toDate?.() || ts).toLocaleDateString('en-PK',{day:'2-digit',month:'2-digit',year:'numeric'}) : '-'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#1e3a5f] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <Award className="w-6 h-6 text-yellow-300"/>
          <div>
            <h1 className="text-xl font-bold" style={{fontFamily:'Outfit,sans-serif'}}>Scholarship Announcements</h1>
            <p className="text-blue-200 text-sm">Financial Aid Office – Available Scholarships</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-[#1e3a5f] px-5 py-3">
          <h3 className="text-white font-bold" style={{fontFamily:'Outfit,sans-serif'}}>Scholarship List</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin mx-auto"></div></div>
        ) : scholarships.length === 0 ? (
          <div className="p-8 text-center"><Award className="w-12 h-12 text-gray-200 mx-auto mb-3"/><p className="text-gray-500 text-sm">No scholarships announced yet.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="table-header">S.No</th>
                <th className="table-header">Category</th>
                <th className="table-header">Title</th>
                <th className="table-header">Start Date</th>
                <th className="table-header">End Date</th>
                <th className="table-header">Action</th>
              </tr></thead>
              <tbody>
                {scholarships.map((sch, i) => {
                  const s = getStatus(sch)
                  return (
                    <tr key={sch.id} className="hover:bg-gray-50">
                      <td className="table-cell text-xs">{i+1}</td>
                      <td className="table-cell font-semibold text-xs text-gray-700">{sch.category||'General'}</td>
                      <td className="table-cell font-medium text-xs">{sch.title}</td>
                      <td className="table-cell text-xs">{fmt(sch.startDate)}</td>
                      <td className="table-cell text-xs">{fmt(sch.endDate)}</td>
                      <td className="table-cell">
                        {s.canApply ? (
                          <button onClick={()=>handleApply(sch)}
                            className="text-xs font-semibold text-[#1e3a5f] hover:underline flex items-center gap-1">
                            <Download className="w-3 h-3"/>Apply / Download
                          </button>
                        ) : (
                          <span className={`text-xs font-medium ${s.color}`}>{s.label}</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
