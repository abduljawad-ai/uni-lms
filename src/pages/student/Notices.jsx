// src/pages/student/Notices.jsx
import { useEffect, useState } from 'react'
import { db } from '../../firebase/config'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { Bell, AlertCircle, Info, BookOpen, Calendar } from 'lucide-react'

const TYPE_META = {
  urgent: { color: 'border-l-red-500 bg-red-50', badge: 'badge-red', icon: AlertCircle, iconColor: 'text-red-500' },
  exam: { color: 'border-l-yellow-500 bg-yellow-50', badge: 'badge-yellow', icon: Calendar, iconColor: 'text-yellow-500' },
  academic: { color: 'border-l-blue-500 bg-blue-50', badge: 'badge-blue', icon: BookOpen, iconColor: 'text-blue-500' },
  general: { color: 'border-l-gray-300 bg-gray-50', badge: 'badge-blue', icon: Info, iconColor: 'text-gray-500' },
}

export default function StudentNotices() {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(query(collection(db,'notifications'), where('isActive','==',true), orderBy('createdAt','desc')))
        setNotices(snap.docs.map(d=>({id:d.id,...d.data()})))
      } catch {} finally { setLoading(false) }
    }
    fetch()
  }, [])

  const filtered = filter === 'all' ? notices : notices.filter(n => n.type === filter)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#1e3a5f] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-blue-300"/>
          <div>
            <h1 className="text-xl font-bold" style={{fontFamily:'Outfit,sans-serif'}}>Notice Board</h1>
            <p className="text-blue-200 text-sm">University announcements and updates</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all','urgent','exam','academic','general'].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${filter===f?'bg-[#1e3a5f] text-white':'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin"></div></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3"/>
          <p className="text-gray-500 text-sm">No notices found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(n=>{
            const meta = TYPE_META[n.type] || TYPE_META.general
            const Icon = meta.icon
            return (
              <div key={n.id} className={`bg-white rounded-xl border-l-4 shadow-sm p-4 ${meta.color}`}>
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${meta.iconColor}`}/>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-800 text-sm">{n.title}</h3>
                      <span className={`text-xs ${meta.badge}`}>{n.type||'Notice'}</span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{n.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>{n.postedBy || 'Administration'}</span>
                      <span>·</span>
                      <span>{n.createdAt ? new Date(n.createdAt.toDate?.() || n.createdAt).toLocaleDateString('en-PK',{day:'numeric',month:'long',year:'numeric'}) : ''}</span>
                    </div>
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
