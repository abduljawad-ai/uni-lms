// src/pages/teacher/Profile.jsx
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { User, Mail, Phone, Lock, Save, Briefcase } from 'lucide-react'

export default function TeacherProfile() {
  const { userProfile, updateProfile, changePassword } = useAuth()
  const [form, setForm] = useState({
    name: userProfile?.name||'',
    phone: userProfile?.phone||'',
    designation: userProfile?.designation||'',
    specialization: userProfile?.specialization||'',
  })
  const [pwForm, setPwForm] = useState({ current:'', newPw:'', confirm:'' })
  const [saving, setSaving] = useState(false)
  const [changingPw, setChangingPw] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try { await updateProfile(form); toast.success('Profile updated!') }
    catch { toast.error('Failed') } finally { setSaving(false) }
  }

  const handlePwChange = async (e) => {
    e.preventDefault()
    if (pwForm.newPw !== pwForm.confirm) return toast.error('Passwords do not match')
    setChangingPw(true)
    try { await changePassword(pwForm.current, pwForm.newPw); toast.success('Password changed!'); setPwForm({current:'',newPw:'',confirm:''}) }
    catch (e) { toast.error(e.code==='auth/wrong-password'?'Wrong current password':'Failed') }
    finally { setChangingPw(false) }
  }

  const initials = userProfile?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)||'TC'

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h1 className="text-2xl font-bold text-[#1a2e4a]" style={{fontFamily:'Outfit,sans-serif'}}>My Profile</h1>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-[#1a2e4a] rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">{initials}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800" style={{fontFamily:'Outfit,sans-serif'}}>{userProfile?.name}</h2>
            <p className="text-gray-500 text-sm">{userProfile?.email}</p>
            <div className="flex gap-2 mt-2">
              <span className="badge-blue">{userProfile?.designation||'Lecturer'}</span>
              <span className={userProfile?.isApproved?'badge-green':'badge-yellow'}>
                {userProfile?.isApproved?'Approved':'Pending Approval'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-5" style={{fontFamily:'Outfit,sans-serif'}}>Edit Profile</h3>
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
            <div>
              <label className="label flex items-center gap-2"><Briefcase className="w-4 h-4"/>Designation</label>
              <input type="text" value={form.designation} onChange={e=>setForm(p=>({...p,designation:e.target.value}))} className="input-field" placeholder="Lecturer / Asst. Prof."/>
            </div>
            <div>
              <label className="label">Specialization</label>
              <input type="text" value={form.specialization} onChange={e=>setForm(p=>({...p,specialization:e.target.value}))} className="input-field" placeholder="e.g., Machine Learning"/>
            </div>
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
    </div>
  )
}
