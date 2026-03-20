// src/pages/student/Enrollment.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase/config'
import {
  collection, getDocs, doc, addDoc, updateDoc,
  getDoc, serverTimestamp, query, where
} from 'firebase/firestore'
import toast from 'react-hot-toast'
import {
  GraduationCap, CheckCircle, BookOpen,
  Building2, Users, Clock, XCircle
} from 'lucide-react'

export default function StudentEnrollment() {
  const { userProfile, refreshProfile } = useAuth()
  const [departments, setDepartments] = useState([])
  const [programs, setPrograms] = useState([])
  const [batches, setBatches] = useState([])
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const enrollmentStatus = userProfile?.enrollmentStatus || 'NONE'
  const isApproved  = enrollmentStatus === 'APPROVED'
  const isPending   = enrollmentStatus === 'PENDING'
  const isRejected  = enrollmentStatus === 'REJECTED'
  const isNone      = enrollmentStatus === 'NONE'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dSnap, pSnap] = await Promise.all([
          getDocs(collection(db, 'departments')),
          getDocs(collection(db, 'programs')),
        ])
        setDepartments(dSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        setPrograms(pSnap.docs.map(d => ({ id: d.id, ...d.data() })))

        // Try to load batches from settings, fallback to default list
        try {
          const bSnap = await getDoc(doc(db, 'settings', 'batches'))
          if (bSnap.exists()) setBatches(bSnap.data().list || defaultBatches())
          else setBatches(defaultBatches())
        } catch {
          setBatches(defaultBatches())
        }
      } catch (e) {
        toast.error('Failed to load enrollment data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const defaultBatches = () =>
    ['2K19','2K20','2K21','2K22','2K23','2K24','2K25']

  // Filter programs by selected department
  // Tries both departmentId and deptId field names for compatibility
  const filteredPrograms = programs.filter(p =>
    p.departmentId === selectedDept || p.deptId === selectedDept
  )

  const handleSubmitRequest = async () => {
    if (!selectedDept || !selectedProgram || !selectedBatch || !selectedYear) {
      return toast.error('Please select all fields including year of study')
    }

    setSaving(true)
    try {
      const prog = programs.find(p => p.id === selectedProgram)
      const dept = departments.find(d => d.id === selectedDept)

      // 1. Create enrollment request document — status PENDING
      await addDoc(collection(db, 'enrollmentRequests'), {
        studentId:      userProfile.uid,
        studentName:    userProfile.displayName || userProfile.name,
        studentEmail:   userProfile.email,
        departmentId:   selectedDept,
        departmentName: dept?.name || selectedDept,
        programId:      selectedProgram,
        programName:    prog?.name || selectedProgram,
        batchYear:      selectedBatch,
        currentYear:    parseInt(selectedYear),
        status:         'PENDING',
        submittedAt:    serverTimestamp(),
        reviewedAt:     null,
        reviewedBy:     null,
        rejectionReason: null,
      })

      // 2. Update user doc to PENDING — NO roll number, NO course access yet
      await updateDoc(doc(db, 'users', userProfile.uid), {
        enrollmentStatus: 'PENDING',
        // Store selections so admin can see them
        departmentId:     selectedDept,
        departmentName:   dept?.name || selectedDept,
        programId:        selectedProgram,
        programName:      prog?.name || selectedProgram,
        batchYear:        selectedBatch,
        currentYear:      parseInt(selectedYear),
        updatedAt:        serverTimestamp(),
      })

      // 3. Refresh profile so UI updates immediately
      await refreshProfile()

      toast.success('Enrollment request submitted! Please wait for admin approval.')
    } catch (e) {
      console.error(e)
      toast.error('Failed to submit request. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin"></div>
    </div>
  )

  // ── APPROVED STATE ─────────────────────────────────────────
  if (isApproved) return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="bg-[#1e3a5f] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-6 h-6 text-blue-300" />
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>My Enrollment</h1>
            <p className="text-blue-200 text-sm">Your enrollment details</p>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-3">
        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-green-800">Enrollment Approved</p>
          <p className="text-green-700 text-sm mt-1">
            You are officially enrolled. You have full access to your courses, results, and portal.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-[#1e3a5f] px-5 py-3">
          <h3 className="text-white font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Enrollment Details</h3>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-6">
          {[
            { label: 'Roll Number',  value: userProfile.rollNumber },
            { label: 'Department',   value: userProfile.departmentName },
            { label: 'Program',      value: userProfile.programName },
            { label: 'Batch',        value: userProfile.batchYear },
            { label: 'Year',         value: `Year ${userProfile.currentYear}` },
            { label: 'Status',       value: 'Active' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className="font-semibold text-gray-800">{value || '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── PENDING STATE ──────────────────────────────────────────
  if (isPending) return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="bg-[#1e3a5f] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-6 h-6 text-blue-300" />
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Enrollment Status</h1>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 flex items-start gap-4">
        <Clock className="w-8 h-8 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-yellow-800 text-lg">Application Under Review</p>
          <p className="text-yellow-700 text-sm mt-2">
            Your enrollment request has been submitted and is awaiting verification by the admin.
            You will receive full portal access once your fee is verified and enrollment is approved.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-yellow-600 text-xs">Department</p>
              <p className="font-semibold text-yellow-800">{userProfile.departmentName}</p>
            </div>
            <div>
              <p className="text-yellow-600 text-xs">Program</p>
              <p className="font-semibold text-yellow-800">{userProfile.programName}</p>
            </div>
            <div>
              <p className="text-yellow-600 text-xs">Batch</p>
              <p className="font-semibold text-yellow-800">{userProfile.batchYear}</p>
            </div>
            <div>
              <p className="text-yellow-600 text-xs">Year</p>
              <p className="font-semibold text-yellow-800">Year {userProfile.currentYear}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // ── REJECTED STATE ─────────────────────────────────────────
  if (isRejected) return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="bg-[#1e3a5f] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-6 h-6 text-blue-300" />
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Enrollment Status</h1>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
        <XCircle className="w-8 h-8 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-red-800 text-lg">Enrollment Rejected</p>
          <p className="text-red-700 text-sm mt-2">
            Your enrollment request was not approved. Please contact the admin office
            for more information and re-apply after resolving the issue.
          </p>
          <button
            onClick={async () => {
              await updateDoc(doc(db, 'users', userProfile.uid), {
                enrollmentStatus: 'NONE',
                updatedAt: serverTimestamp(),
              })
              await refreshProfile()
            }}
            className="mt-4 bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 transition-all"
          >
            Re-apply
          </button>
        </div>
      </div>
    </div>
  )

  // ── NONE STATE — Show enrollment form ─────────────────────
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="bg-[#1e3a5f] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-6 h-6 text-blue-300" />
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Choose Your Program</h1>
            <p className="text-blue-200 text-sm">Select your department, degree program, batch and year</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>Note:</strong> Submitting this form does <strong>not</strong> immediately enroll you.
        Your request will be reviewed by the admin after fee verification. You will be notified once approved.
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-[#1e3a5f] px-5 py-3">
          <h3 className="text-white font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Enrollment Request Form</h3>
        </div>
        <div className="p-6 space-y-6">

          {/* Department */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <Building2 className="w-4 h-4 text-[#1e3a5f]" /> Select Department
            </label>
            {departments.length === 0 ? (
              <p className="text-gray-400 text-sm">No departments available. Contact admin.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {departments.map(dept => (
                  <button key={dept.id}
                    onClick={() => { setSelectedDept(dept.id); setSelectedProgram('') }}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      selectedDept === dept.id
                        ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 text-[#1e3a5f]'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}>
                    <p className="font-semibold text-sm">{dept.shortName || dept.code || dept.id.toUpperCase()}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{dept.name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Programs */}
          {selectedDept && (
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <BookOpen className="w-4 h-4 text-[#1e3a5f]" /> Select Degree Program
              </label>
              {filteredPrograms.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                  No programs found for this department. Please ask admin to add programs linked to this department.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredPrograms.map(prog => (
                    <button key={prog.id}
                      onClick={() => setSelectedProgram(prog.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedProgram === prog.id
                          ? 'border-[#1e3a5f] bg-[#1e3a5f]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-semibold text-sm ${selectedProgram === prog.id ? 'text-[#1e3a5f]' : 'text-gray-700'}`}>
                            {prog.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {prog.degree || prog.type || ''}{prog.duration ? ` · ${prog.duration} years` : ''}
                          </p>
                        </div>
                        {selectedProgram === prog.id && <CheckCircle className="w-5 h-5 text-[#1e3a5f]" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Batch */}
          {selectedProgram && (
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <Users className="w-4 h-4 text-[#1e3a5f]" /> Select Batch / Session
              </label>
              <div className="flex flex-wrap gap-2">
                {batches.map(b => (
                  <button key={b} onClick={() => setSelectedBatch(b)}
                    className={`px-5 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
                      selectedBatch === b
                        ? 'border-[#1e3a5f] bg-[#1e3a5f] text-white'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Year of Study */}
          {selectedBatch && (
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <GraduationCap className="w-4 h-4 text-[#1e3a5f]" /> Year of Study
              </label>
              <div className="flex gap-3">
                {[1, 2, 3, 4].map(y => (
                  <button key={y} onClick={() => setSelectedYear(String(y))}
                    className={`w-14 h-14 rounded-xl border-2 font-bold text-sm transition-all ${
                      selectedYear === String(y)
                        ? 'border-[#1e3a5f] bg-[#1e3a5f] text-white'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {y}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {selectedDept && selectedProgram && selectedBatch && selectedYear && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-sm font-semibold text-blue-800 mb-3">Enrollment Request Summary</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-blue-500 text-xs">Department</p>
                  <p className="font-semibold text-blue-800">{departments.find(d => d.id === selectedDept)?.name}</p>
                </div>
                <div>
                  <p className="text-blue-500 text-xs">Program</p>
                  <p className="font-semibold text-blue-800">{programs.find(p => p.id === selectedProgram)?.name}</p>
                </div>
                <div>
                  <p className="text-blue-500 text-xs">Batch</p>
                  <p className="font-semibold text-blue-800">{selectedBatch}</p>
                </div>
                <div>
                  <p className="text-blue-500 text-xs">Year</p>
                  <p className="font-semibold text-blue-800">Year {selectedYear}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmitRequest}
            disabled={saving || !selectedDept || !selectedProgram || !selectedBatch || !selectedYear}
            className="bg-[#1e3a5f] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#162a47] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Submitting Request...</>
            ) : (
              <><CheckCircle className="w-4 h-4" />Submit Enrollment Request</>
            )}
          </button>

        </div>
      </div>
    </div>
  )
}