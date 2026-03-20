// src/pages/student/Enrollment.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase/config'
import { collection, getDocs, doc, updateDoc, getDoc, serverTimestamp, query, where } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { GraduationCap, CheckCircle, ChevronRight, BookOpen, Building2, Users } from 'lucide-react'

export default function StudentEnrollment() {
  const { userProfile, setUserProfile } = useAuth()
  const [departments, setDepartments] = useState([])
  const [programs, setPrograms] = useState([])
  const [batches, setBatches] = useState([])
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)

  const isEnrolled = userProfile?.isEnrolled && userProfile?.programId

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dSnap, pSnap, bSnap] = await Promise.all([
          getDocs(collection(db, 'departments')),
          getDocs(collection(db, 'programs')),
          getDoc(doc(db, 'settings', 'batches'))
        ])
        setDepartments(dSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        setPrograms(pSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        if (bSnap.exists()) setBatches(bSnap.data().list || [])
        else setBatches(['2K19','2K20','2K21','2K22','2K23','2K24','2K25'])
      } catch (e) {
        toast.error('Failed to load enrollment data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()

    if (isEnrolled) {
      setSelectedDept(userProfile.departmentId || '')
      setSelectedProgram(userProfile.programId || '')
      setSelectedBatch(userProfile.batch || '')
    }
  }, [])

  const filteredPrograms = programs.filter(p => p.departmentId === selectedDept)

  const generateRollNumber = (deptId, batch, uid) => {
    const deptCode = deptId.toUpperCase()
    const suffix = uid.slice(-3).toUpperCase()
    return `${batch}/${deptCode}/${suffix}`
  }

  const handleEnroll = async () => {
    if (!selectedDept || !selectedProgram || !selectedBatch) {
      return toast.error('Please select all fields')
    }
    setSaving(true)
    try {
      const prog = programs.find(p => p.id === selectedProgram)
      const dept = departments.find(d => d.id === selectedDept)

      // Count existing students in this batch/program to assign roll number
      const enrollSnap = await getDocs(query(
        collection(db, 'users'),
        where('programId', '==', selectedProgram),
        where('batch', '==', selectedBatch),
        where('role', '==', 'student')
      ))
      const count = enrollSnap.size + 1
      const rollNumber = `${selectedBatch}/${dept?.shortName || selectedDept.toUpperCase()}/${String(count).padStart(3, '0')}`

      const updates = {
        departmentId: selectedDept,
        department: dept?.name || '',
        programId: selectedProgram,
        program: prog?.name || '',
        batch: selectedBatch,
        rollNumber,
        isEnrolled: true,
        currentSemester: 1,
        currentYear: 1,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(doc(db, 'users', userProfile.uid), updates)
      setUserProfile(prev => ({ ...prev, ...updates }))
      toast.success('🎉 Enrolled successfully! Welcome to your program.')
    } catch (e) {
      console.error(e)
      toast.error('Enrollment failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="bg-[#1e3a5f] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-6 h-6 text-blue-300" />
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Choose Your Program</h1>
            <p className="text-blue-200 text-sm">Select your department, degree program, and batch</p>
          </div>
        </div>
      </div>

      {/* Already enrolled info */}
      {isEnrolled && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800 text-sm">Currently Enrolled</p>
            <p className="text-green-700 text-sm">{userProfile.program} · Batch {userProfile.batch}</p>
            <p className="text-green-600 text-xs mt-1">Roll No: {userProfile.rollNumber}</p>
          </div>
        </div>
      )}

      {/* Enrollment Table (like reference) */}
      {isEnrolled && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-[#1e3a5f] px-5 py-3">
            <h3 className="text-white font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Your Enrollment Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">S.No</th>
                  <th className="table-header">Roll No</th>
                  <th className="table-header">Degree Program</th>
                  <th className="table-header">Batch</th>
                  <th className="table-header">Department</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-50">
                  <td className="table-cell">1</td>
                  <td className="table-cell font-semibold text-[#1e3a5f]">{userProfile.rollNumber}</td>
                  <td className="table-cell font-medium">{userProfile.program}</td>
                  <td className="table-cell">{userProfile.batch}</td>
                  <td className="table-cell">{userProfile.department}</td>
                  <td className="table-cell">
                    <span className="font-bold text-green-600">✓ Selected</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enrollment Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-[#1e3a5f] px-5 py-3">
          <h3 className="text-white font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {isEnrolled ? 'Update Enrollment' : 'New Enrollment'}
          </h3>
        </div>
        <div className="p-6 space-y-5">
          {/* Department */}
          <div>
            <label className="label flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#1e3a5f]" /> Department
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {departments.map(dept => (
                <button key={dept.id} onClick={() => { setSelectedDept(dept.id); setSelectedProgram('') }}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${selectedDept === dept.id
                    ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 text-[#1e3a5f]'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}>
                  <p className="font-semibold text-sm">{dept.shortName || dept.id.toUpperCase()}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{dept.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Programs */}
          {selectedDept && (
            <div className="animate-slide-up">
              <label className="label flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#1e3a5f]" /> Degree Program
              </label>
              {filteredPrograms.length === 0 ? (
                <p className="text-gray-400 text-sm">No programs found for this department.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredPrograms.map(prog => (
                    <button key={prog.id} onClick={() => setSelectedProgram(prog.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${selectedProgram === prog.id
                        ? 'border-[#1e3a5f] bg-[#1e3a5f]/5'
                        : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-semibold text-sm ${selectedProgram === prog.id ? 'text-[#1e3a5f]' : 'text-gray-700'}`}>
                            {prog.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{prog.degree} · {prog.duration} years</p>
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
            <div className="animate-slide-up">
              <label className="label flex items-center gap-2">
                <Users className="w-4 h-4 text-[#1e3a5f]" /> Batch / Session
              </label>
              <div className="flex flex-wrap gap-2">
                {batches.map(b => (
                  <button key={b} onClick={() => setSelectedBatch(b)}
                    className={`px-5 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${selectedBatch === b
                      ? 'border-[#1e3a5f] bg-[#1e3a5f] text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {selectedDept && selectedProgram && selectedBatch && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 animate-slide-up">
              <p className="text-sm font-semibold text-blue-800 mb-2">Enrollment Summary</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><p className="text-blue-500 text-xs">Department</p><p className="font-semibold text-blue-800">{departments.find(d=>d.id===selectedDept)?.name}</p></div>
                <div><p className="text-blue-500 text-xs">Program</p><p className="font-semibold text-blue-800">{programs.find(p=>p.id===selectedProgram)?.name}</p></div>
                <div><p className="text-blue-500 text-xs">Batch</p><p className="font-semibold text-blue-800">{selectedBatch}</p></div>
              </div>
            </div>
          )}

          {/* Submit */}
          <button onClick={handleEnroll} disabled={saving || !selectedDept || !selectedProgram || !selectedBatch}
            className="bg-[#1e3a5f] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#162a47] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Enrolling...</>
            ) : (
              <><CheckCircle className="w-4 h-4" />{isEnrolled ? 'Update Enrollment' : 'Confirm Enrollment'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
