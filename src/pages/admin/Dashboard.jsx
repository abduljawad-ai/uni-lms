
import { useEffect, useState } from 'react'
import { db } from '../../firebase/config'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { Users, UserCheck, BookOpen, Building2, CreditCard, Bell, TrendingUp, Award, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students:0, teachers:0, courses:0, departments:0, challans:0, notices:0 })
  const [deptData, setDeptData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [students, teachers, courses, depts, challans, notices] = await Promise.all([
          getDocs(query(collection(db,'users'), where('role','==','student'), where('enrollmentStatus','==','APPROVED'))),
          getDocs(query(collection(db,'users'), where('role','==','teacher'), where('isApproved','==',true))),
          getDocs(collection(db,'courses')),
          getDocs(collection(db,'departments')),
          getDocs(collection(db,'challans')),
          getDocs(query(collection(db,'notifications'), where('isActive','==',true))),
        ])
        setStats({ students:students.size, teachers:teachers.size, courses:courses.size, departments:depts.size, challans:challans.size, notices:notices.size })
        const deptMap = {}
        students.docs.forEach(d => {
          const dep = d.data().departmentNameName
          if (dep) { deptMap[dep] = (deptMap[dep] || 0) + 1 }
        })
        setDeptData(Object.entries(deptMap).map(([name,count])=>({name:name.length>20?name.slice(0,20)+'...':name, count})).sort((a,b)=>b.count-a.count).slice(0,6))
      } catch(e){console.error(e)} finally { setLoading(false) }
    }
    fetchStats()
  }, [])

  const statCards = [
    { label:'Total Students', value:stats.students, icon:Users, color:'bg-blue-500', bg:'bg-blue-50', to:'/admin/students' },
    { label:'Teachers', value:stats.teachers, icon:UserCheck, color:'bg-green-500', bg:'bg-green-50', to:'/admin/teachers' },
    { label:'Courses', value:stats.courses, icon:BookOpen, color:'bg-purple-500', bg:'bg-purple-50', to:'/admin/courses' },
    { label:'Departments', value:stats.departments, icon:Building2, color:'bg-orange-500', bg:'bg-orange-50', to:'/admin/departments' },
    { label:'Fee Challans', value:stats.challans, icon:CreditCard, color:'bg-red-500', bg:'bg-red-50', to:'/admin/challans' },
    { label:'Active Notices', value:stats.notices, icon:Bell, color:'bg-yellow-500', bg:'bg-yellow-50', to:'/admin/notices' },
  ]

  const COLORS = ['#1e3a5f','#2d5a8e','#10b981','#f59e0b','#6366f1','#ec4899']

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#0d1f35] rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold" style={{fontFamily:'Outfit,sans-serif'}}>Admin Dashboard</h1>
        <p className="text-blue-300 text-sm mt-1">University LMS Overview — {new Date().toLocaleDateString('en-PK',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(s=>(
          <Link key={s.label} to={s.to} className={`${s.bg} rounded-2xl p-4 border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all`}>
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon className="w-5 h-5 text-white"/>
            </div>
            <p className="text-2xl font-bold text-gray-800">{loading?'..':s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4" style={{fontFamily:'Outfit,sans-serif'}}>Students by Department</h3>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deptData} margin={{top:0,right:10,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8"/>
                <XAxis dataKey="name" tick={{fontSize:11}} />
                <YAxis tick={{fontSize:11}}/>
                <Tooltip contentStyle={{borderRadius:'12px',border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}/>
                <Bar dataKey="count" fill="#1e3a5f" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No enrollment data yet</div>}
        </div>

        {}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4" style={{fontFamily:'Outfit,sans-serif'}}>Quick Actions</h3>
          <div className="space-y-2">
            {[
              { to:'/admin/students', label:'View All Students', icon:Users, color:'text-blue-500' },
              { to:'/admin/teachers', label:'Approve Teachers', icon:UserCheck, color:'text-green-500' },
              { to:'/admin/courses', label:'Manage Courses', icon:BookOpen, color:'text-purple-500' },
              { to:'/admin/challans', label:'Issue Fee Challans', icon:CreditCard, color:'text-orange-500' },
              { to:'/admin/notices', label:'Post New Notice', icon:Bell, color:'text-red-500' },
              { to:'/admin/timetable', label:'Set Timetable', icon:TrendingUp, color:'text-teal-500' },
              { to:'/admin/scholarships', label:'Manage Scholarships', icon:Award, color:'text-yellow-500' },
              { to:'/admin/results', label:'Manage Results', icon:TrendingUp, color:'text-indigo-500' },
            ].map(a=>(
              <Link key={a.to} to={a.to}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-all group">
                <a.icon className={`w-4 h-4 ${a.color}`}/>
                <span className="text-sm font-medium text-gray-700 flex-1">{a.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500"/>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
