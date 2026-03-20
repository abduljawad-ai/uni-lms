// src/pages/student/Hostel.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase/config'
import { collection, getDocs, doc, setDoc, getDoc, serverTimestamp, orderBy, query } from 'firebase/firestore'
import { Home, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Hostel() {
  const { userProfile } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [myApplication, setMyApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aSnap, mySnap] = await Promise.all([
          getDocs(query(collection(db, 'hostelAnnouncements'), orderBy('createdAt', 'desc'))),
          getDoc(doc(db, 'hostelApplications', userProfile?.uid || 'none'))
        ])
        setAnnouncements(aSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        if (mySnap.exists()) setMyApplication(mySnap.data())
      } catch { } finally { setLoading(false) }
    }
    fetchData()
  }, [userProfile])

  const fmt = (ts) => ts ? new Date(ts.toDate?.() || ts).toLocaleDateString('en-PK', { day:'2-digit', month:'2-digit', year:'numeric' }) : '-'

  const handleApply = async (announcement) => {
    const now = new Date()
    const lastDate = announcement.lastDateToApply ? new Date(announcement.lastDateToApply.toDate?.() || announcement.lastDateToApply) : null
    if (lastDate && lastDate < now) return toast.error('Application deadline has passed')
    setApplying(true)
    try {
      await setDoc(doc(db, 'hostelApplications', userProfile.uid), {
        studentId: userProfile.uid,
        studentName: userProfile.name,
        rollNumber: userProfile.rollNumber || '',
        program: userProfile.program || '',
        announcementId: announcement.id,
        announcementTitle: announcement.title,
        appliedAt: serverTimestamp(),
        status: 'pending'
      })
      setMyApplication({ announcementId: announcement.id, status: 'pending' })
      toast.success('Hostel application submitted!')
    } catch (e) { console.error(e); toast.error('Application failed') } finally { setApplying(false) }
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#1e3a5f] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <Home className="w-6 h-6 text-blue-300" />
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily:'Outfit,sans-serif' }}>Hostel Management</h1>
            <p className="text-blue-200 text-sm">Hostel applications, challan and accommodation details</p>
          </div>
        </div>
      </div>

      {/* My Application Status */}
      {myApplication && (
        <div className={`rounded-2xl border p-4 flex items-center gap-3 ${myApplication.status === 'approved' ? 'bg-green-50 border-green-200' : myApplication.status === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
          {myApplication.status === 'approved' ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
           : myApplication.status === 'rejected' ? <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
           : <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />}
          <div>
            <p className={`font-semibold text-sm ${myApplication.status === 'approved' ? 'text-green-800' : myApplication.status === 'rejected' ? 'text-red-800' : 'text-yellow-800'}`}>
              Application Status: {myApplication.status?.toUpperCase()}
            </p>
            <p className="text-xs text-gray-500">For: {myApplication.announcementTitle}</p>
          </div>
        </div>
      )}

      {/* Announcements */}
      {announcements.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <Home className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h3 className="font-bold text-gray-700 mb-1">No Hostel Announcements</h3>
          <p className="text-gray-500 text-sm">No hostel allocations announced yet. Check back later.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(ann => {
            const now = new Date()
            const lastDate = ann.lastDateToApply ? new Date(ann.lastDateToApply.toDate?.() || ann.lastDateToApply) : null
            const isExpired = lastDate && lastDate < now
            const alreadyApplied = myApplication?.announcementId === ann.id

            return (
              <div key={ann.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-[#1e3a5f] px-5 py-3">
                  <h3 className="text-white font-bold" style={{ fontFamily:'Outfit,sans-serif' }}>Hostel Management</h3>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      ['Announcement', ann.title || 'Fresh (2026)'],
                      ['Last Date for Apply', fmt(ann.lastDateToApply)],
                      ['Application Form', isExpired ? null : 'available'],
                      ['Form Challan', isExpired ? null : 'available'],
                      ['Stay Period', ann.stayPeriod || `01/01/${new Date().getFullYear()} - 31/12/${new Date().getFullYear()}`],
                      ['Hostel Type', ann.hostelType || 'Boys / Girls'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-start">
                        <span className="text-gray-500 text-sm font-medium w-40 flex-shrink-0">{k}</span>
                        <span className={`text-sm font-semibold ${!v || isExpired && (k === 'Application Form' || k === 'Form Challan') ? 'text-red-500' : 'text-gray-800'}`}>
                          {v ? (isExpired && (k === 'Application Form' || k === 'Form Challan') ? 'Due date for application is expired.' : v) : 'Due date for application is expired.'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {ann.description && (
                    <p className="text-gray-500 text-sm mt-4 bg-gray-50 rounded-xl p-3">{ann.description}</p>
                  )}

                  <div className="mt-4 flex gap-3">
                    {alreadyApplied ? (
                      <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                        <CheckCircle className="w-4 h-4" /> Application Submitted
                      </div>
                    ) : isExpired ? (
                      <div className="flex items-center gap-2 text-red-500 text-sm">
                        <AlertCircle className="w-4 h-4" /> Application deadline has passed
                      </div>
                    ) : (
                      <button onClick={() => handleApply(ann)} disabled={applying}
                        className="btn-primary">
                        {applying ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Home className="w-4 h-4" />}
                        {applying ? 'Applying...' : 'Apply for Hostel'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
