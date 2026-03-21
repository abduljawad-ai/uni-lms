
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase/config'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { Video, ExternalLink, AlertCircle, Download, FileText, Play } from 'lucide-react'
import { Link } from 'react-router-dom'

const WEEKS = Array.from({ length: 18 }, (_, i) => `Week ${i + 1}`)

export default function VirtualClassroom() {
  const { userProfile } = useAuth()
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedWeek, setSelectedWeek] = useState('')
  const [materials, setMaterials] = useState([])
  const [liveClasses, setLiveClasses] = useState([])
  const [loading, setLoading] = useState(false)
  const [coursesLoading, setCoursesLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      if (!userProfile?.programId) return setCoursesLoading(false)
      try {
        const snap = await getDocs(query(
          collection(db, 'courses'),
          where('programId', '==', userProfile.programId),
          where('semester', '==', userProfile.currentSemester || 1)
        ))
        setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch { } finally { setCoursesLoading(false) }
    }
    fetchCourses()
  }, [userProfile])

  useEffect(() => {
    const fetchMaterials = async () => {
      if (!selectedCourse || !selectedWeek) return
      setLoading(true)
      try {
        const [matSnap, classSnap] = await Promise.all([
          getDocs(query(
            collection(db, 'materials'),
            where('courseId', '==', selectedCourse),
            where('week', '==', selectedWeek)
          )),
          getDocs(query(
            collection(db, 'virtualClasses'),
            where('courseId', '==', selectedCourse),
            where('week', '==', selectedWeek)
          ))
        ])
        setMaterials(matSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLiveClasses(classSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch { } finally { setLoading(false) }
    }
    fetchMaterials()
  }, [selectedCourse, selectedWeek])

  if (!userProfile?.isEnrolled) return (
    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
      <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
      <p className="text-gray-600 text-sm mb-4">Please enroll in a program first.</p>
      <Link to="/student/enrollment" className="btn-primary inline-flex">Enroll Now</Link>
    </div>
  )

  const hasCourseFile = selectedCourse && courses.find(c => c.id === selectedCourse)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#1e3a5f] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <Video className="w-6 h-6 text-blue-300" />
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit,sans-serif' }}>Virtual Class Room</h1>
            <p className="text-blue-200 text-sm">Access weekly lectures, recordings and course materials</p>
          </div>
        </div>
      </div>

      {}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-xs text-red-700 space-y-1 mb-4">
          <p><strong>NOTE:</strong></p>
          <p>1) If your course/subject does not appear in the list, kindly check your course selection.</p>
          <p>2) If the teacher name is not showing in the select course option, it means your course teacher has not uploaded the course file. Kindly contact the concerned teacher.</p>
          <p>3) If your course weeks are not showing, it means the teacher has not enabled the course material for that week. Kindly contact the concerned teacher.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Select Course *</label>
            <select value={selectedCourse} onChange={e => { setSelectedCourse(e.target.value); setSelectedWeek(''); setMaterials([]); setLiveClasses([]) }}
              className="input-field">
              <option value="">-- Choose Course --</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.courseCode})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Select Week *</label>
            <select value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)}
              className="input-field" disabled={!selectedCourse}>
              <option value="">-- Choose Week --</option>
              {WEEKS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {selectedCourse && selectedWeek && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Live Classes */}
              {liveClasses.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-green-500 px-5 py-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <h3 className="text-white font-bold text-sm">Live / Recorded Sessions</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {liveClasses.map(cls => {
                      const sched = cls.scheduledAt ? new Date(cls.scheduledAt.toDate?.() || cls.scheduledAt) : null
                      return (
                        <div key={cls.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{cls.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {cls.teacherName} · {selectedWeek}
                              {sched && ` · ${sched.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}`}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {cls.meetLink && (
                              <a href={cls.meetLink} target="_blank" rel="noreferrer"
                                className="flex items-center gap-2 bg-green-500 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-green-600 transition-all">
                                <Video className="w-3.5 h-3.5" /> Join Class
                              </a>
                            )}
                            {cls.recordingUrl && (
                              <a href={cls.recordingUrl} target="_blank" rel="noreferrer"
                                className="flex items-center gap-2 bg-[#1e3a5f] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#162a47] transition-all">
                                <Play className="w-3.5 h-3.5" /> Recording
                              </a>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Materials */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-[#1e3a5f] px-5 py-3">
                  <h3 className="text-white font-bold text-sm">
                    Course Materials — {courses.find(c => c.id === selectedCourse)?.name} · {selectedWeek}
                  </h3>
                </div>
                {materials.length === 0 ? (
                  <div className="p-8 text-center">
                    <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No materials uploaded for {selectedWeek} yet.</p>
                    <p className="text-gray-400 text-xs mt-1">Contact your teacher if this is unexpected.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {materials.map(m => (
                      <div key={m.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${m.type === 'video' ? 'bg-red-100 text-red-600' : m.type === 'slides' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                          {m.type === 'video' ? <Video className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 text-sm">{m.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5 capitalize">{m.type} · {m.week}</p>
                        </div>
                        {m.url && (
                          <a href={m.url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-2 text-[#1e3a5f] font-semibold text-xs px-4 py-2 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all">
                            {m.type === 'video' ? <><Play className="w-3.5 h-3.5" /> Watch</> : <><Download className="w-3.5 h-3.5" /> Download</>}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
