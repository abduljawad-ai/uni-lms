
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { GraduationCap, Mail, ArrowLeft } from 'lucide-react'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
      toast.success('Reset email sent!')
    } catch {
      toast.error('Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-12 h-12 bg-[#1e3a5f] rounded-xl flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div className="text-[#1e3a5f] font-bold text-xl" style={{ fontFamily: 'Outfit, sans-serif' }}>UniPortal</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-[#1e3a5f] mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Email Sent!</h2>
              <p className="text-gray-500 text-sm mb-6">Check your inbox for the password reset link.</p>
              <Link to="/login" className="btn-primary justify-center w-full inline-flex">Back to Login</Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-[#1e3a5f] mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>Reset Password</h2>
              <p className="text-gray-500 text-sm mb-6">Enter your email to receive a reset link</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      placeholder="your@university.edu.pk"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] text-sm" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-[#1e3a5f] text-white py-3 rounded-xl font-semibold hover:bg-[#162a47] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : null}
                  Send Reset Link
                </button>
              </form>
              <Link to="/login" className="flex items-center gap-2 text-[#1e3a5f] text-sm font-medium mt-6 hover:underline">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
