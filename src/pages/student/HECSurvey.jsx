
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase/config'
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore'
import { Mic2, CheckCircle, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { useEffect } from 'react'

const SCALE = ['Strongly Agree','Agree','Uncertain','Disagree','Strongly Disagree']
const YES_NO = ['Yes','No','Sometimes']
const QUALITY = ['Excellent','Good','Average','Poor','Very Poor']
const SPEED = ['Very Fast','Fast','Average','Slow','Very Slow']

const SECTIONS = [
  {
    title: 'INTERNET AVAILABILITY',
    color: 'bg-blue-600',
    questions: [
      { q: 'I have access to internet at home?', opts: YES_NO },
      { q: 'I have access to internet at university?', opts: YES_NO },
      { q: 'I use mobile data for online classes?', opts: YES_NO },
      { q: 'Internet connectivity is stable during online classes?', opts: SCALE },
    ]
  },
  {
    title: 'QUALITY OF ONLINE EDUCATION',
    color: 'bg-green-600',
    questions: [
      { q: 'How would you rate the overall quality of online education?', opts: QUALITY },
      { q: 'Online classes are conducted regularly?', opts: SCALE },
      { q: 'Teachers are well prepared for online classes?', opts: SCALE },
      { q: 'Online learning is as effective as physical learning?', opts: SCALE },
    ]
  },
  {
    title: 'CONNECTIVITY ISSUES',
    color: 'bg-orange-600',
    questions: [
      { q: 'How often do you face connectivity issues during online classes?', opts: ['Always','Often','Sometimes','Rarely','Never'] },
      { q: 'Poor internet speed affects my learning significantly?', opts: SCALE },
      { q: 'I can submit assignments on time despite connectivity issues?', opts: SCALE },
    ]
  },
  {
    title: 'DEVICE AND ACCESS',
    color: 'bg-purple-600',
    questions: [
      { q: 'I own a personal computer/laptop?', opts: YES_NO },
      { q: 'I share a device with family members for online classes?', opts: YES_NO },
      { q: 'My device is adequate for attending online classes?', opts: SCALE },
    ]
  },
]

export default function HECSurvey() {
  const { userProfile } = useAuth()
  const [responses, setResponses] = useState({})
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const checkExisting = async () => {
      if (!userProfile?.uid) return
      try {
        const snap = await getDoc(doc(db, 'hecSurveys', userProfile.uid))
        if (snap.exists()) {
          setResponses(snap.data().responses || {})
          setComment(snap.data().comment || '')
          setSubmitted(true)
        }
      } catch { }
    }
    checkExisting()
  }, [userProfile])

  const setResp = (q, v) => setResponses(p => ({ ...p, [q]: v }))

  const allQs = SECTIONS.flatMap(s => s.questions.map(q => q.q))
  const answered = allQs.filter(q => responses[q]).length
  const isComplete = answered === allQs.length

  const handleSubmit = async () => {
    if (!isComplete) return toast.error(`Please answer all ${allQs.length} questions`)
    setSubmitting(true)
    try {
      await setDoc(doc(db, 'hecSurveys', userProfile.uid), {
        studentId: userProfile.uid,
        studentName: userProfile.name,
        rollNumber: userProfile.rollNumber || '',
        program: userProfile.program || '',
        responses,
        comment,
        submittedAt: serverTimestamp(),
      })
      setSubmitted(true)
      toast.success('HEC Survey submitted! Thank you for your cooperation.')
    } catch (e) { console.error(e); toast.error('Submission failed') } finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#1e3a5f] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <Mic2 className="w-6 h-6 text-blue-300" />
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily:'Outfit,sans-serif' }}>STUDENT SURVEY</h1>
            <p className="text-blue-200 text-sm">Availability of Internet, Connectivity Issues, and Quality of Online Education</p>
          </div>
        </div>
      </div>

      {submitted ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-green-700 font-bold text-lg" style={{ fontFamily:'Outfit,sans-serif' }}>
            ✈ Your HEC survey form is successfully submitted.
          </p>
          <p className="text-gray-500 mt-2 flex items-center justify-center gap-1">
            ♡ Thanks for your Cooperation
          </p>
        </div>
      ) : (
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
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider" style={{ minWidth:'260px' }}>QUESTION</th>
                      {section.questions[0].opts.map(o => (
                        <th key={o} className="text-center text-xs font-bold text-gray-600 uppercase py-3 px-2" style={{ minWidth:'80px' }}>{o}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.questions.map(({ q, opts }) => (
                      <tr key={q} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700">{q}</td>
                        {opts.map(opt => (
                          <td key={opt} className="text-center py-3">
                            <input
                              type="radio"
                              name={q}
                              value={opt}
                              checked={responses[q] === opt}
                              onChange={() => setResp(q, opt)}
                              className="w-4 h-4 accent-[#1e3a5f] cursor-pointer"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <label className="label">Additional Comments / Suggestions</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="input-field"
              rows={3}
              placeholder="Any suggestions to improve online education quality..."
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm text-gray-600">
                Progress: <span className={`font-bold ${isComplete ? 'text-green-600' : 'text-orange-600'}`}>
                  {answered}/{allQs.length} answered
                </span>
              </p>
              <div className="w-48 h-2 bg-gray-100 rounded-full mt-1">
                <div className="h-2 rounded-full bg-green-500 transition-all" style={{ width:`${(answered/allQs.length)*100}%` }} />
              </div>
            </div>
            <button onClick={handleSubmit} disabled={submitting || !isComplete} className="btn-primary disabled:opacity-50">
              {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? 'Submitting...' : 'Submit Survey'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
