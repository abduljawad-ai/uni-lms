
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase/config'
import {
  collection, query, where, getDocs, doc, setDoc,
  deleteDoc, serverTimestamp, getDoc
} from 'firebase/firestore'
import { FileText, Plus, Trash2, Printer, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]
const EXAM_TYPES = ['Regular', 'Improvement', 'Failure']

export default function CourseSelectionForm() {
  const { userProfile } = useAuth()
  const [tab, setTab] = useState('selected') 
  const [courses, setCourses] = useState([])          
  const [selectedSubjects, setSelectedSubjects] = useState([])  
  const [examType, setExamType] = useState('Regular')
  const [semester, setSemester] = useState(userProfile?.currentSemester || 1)
  const [examYear] = useState(new Date().getFullYear().toString())
  const [addSubject, setAddSubject] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formId, setFormId] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile?.programId) return setLoading(false)
      setLoading(true)
      try {
        // Fetch available courses for program + semester
        const cSnap = await getDocs(query(
          collection(db, 'courses'),
          where('programId', '==', userProfile.programId),
          where('semester', '==', parseInt(semester))
        ))
        setCourses(cSnap.docs.map(d => ({ id: d.id, ...d.data() })))

        const fId = `${userProfile.uid}_sem${semester}_${examYear}_${examType}`
        setFormId(fId)
        const fSnap = await getDoc(doc(db, 'examForms', fId))
        if (fSnap.exists()) {
          setSelectedSubjects(fSnap.data().subjects || [])
        } else {
          setSelectedSubjects([])
        }
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    fetchData()
  }, [userProfile, semester, examType])

  const handleAddSubject = () => {
    if (!addSubject) return
    const course = courses.find(c => c.id === addSubject)
    if (!course) return
    if (selectedSubjects.find(s => s.courseId === course.id)) {
      return toast.error('Subject already added')
    }
    setSelectedSubjects(p => [...p, {
      courseId: course.id,
      courseCode: course.courseCode,
      courseTitle: course.name,
      instructor: course.teacherName || 'TBA',
      creditHours: course.creditHours || 3,
    }])
    setAddSubject('')
  }

  const handleDelete = (courseId) => {
    setSelectedSubjects(p => p.filter(s => s.courseId !== courseId))
  }

  const handleSave = async () => {
    if (selectedSubjects.length === 0) return toast.error('Add at least one subject')
    setSaving(true)
    try {
      const fId = `${userProfile.uid}_sem${semester}_${examYear}_${examType}`
      await setDoc(doc(db, 'examForms', fId), {
        studentId: userProfile.uid,
        studentName: userProfile.name,
        rollNumber: userProfile.rollNumber || '',
        programId: userProfile.programId,
        program: userProfile.program || '',
        semester: parseInt(semester),
        examYear,
        examType,
        subjects: selectedSubjects,
        submittedAt: serverTimestamp(),
        status: 'submitted',
      }, { merge: true })
      setFormId(fId)
      toast.success('Exam form submitted successfully!')
      setTab('selected')
    } catch (e) { console.error(e); toast.error('Failed to submit form') } finally { setSaving(false) }
  }

  const handlePrint = () => {
    window.print()
  }

  const availableToAdd = courses.filter(c => !selectedSubjects.find(s => s.courseId === c.id))

  if (!userProfile?.isEnrolled) return (
    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
      <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
      <p className="text-gray-600 text-sm mb-4">Please enroll in a program first.</p>
      <Link to="/student/enrollment" className="btn-primary inline-flex">Enroll Now</Link>
    </div>
  )

  return (
    <div className="space-y-5 animate-fade-in">
      {}
      <div className="bg-[#1e3a5f] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-300" />
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit,sans-serif' }}>
              Course Selection for Semester Regular / Improver / Failure Examination
            </h1>
            <p className="text-blue-200 text-sm">Select and submit your subjects for the upcoming exam</p>
          </div>
        </div>
      </div>

      {}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Semester</label>
            <select value={semester} onChange={e => setSemester(e.target.value)} className="input-field">
              {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Exam Year</label>
            <input value={examYear} readOnly className="input-field bg-gray-50 text-gray-500 cursor-not-allowed" />
          </div>
          <div>
            <label className="label">Exam Type</label>
            <select value={examType} onChange={e => setExamType(e.target.value)} className="input-field">
              {EXAM_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button onClick={() => setTab('selected')}
            className={`flex-1 py-3 text-sm font-semibold transition-all ${tab === 'selected' ? 'text-[#1e3a5f] border-b-2 border-[#1e3a5f] bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}`}>
            Selected Courses
          </button>
          <button onClick={() => setTab('choose')}
            className={`flex-1 py-3 text-sm font-semibold transition-all ${tab === 'choose' ? 'text-[#1e3a5f] border-b-2 border-[#1e3a5f] bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}`}>
            Click Here To Choose Subjects &amp; Submit Form
          </button>
        </div>

        {}
        {tab === 'selected' && (
          <div>
            {}
            <div className="bg-blue-50 border-b border-blue-100 p-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                {[
                  ['Roll No', userProfile.rollNumber || 'N/A'],
                  ['Exam Year', examYear],
                  ['Exam Type', examType.toUpperCase()],
                  ['Part - Semester', `II - ${semester}`],
                  ['Fee Status', 'Pending'],
                ].map(([k, v]) => (
                  <div key={k} className="bg-white rounded-xl p-3">
                    <p className="text-blue-500 text-xs font-semibold">{k}</p>
                    <p className="font-bold text-blue-900 text-sm mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {}
            <div className="bg-[#1e3a5f] mx-5 mt-4 mb-0 rounded-t-xl px-5 py-2.5">
              <p className="text-white font-semibold text-sm text-center">
                FORM INFORMATION FOR THE {semester} {['ST','ND','RD','TH','TH','TH','TH','TH'][semester-1]||'TH'} {examType.toUpperCase()} {examYear}
              </p>
            </div>
            <div className="border-x border-b border-gray-200 mx-5 rounded-b-xl mb-4 overflow-hidden">
              <table className="w-full">
                <thead><tr>
                  <th className="table-header">S.No</th>
                  <th className="table-header">Part - Semester</th>
                  <th className="table-header">Exam Type</th>
                  <th className="table-header">Year</th>
                  <th className="table-header">Fee Status</th>
                  <th className="table-header text-center">Print Slip</th>
                </tr></thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="table-cell">1</td>
                    <td className="table-cell font-medium">II - {semester}</td>
                    <td className="table-cell">{examType}</td>
                    <td className="table-cell">{examYear}</td>
                    <td className="table-cell"><span className="badge-yellow text-xs">Pending</span></td>
                    <td className="table-cell text-center">
                      <button onClick={handlePrint}
                        className="flex items-center gap-1 text-xs bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold px-3 py-1.5 rounded-lg transition-all mx-auto">
                        <Printer className="w-3.5 h-3.5" /> EXAM SLIP
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {}
            <div className="px-5 pb-5">
              <p className="text-sm font-bold text-gray-700 mb-2 bg-yellow-50 border border-yellow-100 rounded-lg px-4 py-2">COURSE / SUBJECTS</p>
              {loading ? (
                <div className="flex justify-center py-6"><div className="w-6 h-6 border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin" /></div>
              ) : selectedSubjects.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  No subjects selected yet. Go to "Choose Subjects" tab to add courses.
                </div>
              ) : (
                <div className="space-y-1">
                  {selectedSubjects.map((s, i) => (
                    <div key={s.courseId} className="flex items-center gap-2 text-sm py-1">
                      <span className="text-gray-400 w-5 text-right text-xs">{i + 1}.</span>
                      <span className="font-mono font-semibold text-[#1e3a5f] text-xs">{s.courseCode}</span>
                      <span className="text-gray-400">-</span>
                      <span className="font-medium text-gray-800">{s.courseTitle}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {}
        {tab === 'choose' && (
          <div className="p-5 space-y-5">
            {}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-xs text-yellow-800 space-y-1">
              <p>• <strong>Roll No:</strong> {userProfile.rollNumber || 'N/A'} &nbsp;&nbsp; <strong>Name:</strong> {userProfile.name} &nbsp;&nbsp; <strong>Semester:</strong> {semester}</p>
              <p>• Student will be allowed to appear in selected courses only. Without course selection, attendance will not be marked.</p>
              <p className="text-red-700">• Since the Examination Form is a legal document, over-writing or tampering in any way is illegal. It may result in rejection of the Examination Form outright or shall be prosecuted under Criminal Law, besides cancellation of admission.</p>
            </div>

            {}
            {courses.length > 0 && (
              <div>
                <p className="text-xs text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 mb-3">
                  Following is the list of courses currently offered by your department. If any course is not available, please contact your concerned department HOD to assign the course.
                </p>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full">
                    <thead><tr>
                      <th className="table-header">S.No</th>
                      <th className="table-header">Course No</th>
                      <th className="table-header">Course Title</th>
                      <th className="table-header">Group/Section</th>
                      <th className="table-header">Instructor</th>
                      <th className="table-header">Co-Instructor</th>
                    </tr></thead>
                    <tbody>
                      {courses.map((c, i) => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="table-cell text-xs">{i + 1}</td>
                          <td className="table-cell font-mono font-bold text-xs text-[#1e3a5f]">{c.courseCode}</td>
                          <td className="table-cell font-medium text-sm">{c.name}</td>
                          <td className="table-cell text-xs">{c.section || '-'}</td>
                          <td className="table-cell text-xs font-semibold">{c.teacherName?.toUpperCase() || 'TBA'}</td>
                          <td className="table-cell text-xs">{c.coInstructor || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {}
            <div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">SELECT SUBJECT</p>
              <div className="flex gap-2">
                <select value={addSubject} onChange={e => setAddSubject(e.target.value)} className="input-field flex-1">
                  <option value="">-- Choose Subject --</option>
                  {availableToAdd.map(c => (
                    <option key={c.id} value={c.id}>{c.courseCode} {c.name}</option>
                  ))}
                </select>
                <button onClick={handleAddSubject} className="bg-[#1e3a5f] text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-[#162a47] transition-all flex items-center gap-2 flex-shrink-0">
                  <Plus className="w-4 h-4" /> ADD SUBJECTS
                </button>
              </div>
            </div>

            {}
            {selectedSubjects.length > 0 && (
              <div>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full">
                    <thead><tr>
                      <th className="table-header">S.No</th>
                      <th className="table-header">Subject</th>
                      <th className="table-header text-center">Remove</th>
                    </tr></thead>
                    <tbody>
                      {selectedSubjects.map((s, i) => (
                        <tr key={s.courseId} className="hover:bg-gray-50">
                          <td className="table-cell text-xs">{i + 1}</td>
                          <td className="table-cell font-semibold text-sm">
                            <span className="font-mono text-[#1e3a5f] mr-2">{s.courseCode}</span>
                            {s.courseTitle}
                          </td>
                          <td className="table-cell text-center">
                            <button onClick={() => handleDelete(s.courseId)}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all">
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button onClick={handleSave} disabled={saving}
                  className="mt-4 flex items-center gap-2 bg-[#1e3a5f] text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#162a47] transition-all disabled:opacity-60">
                  {saving
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <CheckCircle className="w-4 h-4" />}
                  {saving ? 'Submitting...' : '💾 Save and Print'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
