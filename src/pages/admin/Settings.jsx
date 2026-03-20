// src/pages/admin/Settings.jsx
import { useEffect, useState } from 'react'
import { db } from '../../firebase/config'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { Settings, Save, Bell, BookOpen, CreditCard, GraduationCap, Shield, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    universityName: '',
    universityShortName: '',
    currentAcademicYear: '2025-2026',
    currentSemester: 'Spring 2026',
    allowStudentEnrollment: true,
    allowResultsView: true,
    showAttendanceToStudents: true,
    maintenanceMode: false,
    maxAbsencePercent: 25,
    passingMarks: 50,
    gradingSystem: 'percentage',
    semesterStartDate: '',
    semesterEndDate: '',
    examStartDate: '',
    examEndDate: '',
    footerText: '© 2025 UniPortal — Open Source LMS for Pakistani Universities',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db,'settings','global'))
        if (snap.exists()) setSettings(p=>({...p,...snap.data()}))
      } catch {} finally { setLoading(false) }
    }
    fetch()
  }, [])

  const set = (k,v) => setSettings(p=>({...p,[k]:v}))

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db,'settings','global'), { ...settings, updatedAt: serverTimestamp() }, { merge:true })
      toast.success('Settings saved!')
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  const sections = [
    {
      icon: GraduationCap,
      title: 'University Information',
      color: 'text-blue-600',
      fields: [
        { label:'University Name', key:'universityName', type:'text', placeholder:'University of Sindh, Jamshoro' },
        { label:'Short Name / Abbreviation', key:'universityShortName', type:'text', placeholder:'UOSJ' },
        { label:'Current Academic Year', key:'currentAcademicYear', type:'text', placeholder:'2025-2026' },
        { label:'Current Semester', key:'currentSemester', type:'text', placeholder:'Spring 2026' },
        { label:'Footer Text', key:'footerText', type:'text', placeholder:'Copyright text' },
      ]
    },
    {
      icon: BookOpen,
      title: 'Academic Settings',
      color: 'text-green-600',
      fields: [
        { label:'Semester Start Date', key:'semesterStartDate', type:'date' },
        { label:'Semester End Date', key:'semesterEndDate', type:'date' },
        { label:'Exam Start Date', key:'examStartDate', type:'date' },
        { label:'Exam End Date', key:'examEndDate', type:'date' },
        { label:'Minimum Passing Marks (%)', key:'passingMarks', type:'number', min:0, max:100 },
        { label:'Max Absence Allowed (%)', key:'maxAbsencePercent', type:'number', min:0, max:50 },
      ]
    },
    {
      icon: Bell,
      title: 'Portal Access Toggles',
      color: 'text-purple-600',
      toggles: [
        { label:'Allow Student Self-Enrollment', key:'allowStudentEnrollment', desc:'Students can choose their own program' },
        { label:'Show Results to Students', key:'allowResultsView', desc:'Students can view their exam results' },
        { label:'Show Attendance to Students', key:'showAttendanceToStudents', desc:'Students can see their attendance records' },
        { label:'Maintenance Mode', key:'maintenanceMode', desc:'Temporarily disable portal access (admin only)' },
      ]
    }
  ]

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-[#0d1f35]/20 border-t-[#0d1f35] rounded-full animate-spin"/>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1f35]" style={{fontFamily:'Outfit,sans-serif'}}>System Settings</h1>
          <p className="text-gray-500 text-sm">Configure LMS-wide settings and preferences</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save className="w-4 h-4"/>}
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      {sections.map(section => (
        <div key={section.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <section.icon className={`w-5 h-5 ${section.color}`}/>
            <h3 className="font-bold text-gray-800" style={{fontFamily:'Outfit,sans-serif'}}>{section.title}</h3>
          </div>

          {section.fields && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {section.fields.map(f=>(
                <div key={f.key}>
                  <label className="label">{f.label}</label>
                  <input
                    type={f.type}
                    value={settings[f.key] ?? ''}
                    onChange={e=>set(f.key, f.type==='number' ? parseInt(e.target.value) : e.target.value)}
                    className="input-field"
                    placeholder={f.placeholder}
                    min={f.min}
                    max={f.max}
                  />
                </div>
              ))}
            </div>
          )}

          {section.toggles && (
            <div className="space-y-3">
              {section.toggles.map(t=>(
                <div key={t.key} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{t.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                  </div>
                  <button
                    onClick={()=>set(t.key, !settings[t.key])}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 flex-shrink-0 ml-4 ${settings[t.key] ? 'bg-[#0d1f35]' : 'bg-gray-300'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${settings[t.key] ? 'translate-x-6' : 'translate-x-1'}`}/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Maintenance Warning */}
      {settings.maintenanceMode && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-800 text-sm">
          ⚠️ <strong>Maintenance Mode is ON.</strong> Students and teachers cannot access the portal. Only admins can log in.
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save className="w-4 h-4"/>}
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  )
}
