
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase/config'
import { collection, query, where, getDocs, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { Star, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const SEMESTERS = ['First Semester','Second Semester','Third Semester','Fourth Semester','Fifth Semester','Sixth Semester','Seventh Semester','Eighth Semester']
const SCALE = ['Strongly Agree','Agree','Uncertain','Disagree','Strongly Disagree']

const SECTIONS = [
  {
    title: 'COURSE CONTENT AND ORGANIZATION',
    color: 'bg-blue-600',
    questions: [
      'The course objectives were clear?',
      'The Course workload was manageable?',
      'The Course was well organized?',
    ]
  },
  {
    title: 'STUDENT CONTRIBUTION',
    color: 'bg-green-600',
    questions: [
      'I participated actively in the Course?',
      'I think I have made progress in this Course?',
    ]
  },
  {
    title: 'LEARNING ENVIRONMENT AND TEACHING METHODS',
    color: 'bg-purple-600',
    questions: [
      'There was good balance of Lectures, Practicals and Tutorials?',
      'The learning and Teaching Methods encouraged participation?',
      'The teacher used variety of teaching methods?',
    ]
  },
  {
    title: 'TEACHER EVALUATION',
    color: 'bg-orange-600',
    questions: [
      'The teacher was well prepared for class?',
      'The teacher communicated clearly and effectively?',
      'The teacher was accessible and helpful outside class?',
      'The teacher gave timely feedback on assessments?',
    ]
  },
  {
    title: 'ASSESSMENT AND FEEDBACK',
    color: 'bg-red-600',
    questions: [
      'The assessment methods were fair and appropriate?',
      'The grading criteria were clearly explained?',
      'I received helpful feedback on my work?',
    ]
  },
]

function LikertRow({ question, value, onChange, disabled }) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-700 w-1/2">{question}</td>
      {SCALE.map(opt => (
        <td key={opt} className="text-center py-3">
          <input
            type="radio"
            name={question}
            value={opt}
            checked={value === opt}
            onChange={() => onChange(opt)}
            disabled={disabled}
            className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
          />
        </td>
      ))}
    </tr>
  )
}

