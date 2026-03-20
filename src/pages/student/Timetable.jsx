// src/pages/student/Timetable.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase/config'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { Clock, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const COLORS = ['bg-blue-100 text-blue-800','bg-green-100 text-green-800','bg-purple-100 text-purple-800','bg-orange-100 text-orange-800','bg-pink-100 text-pink-800','bg-teal-100 text-teal-800','bg-yellow-100 text-yellow-800','bg-red-100 text-red-800']

export default function StudentTimetable() {
  const { userProfile } = useAuth()
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      if (!userProfile?.programId) return setLoading(false)
      try {
        const snap = await getDocs(query(
          collection(db, 'timetable'),
          where('programId','==', userProfile.programId),
          where('semester','==', userProfile.currentSemester || 1)
        ))
        setSlots(snap.docs.map(d=>({id:d.id,...d.data()})))
      } catch {} finally { setLoading(false) }
    }
    fetch()
  }, [userProfile])

  if (!userProfile?.isEnrolled) return (
    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
      <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3"/>
      <p className="text-gray-600 text-sm mb-4">Please enroll in a program first.</p>
      <Link to="/student/enrollment" className="btn-primary inline-flex">Enroll Now</Link>
    </div>
  )

  const byDay = (day) => slots.filter(s => s.day === day).sort((a,b) => a.startTime?.localeCompare(b.startTime))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#1e3a5f] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-blue-300"/>
          <div>
            <h1 className="text-xl font-bold" style={{fontFamily:'Outfit,sans-serif'}}>Class Timetable</h1>
            <p className="text-blue-200 text-sm">{userProfile.program} · Semester {userProfile.currentSemester}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin"></div></div>
      ) : slots.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <Clock className="w-12 h-12 text-gray-200 mx-auto mb-3"/>
          <h3 className="font-bold text-gray-700 mb-1">No Timetable Yet</h3>
          <p className="text-gray-500 text-sm">Your timetable hasn't been published. Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {DAYS.map(day => {
            const daySlots = byDay(day)
            if (daySlots.length === 0) return null
            return (
              <div key={day} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-[#1e3a5f] px-5 py-2.5">
                  <h3 className="text-white font-semibold text-sm">{day}</h3>
                </div>
                <div className="p-4 flex flex-wrap gap-3">
                  {daySlots.map((s,i)=>(
                    <div key={s.id} className={`rounded-xl p-3 min-w-[160px] ${COLORS[i % COLORS.length]}`}>
                      <p className="font-bold text-sm">{s.courseName||s.courseCode}</p>
                      <p className="text-xs mt-0.5">{s.startTime} – {s.endTime}</p>
                      <p className="text-xs mt-0.5">{s.room || 'Room TBA'}</p>
                      <p className="text-xs mt-0.5 opacity-70">{s.teacherName||''}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
