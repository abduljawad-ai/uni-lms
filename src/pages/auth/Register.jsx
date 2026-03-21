
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { GraduationCap, Eye, EyeOff, User, Mail, Phone, Lock } from 'lucide-react'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirm: '', role: 'student'
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) return toast.error('Fill all required fields')
    if (form.password !== form.confirm) return toast.error('Passwords do not match')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      await register({
        email: form.email,
        password: form.password,
        displayName: form.name,
        role: form.role,
        phone: form.phone,
      })
      toast.success(form.role === 'teacher'
        ? 'Registered! Await admin approval before login.'
        : 'Account created! Please sign in.')
      navigate('/login')
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use' ? 'Email already registered'
        : err.code === 'auth/weak-password' ? 'Password is too weak'
          : 'Registration failed. Try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1e3a5f] relative overflow-hidden items-center justify-center p-12">
        {}
        <div className="absolute inset-0 z-0">
          <img src={`${import.meta.env.BASE_URL}images/auth-side.png`} alt="University Hallway" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f] via-[#1e3a5f]/80 to-transparent"></div>
        </div>
        <div className="relative z-10 w-full max-w-lg">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
              <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="UniPortal Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-white font-bold text-xl" style={{ fontFamily: 'Outfit, sans-serif' }}>UniPortal</div>
              <div className="text-blue-300 text-xs">Join our Learning Community</div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Start Your Journey<br />with UniPortal
          </h1>
          <p className="text-blue-200 text-lg mb-8">
            Create your account today and get access to modern learning tools, digital resources, and real-time academic tracking.
          </p>
          <div className="space-y-4">
            {[
              { icon: '🚀', text: 'Quick and easy registration' },
              { icon: '🔒', text: 'Secure student & teacher profiles' },
              { icon: '📱', text: 'Access from any device' },
              { icon: '🌐', text: 'Join 1,000+ active students' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-blue-100">
                <span className="text-xl">{f.icon}</span>
                <span className="text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-12 left-12 z-10 text-blue-300 text-xs">
          © 2026 UniPortal — Vibecoded by <span className="text-white font-bold">Jawad</span>
        </div>
      </div>

      {}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-cover bg-center bg-no-repeat bg-gray-50 overflow-y-auto" style={{ backgroundImage: `url('${import.meta.env.BASE_URL}images/auth-bg.png')` }}>
        <div className="w-full max-w-md py-12">
          {}
          <div className="flex lg:hidden items-center gap-3 justify-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg mb-4 overflow-hidden">
              <img src="/images/logo.png" alt="UniPortal Logo" className="w-full h-full object-cover" />
            </div>
            <div className="text-[#1e3a5f] font-bold text-xl" style={{ fontFamily: 'Outfit, sans-serif' }}>UniPortal</div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-[#1e3a5f] mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>Create Account</h2>
            <p className="text-gray-500 text-sm mb-6">Join your university portal</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="Muhammad Ahmed" required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="you@university.edu.pk" required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                    placeholder="03XX-XXXXXXX"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)}
                      placeholder="Min 6 chars" required
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type={showPass ? 'text' : 'password'} value={form.confirm} onChange={e => set('confirm', e.target.value)}
                      placeholder="Repeat" required
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] text-sm" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" required className="w-4 h-4 text-[#1e3a5f] border-gray-300 rounded focus:ring-[#1e3a5f]" />
                <label className="text-xs text-gray-500">
                  I agree to the <span className="text-[#1e3a5f] font-semibold cursor-pointer">Terms</span> and <span className="text-[#1e3a5f] font-semibold cursor-pointer">Privacy Policy</span>
                </label>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-[#1e3a5f] text-white py-3 rounded-xl font-semibold hover:bg-[#162a47] transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 mt-4">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Creating Account...</>
                ) : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-[#1e3a5f] font-semibold hover:underline">Sign In here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
