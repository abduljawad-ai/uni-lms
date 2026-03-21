import { useEffect, useState } from 'react'
import { db } from '../../firebase/config'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { Search, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getPendingEnrollments, approveEnrollment, rejectEnrollment } from '../../controllers/enrollmentController'
import toast from 'react-hot-toast'

export default function AdminEnrollments() {
  const { userProfile } = useAuth()
  const [tab, setTab] = useState('pending') 

  const [students, setStudents] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchApproved = async () => {
    try {
      const snap = await getDocs(query(collection(db,'users'), where('role','==','student'), where('enrollmentStatus','==','APPROVED')))
      setStudents(snap.docs.map(d=>({id:d.id,...d.data()})))
    } catch (e) { console.error(e) }
  }

  const fetchPending = async () => {
    try {
      const pending = await getPendingEnrollments()
      setPendingRequests(pending)
    } catch (e) { console.error(e) }
  }

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([fetchApproved(), fetchPending()])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleApprove = async (req) => {
    try {
      setLoading(true)
      await approveEnrollment({
        requestId: req.id,
        adminId: userProfile?.uid,
        currentSemesterId: 'SEM1', 
        semesterNumber: 1
      })
      toast.success('Enrollment Approved!')
      await fetchData()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (req) => {
    if (!confirm('Are you sure you want to reject this request?')) return;
    try {
      setLoading(true)
      await rejectEnrollment({
        requestId: req.id,
        adminId: userProfile?.uid,
        reason: 'Rejected by admin'
      })
      toast.success('Enrollment Rejected!')
      await fetchData()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredApproved = students.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.rollNumber?.toLowerCase().includes(search.toLowerCase()) || s.program?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredPending = pendingRequests.filter(req =>
    !search || req.studentName?.toLowerCase().includes(search.toLowerCase()) || req.studentEmail?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#0d1f35]" style={{fontFamily:'Outfit,sans-serif'}}>Enrollments</h1>
        <p className="text-gray-500 text-sm">Manage student enrollment requests</p>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        <button 
          onClick={() => setTab('pending')}
          className={`pb-2 px-1 font-semibold text-sm transition-all ${tab === 'pending' ? 'border-b-2 border-[#1e3a5f] text-[#1e3a5f]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Pending Requests ({pendingRequests.length})
        </button>
        <button 
          onClick={() => setTab('approved')}
          className={`pb-2 px-1 font-semibold text-sm transition-all ${tab === 'approved' ? 'border-b-2 border-[#1e3a5f] text-[#1e3a5f]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Approved Enrollments ({students.length})
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0d1f35] text-sm bg-white"/>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-[#0d1f35]/20 border-t-[#0d1f35] rounded-full animate-spin mx-auto"/></div>
        ) : tab === 'pending' ? (
          filteredPending.length === 0 ? <div className="p-8 text-center text-gray-500 text-sm">No pending enrollments.</div> :
          (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr>
                  <th className="table-header">Date</th>
                  <th className="table-header">Name</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Program</th>
                  <th className="table-header">Batch</th>
                  <th className="table-header text-right">Actions</th>
                </tr></thead>
                <tbody>
                  {filteredPending.map(req=>(
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="table-cell text-xs">{new Date(req.submittedAt?.toMillis() || Date.now()).toLocaleDateString()}</td>
                      <td className="table-cell font-medium text-sm">{req.studentName}</td>
                      <td className="table-cell text-xs text-gray-500">{req.studentEmail}</td>
                      <td className="table-cell text-xs">{req.programName||'-'}</td>
                      <td className="table-cell text-xs">{req.batchYear||'-'}</td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleApprove(req)} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all" title="Approve">
                            <CheckCircle className="w-4 h-4"/>
                          </button>
                          <button onClick={() => handleReject(req)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all" title="Reject">
                            <XCircle className="w-4 h-4"/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : tab === 'approved' ? (
          filteredApproved.length === 0 ? <div className="p-8 text-center text-gray-500 text-sm">No enrollments found.</div> :
          (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr>
                  <th className="table-header">Roll No</th>
                  <th className="table-header">Name</th>
                  <th className="table-header">Program</th>
                  <th className="table-header">Department</th>
                  <th className="table-header">Batch</th>
                  <th className="table-header text-center">Semester</th>
                </tr></thead>
                <tbody>
                  {filteredApproved.map(s=>(
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="table-cell font-mono text-xs font-bold text-[#0d1f35]">{s.rollNumber||'-'}</td>
                      <td className="table-cell font-medium text-sm">{s.name}</td>
                      <td className="table-cell text-xs">{s.programName||s.program||'-'}</td>
                      <td className="table-cell text-xs">{s.departmentName||s.department||'-'}</td>
                      <td className="table-cell text-xs">{s.batchYear||s.batch||'-'}</td>
                      <td className="table-cell text-center"><span className="badge-blue">Sem {s.currentSemester||1}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : null}
      </div>
    </div>
  )
}
