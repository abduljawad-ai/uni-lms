
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { User, Mail, Phone, Lock, Save, Camera } from 'lucide-react'

export default function StudentProfile() {
  const { userProfile, updateProfile, changePassword } = useAuth()
  const [form, setForm] = useState({ 
    name: userProfile?.name || '', 
    phone: userProfile?.phone || '',
    profileImage: userProfile?.profileImage || ''
  })
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [changingPw, setChangingPw] = useState(false)

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile({ 
        name: form.name, 
        phone: form.phone,
        profileImage: form.profileImage
      })
      toast.success('Profile updated!')
    } catch { toast.error('Failed to update') } finally { setSaving(false) }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (pwForm.newPw !== pwForm.confirm) return toast.error('Passwords do not match')
    if (pwForm.newPw.length < 6) return toast.error('Password too short')
    setChangingPw(true)
    try {
      await changePassword(pwForm.current, pwForm.newPw)
      toast.success('Password changed!')
      setPwForm({ current:'', newPw:'', confirm:'' })
    } catch (e) {
      toast.error(e.code === 'auth/wrong-password' ? 'Wrong current password' : 'Failed to change password')
    } finally { setChangingPw(false) }
  }

  const initials = userProfile?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) || 'ST'

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h1 className="text-2xl font-bold text-[#1e3a5f]" style={{fontFamily:'Outfit,sans-serif'}}>My Profile</h1>

      {}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start gap-6 flex-wrap">
          <div className="relative">
            <div className="w-20 h-20 bg-[#1e3a5f] rounded-2xl flex items-center justify-center">
              {userProfile?.profileImage ? (
                <img src={userProfile.profileImage} alt="" className="w-20 h-20 rounded-2xl object-cover"/>
              ) : (
                <span className="text-white font-bold text-2xl">{initials}</span>
              )}
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800" style={{fontFamily:'Outfit,sans-serif'}}>{userProfile?.name}</h2>
            <p className="text-gray-500 text-sm">{userProfile?.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {userProfile?.rollNumber && <span className="badge-blue">{userProfile.rollNumber}</span>}
              {userProfile?.program && <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full">{userProfile.program}</span>}
              {userProfile?.batch && <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">Batch {userProfile.batch}</span>}
              {userProfile?.currentSemester && <span className="badge-yellow">Semester {userProfile.currentSemester}</span>}
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-5" style={{fontFamily:'Outfit,sans-serif'}}>Edit Profile</h3>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="label flex items-center gap-2"><User className="w-4 h-4"/>Full Name</label>
            <input type="text" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
              className="input-field" required/>
          </div>
          <div>
            <label className="label flex items-center gap-2"><Camera className="w-4 h-4"/>Profile Image URL (External Link)</label>
            <input type="url" value={form.profileImage || ''} onChange={e=>setForm(p=>({...p,profileImage:e.target.value}))}
              placeholder="https://example.com/photo.jpg" className="input-field"/>
            <p className="text-[10px] text-gray-400 mt-1 italic">Tip: Use a free image host like ImgBB or a social media photo link.</p>
          </div>
          <div>
            <label className="label flex items-center gap-2"><Mail className="w-4 h-4"/>Email</label>
            <input type="email" value={userProfile?.email||''} disabled className="input-field bg-gray-50 text-gray-400 cursor-not-allowed"/>
          </div>
          <div>
            <label className="label flex items-center gap-2"><Phone className="w-4 h-4"/>Phone Number</label>
            <input type="tel" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}
              placeholder="03XX-XXXXXXX" className="input-field"/>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save className="w-4 h-4"/>}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-5" style={{fontFamily:'Outfit,sans-serif'}}>Change Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {[
            { label: 'Current Password', key: 'current' },
            { label: 'New Password', key: 'newPw' },
            { label: 'Confirm New Password', key: 'confirm' },
          ].map(f => (
            <div key={f.key}>
              <label className="label flex items-center gap-2"><Lock className="w-4 h-4"/>{f.label}</label>
              <input type="password" value={pwForm[f.key]} onChange={e=>setPwForm(p=>({...p,[f.key]:e.target.value}))}
                placeholder="••••••••" required className="input-field"/>
            </div>
          ))}
          <button type="submit" disabled={changingPw} className="btn-primary">
            {changingPw ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Lock className="w-4 h-4"/>}
            {changingPw ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {}
      {userProfile?.isEnrolled && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4" style={{fontFamily:'Outfit,sans-serif'}}>Enrollment Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['Department', userProfile.department],
              ['Program', userProfile.program],
              ['Batch', userProfile.batch],
              ['Roll Number', userProfile.rollNumber],
              ['Current Semester', `Semester ${userProfile.currentSemester}`],
              ['Year', `Year ${userProfile.currentYear}`],
            ].map(([k,v]) => (
              <div key={k} className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs">{k}</p>
                <p className="font-semibold text-gray-800 mt-0.5">{v||'N/A'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
