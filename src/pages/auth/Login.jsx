// src/pages/auth/Login.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { GraduationCap, Eye, EyeOff, Lock, Mail, BookOpen } from 'lucide-react'

export default function Login() {
  const { login, userProfile } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState('student')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill all fields')
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      // Navigation handled by App.jsx redirect
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' ? 'Invalid email or password'
        : err.code === 'auth/too-many-requests' ? 'Too many attempts. Try later.'
        : 'Login failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1e3a5f] relative overflow-hidden items-center justify-center p-12">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img src="/images/auth-side.png" alt="University Hallway" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f] via-[#1e3a5f]/80 to-transparent"></div>
        </div>
        <div className="relative z-10 w-full max-w-lg">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
              <img src="/images/logo.png" alt="UniPortal Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-white font-bold text-xl" style={{ fontFamily: 'Outfit, sans-serif' }}>UniPortal</div>
              <div className="text-blue-300 text-xs">Learning Management System</div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Pakistan's Open<br />University LMS
          </h1>
          <p className="text-blue-200 text-lg mb-8">
            Empowering universities across Pakistan with a free, modern, and fully-featured learning management system.
          </p>
          <div className="space-y-4">
            {[
              { icon: '🎓', text: 'Course enrollment & management' },
              { icon: '📊', text: 'Real-time grades & attendance' },
              { icon: '📋', text: 'Digital challans & scholarships' },
              { icon: '🖥️', text: 'Virtual classrooms & materials' },
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

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/images/auth-bg.png')" }}>
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 justify-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg mb-4 overflow-hidden">
              <img src="/images/logo.png" alt="UniPortal Logo" className="w-full h-full object-cover" />
            </div>
            <div className="text-[#1e3a5f] font-bold text-xl" style={{ fontFamily: 'Outfit, sans-serif' }}>UniPortal</div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-[#1e3a5f] mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>Sign In</h2>
            <p className="text-gray-500 text-sm mb-6">Access your university portal</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="your@university.edu.pk" required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] text-sm" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-[#1e3a5f] hover:underline font-medium">Forgot password?</Link>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-[#1e3a5f] text-white py-3 rounded-xl font-semibold hover:bg-[#162a47] transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Signing in...</>
                ) : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#1e3a5f] font-semibold hover:underline">Register here</Link>
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            By signing in, you agree to the university's{' '}
            <span className="text-[#1e3a5f] cursor-pointer hover:underline">Terms of Use</span>
          </p>
        </div>
      </div>
    </div>
  )
}
