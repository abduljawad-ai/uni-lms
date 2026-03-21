
import { useEffect, useState } from 'react'
import { db } from '../../firebase/config'
import {
  collection, getDocs, addDoc, deleteDoc,
  doc, serverTimestamp
} from 'firebase/firestore'
import { GraduationCap, Plus, Trash2, X, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY_FORM = {
  name:            '',
  shortName:       '',
  departmentId:    '',
  degree:          'BS',
  duration:        4,
  totalSemesters:  8,
  isActive:        true,
}

export default function AdminPrograms() {
  const [programs,    setPrograms]    = useState([])
  const [departments, setDepartments] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [search,      setSearch]      = useState('')
  const [form,        setForm]        = useState(EMPTY_FORM)

  useEffect(() => {
    const load = async () => {
      try {
        const [pSnap, dSnap] = await Promise.all([
          getDocs(collection(db, 'programs')),
          getDocs(collection(db, 'departments')),
        ])
        setPrograms(pSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        setDepartments(dSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (e) {
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.departmentId || !form.degree) {
      return toast.error('Fill all required fields')
    }
    setSaving(true)
    try {
      const dept = departments.find(d => d.id === form.departmentId)
      const data = {
        name:           form.name.trim(),
        shortName:      form.shortName.trim() || form.degree + ' ' + form.name.split(' ').map(w => w[0]).join(''),
        departmentId:   form.departmentId,
        departmentName: dept?.name || '',
        degree:         form.degree,
        duration:       parseInt(form.duration),
        totalSemesters: parseInt(form.totalSemesters),
        isActive:       true,
        createdAt:      serverTimestamp(),
      }
      const ref = await addDoc(collection(db, 'programs'), data)
      setPrograms(p => [{ id: ref.id, ...data }, ...p])
      setForm(EMPTY_FORM)
      setShowForm(false)
      toast.success('Program added successfully!')
    } catch (e) {
      console.error(e)
      toast.error('Failed to add program')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this program? This will affect courses linked to it.')) return
    try {
      await deleteDoc(doc(db, 'programs', id))
      setPrograms(p => p.filter(x => x.id !== id))
      toast.success('Program deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const filtered = programs.filter(p =>
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.degree?.toLowerCase().includes(search.toLowerCase()) ||
    p.departmentName?.toLowerCase().includes(search.toLowerCase())
  )

  const degreeTypes = ['BS', 'MS', 'MBA', 'BBA', 'BE', 'MPhil', 'PhD', 'Associate']

  return (
    <div className="space-y-6 animate-fade-in">

      {}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1f35]" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Degree Programs
          </h1>
          <p className="text-gray-500 text-sm">{programs.length} programs in system</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Program
        </button>
      </div>

      {}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Add New Degree Program
            </h3>
            <button onClick={() => setShowForm(false)}>
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {}
              <div className="sm:col-span-2">
                <label className="label">Program Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  className="input-field"
                  required
                  placeholder="e.g. Bachelor of Science in Computer Science"
                />
              </div>

              {}
              <div>
                <label className="label">Short Name (optional)</label>
                <input
                  type="text"
                  value={form.shortName}
                  onChange={e => set('shortName', e.target.value)}
                  className="input-field"
                  placeholder="e.g. BS CS"
                />
                <p className="text-xs text-gray-400 mt-1">Shown on cards and tables</p>
              </div>

              {}
              <div>
                <label className="label">Degree Type *</label>
                <select
                  value={form.degree}
                  onChange={e => set('degree', e.target.value)}
                  className="input-field"
                  required
                >
                  {degreeTypes.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {}
              <div>
                <label className="label">Department *</label>
                <select
                  value={form.departmentId}
                  onChange={e => set('departmentId', e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                {departments.length === 0 && (
                  <p className="text-xs text-red-400 mt-1">
                    No departments found. Add departments first.
                  </p>
                )}
              </div>

              {}
              <div>
                <label className="label">Duration (Years)</label>
                <select
                  value={form.duration}
                  onChange={e => {
                    const yr = parseInt(e.target.value)
                    set('duration', yr)
                    set('totalSemesters', yr * 2)
                  }}
                  className="input-field"
                >
                  {[2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n} Years</option>
                  ))}
                </select>
              </div>

              {}
              <div>
                <label className="label">Total Semesters</label>
                <input
                  type="number"
                  value={form.totalSemesters}
                  onChange={e => set('totalSemesters', e.target.value)}
                  className="input-field"
                  min="1"
                  max="12"
                />
                <p className="text-xs text-gray-400 mt-1">Auto-calculated from duration</p>
              </div>

            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Plus className="w-4 h-4" />
                }
                {saving ? 'Saving...' : 'Add Program'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search programs..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0d1f35] text-sm bg-white"
        />
      </div>

      {}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-[#0d1f35]/20 border-t-[#0d1f35] rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <GraduationCap className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No programs yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Click "Add Program" to create your first degree program
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">#</th>
                  <th className="table-header">Program Name</th>
                  <th className="table-header">Short</th>
                  <th className="table-header">Degree</th>
                  <th className="table-header">Department</th>
                  <th className="table-header">Duration</th>
                  <th className="table-header">Semesters</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Del</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="table-cell text-gray-400 text-xs">{i + 1}</td>
                    <td className="table-cell font-medium text-sm text-[#0d1f35]">{p.name}</td>
                    <td className="table-cell text-xs font-mono font-bold">{p.shortName || '—'}</td>
                    <td className="table-cell">
                      <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-lg">
                        {p.degree}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-gray-500">{p.departmentName || '—'}</td>
                    <td className="table-cell text-xs text-center">{p.duration} yrs</td>
                    <td className="table-cell text-xs text-center">{p.totalSemesters}</td>
                    <td className="table-cell">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                        p.isActive
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}