export default function CourseEvaluation() {
  const { userProfile } = useAuth()
  const [courses, setCourses] = useState([])
  const [selectedSem, setSelectedSem] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [responses, setResponses] = useState({})
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const fetchCourses = async () => {
      if (!userProfile?.programId || !selectedSem) return
      try {
        const semNum = SEMESTERS.indexOf(selectedSem) + 1
        const snap = await getDocs(query(
          collection(db, 'courses'),
          where('programId', '==', userProfile.programId),
          where('semester', '==', semNum)
        ))
        setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setSelectedCourse('')
        setResponses({})
        setSubmitted(false)
      } catch { }
    }
    fetchCourses()
  }, [selectedSem, userProfile])

  useEffect(() => {
    const checkExisting = async () => {
      if (!selectedCourse || !userProfile?.uid) return
      setLoading(true)
      try {
        const docId = `${userProfile.uid}_${selectedCourse}_${selectedSem?.replace(/\s/g,'')}`
        const snap = await getDoc(doc(db, 'courseEvaluations', docId))
        if (snap.exists()) {
          setResponses(snap.data().responses || {})
          setComment(snap.data().comment || '')
          setSubmitted(true)
        } else {
          setResponses({})
          setComment('')
          setSubmitted(false)
        }
      } catch { } finally { setLoading(false) }
    }
    checkExisting()
  }, [selectedCourse])

  const setResponse = (question, value) => {
    setResponses(p => ({ ...p, [question]: value }))
  }

  const allQuestions = SECTIONS.flatMap(s => s.questions)
  const answeredCount = allQuestions.filter(q => responses[q]).length
  const isComplete = answeredCount === allQuestions.length

  const handleSubmit = async () => {
    if (!isComplete) return toast.error(`Please answer all ${allQuestions.length} questions`)
    if (!selectedCourse) return toast.error('Select a course')
    setSubmitting(true)
    try {
      const course = courses.find(c => c.id === selectedCourse)
      const docId = `${userProfile.uid}_${selectedCourse}_${selectedSem?.replace(/\s/g,'')}`
      await setDoc(doc(db, 'courseEvaluations', docId), {
        studentId: userProfile.uid,
        rollNumber: userProfile.rollNumber || '',
        courseId: selectedCourse,
        courseName: course?.name || '',
        courseCode: course?.courseCode || '',
        teacherId: course?.teacherId || '',
        teacherName: course?.teacherName || '',
        semester: selectedSem,
        responses,
        comment,
        submittedAt: serverTimestamp(),
      })
      setSubmitted(true)
      toast.success('Course evaluation submitted! Thank you for your feedback.')
    } catch (e) { console.error(e); toast.error('Submission failed') } finally { setSubmitting(false) }
  }

  if (!userProfile?.isEnrolled) return (
    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
      <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
      <p className="text-gray-600 text-sm mb-4">Please enroll in a program first.</p>
      <Link to="/student/enrollment" className="btn-primary inline-flex">Enroll Now</Link>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#1e3a5f] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <Star className="w-6 h-6 text-yellow-300" />
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily:'Outfit,sans-serif' }}>Course Evaluation</h1>
            <p className="text-blue-200 text-sm">Higher Education Commission — Course Evaluation Proforma</p>
          </div>
        </div>
      </div>

      {}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Select Semester</label>
            <select value={selectedSem} onChange={e => setSelectedSem(e.target.value)} className="input-field">
              <option value="">-- Select Semester --</option>
              {SEMESTERS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {selectedSem && (
            <div>
              <label className="label">Select Course</label>
              <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="input-field">
                <option value="">-- Select Course --</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.courseCode} — {c.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Student Info */}
      {selectedCourse && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 text-sm">
          <p className="font-semibold text-blue-800">
            Course Evaluation for {userProfile.rollNumber} — {courses.find(c => c.id === selectedCourse)?.name}
          </p>
        </div>
      )}

      {}
      {selectedCourse && !loading && (
        <>
          {submitted && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-green-800 text-sm font-medium">
                ✓ Your HEC Course Evaluation form has been submitted for this course. Thank you for your cooperation.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {SECTIONS.map(section => (
              <div key={section.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className={`${section.color} px-5 py-3`}>
                  <h3 className="text-white font-bold text-sm">{section.title}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase w-1/2">QUESTION</th>
                        {SCALE.map(s => (
                          <th key={s} className="text-center text-xs font-bold text-gray-600 uppercase py-3 px-2" style={{ minWidth:'80px' }}>
                            {s}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.questions.map(q => (
                        <LikertRow key={q} question={q} value={responses[q]} onChange={v => setResponse(q, v)} disabled={submitted} />
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 border-t border-gray-100">
                  <textarea
                    placeholder="Comments (optional)..."
                    disabled={submitted}
                    className="input-field text-sm"
                    rows={2}
                  />
                </div>
              </div>
            ))}

            {}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <label className="label">Overall Comments / Suggestions</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                disabled={submitted}
                placeholder="Any additional comments about the course or teacher..."
                className="input-field"
                rows={3}
              />
            </div>

            {}
            <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Progress: <span className={`font-bold ${isComplete ? 'text-green-600' : 'text-orange-600'}`}>
                    {answeredCount}/{allQuestions.length} questions answered
                  </span>
                </p>
                <div className="w-48 h-2 bg-gray-100 rounded-full mt-1">
                  <div className="h-2 rounded-full bg-green-500 transition-all" style={{ width:`${(answeredCount/allQuestions.length)*100}%` }} />
                </div>
              </div>
              {!submitted && (
                <button onClick={handleSubmit} disabled={submitting || !isComplete}
                  className="btn-primary disabled:opacity-50">
                  {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {submitting ? 'Submitting...' : 'Submit Evaluation'}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
