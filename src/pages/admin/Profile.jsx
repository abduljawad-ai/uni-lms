
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase/config'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { User, Mail, Phone, Lock, Save, Building2, GraduationCap } from 'lucide-react'
import { seedInitialData } from '../../firebase/seed'

export default function AdminProfile() {
  const { userProfile, updateProfile, changePassword } = useAuth()
  const [form, setForm] = useState({
    name: userProfile?.name || '',
    phone: userProfile?.phone || '',
    universityName: userProfile?.universityName || '',
    universityAddress: userProfile?.universityAddress || '',
  })
  const [pwForm, setPwForm] = useState({ current:'', newPw:'', confirm:'' })
  const [saving, setSaving] = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile(form)
      toast.success('Profile updated!')
    } catch { toast.error('Failed') } finally { setSaving(false) }
  }

  const handlePwChange = async (e) => {
    e.preventDefault()
    if (pwForm.newPw !== pwForm.confirm) return toast.error('Passwords do not match')
    setChangingPw(true)
    try {
      await changePassword(pwForm.current, pwForm.newPw)
      toast.success('Password changed!')
      setPwForm({ current:'', newPw:'', confirm:'' })
    } catch (e) {
      toast.error(e.code === 'auth/wrong-password' ? 'Wrong current password' : 'Failed')
    } finally { setChangingPw(false) }
  }

  const handleSeed = async () => {
    if (!confirm('This will seed initial departments, programs, and batches into Firestore. Continue?')) return
    setSeeding(true)
    try {
      await seedInitialData()
      toast.success('Initial data seeded successfully! Departments, programs, and batches are ready.')
    } catch (e) {
      console.error(e)
      toast.error('Seeding failed — check Firebase connection and rules.')
    } finally { setSeeding(false) }
  }

  const initials = userProfile?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) || 'AD'

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h1 className="text-2xl font-bold text-[#0d1f35]" style={{fontFamily:'Outfit,sans-serif'}}>Admin Profile</h1>

      {}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-5">
        <div className="w-20 h-20 bg-[#0d1f35] rounded-2xl flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-2xl">{initials}</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800" style={{fontFamily:'Outfit,sans-serif'}}>{userProfile?.name}</h2>
          <p className="text-gray-500 text-sm">{userProfile?.email}</p>
          <span className="badge-red mt-1 inline-block">System Administrator</span>
        </div>
      </div>

      {}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-5" style={{fontFamily:'Outfit,sans-serif'}}>Edit Profile & University Info</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-2"><User className="w-4 h-4"/>Full Name</label>
              <input type="text" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} className="input-field" required/>
            </div>
            <div>
              <label className="label flex items-center gap-2"><Phone className="w-4 h-4"/>Phone</label>
              <input type="tel" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} className="input-field" placeholder="03XX-XXXXXXX"/>
            </div>
          </div>
          <div>
            <label className="label flex items-center gap-2"><GraduationCap className="w-4 h-4"/>University Name</label>
            <input type="text" value={form.universityName} onChange={e=>setForm(p=>({...p,universityName:e.target.value}))} className="input-field" placeholder="University of XYZ, Pakistan"/>
          </div>
          <div>
            <label className="label flex items-center gap-2"><Building2 className="w-4 h-4"/>University Address / Campus</label>
            <input type="text" value={form.universityAddress} onChange={e=>setForm(p=>({...p,universityAddress:e.target.value}))} className="input-field" placeholder="Main Campus, City, Province"/>
          </div>
          <div>
            <label className="label flex items-center gap-2"><Mail className="w-4 h-4"/>Email</label>
            <input type="email" value={userProfile?.email||''} disabled className="input-field bg-gray-50 text-gray-400 cursor-not-allowed"/>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<Save className="w-4 h-4"/>}
            {saving?'Saving...':'Save Changes'}
          </button>
        </form>
      </div>

      {}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-5" style={{fontFamily:'Outfit,sans-serif'}}>Change Password</h3>
        <form onSubmit={handlePwChange} className="space-y-4">
          {[['Current Password','current'],['New Password','newPw'],['Confirm New Password','confirm']].map(([l,k])=>(
            <div key={k}>
              <label className="label flex items-center gap-2"><Lock className="w-4 h-4"/>{l}</label>
              <input type="password" value={pwForm[k]} onChange={e=>setPwForm(p=>({...p,[k]:e.target.value}))} className="input-field" placeholder="••••••••" required/>
            </div>
          ))}
          <button type="submit" disabled={changingPw} className="btn-primary">
            {changingPw?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<Lock className="w-4 h-4"/>}
            {changingPw?'Changing...':'Change Password'}
          </button>
        </form>
      </div>

      {}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <h3 className="font-bold text-amber-900 mb-2" style={{fontFamily:'Outfit,sans-serif'}}>🌱 Initial Data Seed</h3>
        <p className="text-amber-800 text-sm mb-4">
          First-time setup: Click below to populate Firestore with default departments, degree programs, and batches. Run this <strong>only once</strong> when you first set up the system.
        </p>
        <button onClick={handleSeed} disabled={seeding}
          className="bg-amber-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-amber-700 transition-all disabled:opacity-60 flex items-center gap-2 text-sm">
          {seeding ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : '🌱'}
          {seeding ? 'Seeding...' : 'Seed Initial Data'}
        </button>
      </div>
    </div>
  )
}
