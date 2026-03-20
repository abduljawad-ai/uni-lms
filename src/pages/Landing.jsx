// src/pages/Landing.jsx
import { Link } from 'react-router-dom'
import { GraduationCap, BookOpen, Users, Shield, ArrowRight, CheckCircle, Smartphone, Layout, Globe } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
                <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="UniPortal Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="text-[#1e3a5f] font-bold text-xl" style={{ fontFamily: 'Outfit, sans-serif' }}>UniPortal</div>
                <div className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">University LMS</div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-[#1e3a5f] font-medium transition-colors">Features</a>
              <a href="#about" className="text-gray-600 hover:text-[#1e3a5f] font-medium transition-colors">About</a>
              <Link to="/login" className="text-gray-600 hover:text-[#1e3a5f] font-medium transition-colors">Sign In</Link>
              <Link to="/register" className="bg-[#1e3a5f] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#162a47] transition-all shadow-lg shadow-blue-900/10">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex items-center gap-16">
            <div className="lg:w-1/2 mb-12 lg:mb-0">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-[#1e3a5f] px-4 py-2 rounded-full text-sm font-bold mb-6">
                <Globe className="w-4 h-4" />
                <span>#1 Open Source LMS for Pakistan</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-[#1e3a5f] leading-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Modern Learning for <span className="text-blue-600">Modern Universities</span>
              </h1>
              <p className="text-xl text-gray-500 mb-10 leading-relaxed">
                Empowering Pakistani educational institutions with a beautiful, powerful, and easy-to-use Learning Management System. Built with the latest tech for students, teachers, and admins.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="bg-[#1e3a5f] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-[#162a47] transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20">
                  Start Your Journey <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/login" className="bg-white text-[#1e3a5f] border-2 border-gray-100 px-8 py-4 rounded-2xl font-bold text-lg hover:border-[#1e3a5f] transition-all flex items-center justify-center gap-2">
                  Student Login
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-6 text-gray-400">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200"></div>
                  ))}
                </div>
                <p className="text-sm font-medium">Joined by <span className="text-[#1e3a5f] font-bold">1,000+</span> students this month</p>
              </div>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-blue-900/20 group">
                <img src={`${import.meta.env.BASE_URL}images/hero.png`} alt="University Campus" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1e3a5f]/40 to-transparent"></div>
              </div>
              {/* Floating Cards */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce-slow">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase">Attendance</p>
                  <p className="text-sm font-bold text-[#1e3a5f]">98% Success Rate</p>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-float">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Layout className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase">Dashboard</p>
                  <p className="text-sm font-bold text-[#1e3a5f]">Real-time Analytics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Active Students', value: '10K+', icon: <Users className="w-5 h-5" /> },
              { label: 'Certified Teachers', value: '500+', icon: <BookOpen className="w-5 h-5" /> },
              { label: 'Uni Departments', value: '25+', icon: <Building2 className="w-5 h-5" /> },
              { label: 'Digital Materials', value: '15K+', icon: <Layout className="w-5 h-5" /> },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-12 h-12 bg-blue-50 text-[#1e3a5f] rounded-xl flex items-center justify-center mb-4">
                  {s.icon}
                </div>
                <p className="text-3xl font-extrabold text-[#1e3a5f] mb-1">{s.value}</p>
                <p className="text-gray-500 text-sm font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portals Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-[#1e3a5f] mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Tailored Portals for Everyone</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">One system, three distinct experiences. Designed specifically for the unique roles in a university ecosystem.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Student Portal */}
            <div className="group bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="aspect-video rounded-2xl overflow-hidden mb-8">
                <img src={`${import.meta.env.BASE_URL}images/student.png`} alt="Student Portal" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-[#1e3a5f] mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Student Portal</h3>
              <ul className="space-y-3 mb-8">
                {['Course Enrollment', 'Attendance Tracking', 'Exam Results', 'Digital Library'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-600 text-sm font-medium">
                    <CheckCircle className="w-4 h-4 text-blue-500" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/login" className="inline-flex items-center gap-2 text-[#1e3a5f] font-bold hover:gap-3 transition-all">
                Learn more <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Teacher Portal */}
            <div className="group bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="aspect-video rounded-2xl overflow-hidden mb-8">
                <img src={`${import.meta.env.BASE_URL}images/teacher.png`} alt="Teacher Portal" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-[#1e3a5f] mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Teacher Portal</h3>
              <ul className="space-y-3 mb-8">
                {['Mark Attendance', 'Result Entry', 'Material Sharing', 'Digital Assignments'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-600 text-sm font-medium">
                    <CheckCircle className="w-4 h-4 text-purple-500" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/login" className="inline-flex items-center gap-2 text-[#1e3a5f] font-bold hover:gap-3 transition-all">
                Learn more <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Admin Panel */}
            <div className="group bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="aspect-video rounded-2xl overflow-hidden mb-8">
                <img src={`${import.meta.env.BASE_URL}images/library.png`} alt="Admin Panel" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-[#1e3a5f] mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Admin Console</h3>
              <ul className="space-y-3 mb-8">
                {['User Management', 'Course Planning', 'Fee Management', 'Notice Board'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-600 text-sm font-medium">
                    <CheckCircle className="w-4 h-4 text-green-500" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/login" className="inline-flex items-center gap-2 text-[#1e3a5f] font-bold hover:gap-3 transition-all">
                Learn more <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#1e3a5f] rounded-[3rem] p-12 lg:p-20 relative overflow-hidden text-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 left-0 w-96 h-96 rounded-full border-8 border-white -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full border-8 border-white translate-x-1/2 translate-y-1/2"></div>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Ready to Modernize Your University?
              </h2>
              <p className="text-blue-200 text-xl max-w-2xl mx-auto mb-10">
                Join our mission to provide every Pakistani university with top-tier digital infrastructure. Free, open source, and built for you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register" className="bg-white text-[#1e3a5f] px-10 py-4 rounded-2xl font-extrabold text-lg hover:bg-blue-50 transition-all shadow-xl shadow-black/20">
                  Register Now
                </Link>
                <Link to="/login" className="bg-transparent text-white border-2 border-white/20 px-10 py-4 rounded-2xl font-extrabold text-lg hover:bg-white/10 transition-all">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white pt-20 pb-10 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
                  <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="UniPortal Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-[#1e3a5f] font-bold text-xl" style={{ fontFamily: 'Outfit, sans-serif' }}>UniPortal</div>
                  <div className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">University LMS</div>
                </div>
              </div>
              <p className="text-gray-500 max-w-sm leading-relaxed mb-6">
                An open-source initiative to digitize Pakistani universities. Empowering students and teachers with modern learning tools.
              </p>
              <div className="flex gap-4">
                {/* Social Icons */}
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors">
                    <div className="w-5 h-5 bg-gray-300 rounded-md"></div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[#1e3a5f] font-bold mb-6 uppercase tracking-wider text-xs">Navigation</h4>
              <ul className="space-y-4 text-gray-500 font-medium">
                <li><Link to="/login" className="hover:text-[#1e3a5f] transition-colors">Sign In</Link></li>
                <li><Link to="/register" className="hover:text-[#1e3a5f] transition-colors">Register</Link></li>
                <li><a href="#features" className="hover:text-[#1e3a5f] transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-[#1e3a5f] transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[#1e3a5f] font-bold mb-6 uppercase tracking-wider text-xs">Resources</h4>
              <ul className="space-y-4 text-gray-500 font-medium">
                <li><a href="#" className="hover:text-[#1e3a5f] transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-[#1e3a5f] transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-[#1e3a5f] transition-colors">Open Source</a></li>
                <li><a href="#" className="hover:text-[#1e3a5f] transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-400 text-sm font-medium">
            <p>© 2026 UniPortal. Vibecoded by <span className="text-[#1e3a5f] font-bold">Jawad</span> with ❤️ for Pakistan.</p>
            <div className="flex gap-8">
              <span className="cursor-pointer hover:text-gray-600 transition-colors">Terms of Service</span>
              <span className="cursor-pointer hover:text-gray-600 transition-colors">Privacy Policy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Building2(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
  )
}
