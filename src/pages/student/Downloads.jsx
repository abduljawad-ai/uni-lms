
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase/config'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Download, FileText, Printer } from 'lucide-react'

function AdmissionStatement({ userProfile, challans }) {
  const totalFee = challans.reduce((s, c) => s + (c.amount || 0), 0)
  const paidChallans = challans.filter(c => c.status === 'paid')
  const totalPaid = paidChallans.reduce((s, c) => s + (c.amount || 0), 0)

  return (
    <div id="admission-statement-print" style={{ display:'none', padding:'20px', fontFamily:'Arial', fontSize:'11px' }}>
      {}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'2px solid #000', paddingBottom:'10px', marginBottom:'10px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'60px', height:'60px', border:'2px solid #1e3a5f', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', color:'#1e3a5f' }}>LOGO</div>
          <div>
            <div style={{ fontWeight:'bold', fontSize:'16px' }}>{userProfile?.universityName || 'UNIVERSITY OF SINDH'}</div>
            <div style={{ color:'#555' }}>{userProfile?.universityAddress || 'Jamshoro, Sindh, Pakistan'}</div>
          </div>
        </div>
        <div style={{ textAlign:'right', fontSize:'10px' }}>
          <div>Dated: {new Date().toLocaleDateString('en-PK', { day:'numeric', month:'long', year:'numeric' })}</div>
        </div>
      </div>

      <div style={{ textAlign:'center', fontWeight:'bold', fontSize:'14px', marginBottom:'16px' }}>
        ADMISSION FEES PAID CHALLAN DETAILS
      </div>

      {}
      <div style={{ border:'1px solid #000', marginBottom:'12px' }}>
        {[
          ['Application ID', userProfile?.appId || userProfile?.uid?.slice(-6)?.toUpperCase() || '—'],
          ['CNIC No.', userProfile?.cnic || '—'],
          ["Student's Name", userProfile?.name || '—'],
          ["Father's Name", userProfile?.fatherName || '—'],
          ['Surname', userProfile?.surname || '—'],
          ['Degree Program', userProfile?.program || '—'],
          ['Roll No.', userProfile?.rollNumber || '—'],
          ['Category', userProfile?.admissionCategory || 'QUOTA / GENERAL MERIT (JURISDICTION)'],
        ].map(([k, v]) => (
          <div key={k} style={{ display:'flex', borderBottom:'1px solid #ddd', padding:'4px 8px' }}>
            <span style={{ width:'150px', color:'#444', flexShrink:0 }}>{k}:</span>
            <span style={{ fontWeight:'bold' }}>{v}</span>
          </div>
        ))}
      </div>

      {}
      <div style={{ marginBottom:'12px' }}>
        <div style={{ fontWeight:'bold', marginBottom:'6px', textDecoration:'underline' }}>Fees Structure</div>
        <table style={{ width:'100%', borderCollapse:'collapse', border:'1px solid #000', fontSize:'10px' }}>
          <thead>
            <tr style={{ background:'#1e3a5f', color:'#fff' }}>
              {['Class','Semester','Fee Amount','Enrolment / Eligibility Fee','Late Fee','Total Fee'].map(h => (
                <th key={h} style={{ border:'1px solid #000', padding:'4px 6px', textAlign:'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {challans.length === 0 ? (
              <tr><td colSpan={6} style={{ padding:'8px', textAlign:'center', color:'#888' }}>No fee records found</td></tr>
            ) : (
              challans.map((c, i) => (
                <tr key={c.id} style={{ background: i%2===0 ? '#f9f9f9' : '#fff' }}>
                  <td style={{ border:'1px solid #ddd', padding:'4px 6px' }}>{c.part || 'FIRST YEAR'}</td>
                  <td style={{ border:'1px solid #ddd', padding:'4px 6px' }}>{c.semester || 'ANNUAL'}</td>
                  <td style={{ border:'1px solid #ddd', padding:'4px 6px' }}>{c.amount?.toLocaleString() || '0'}</td>
                  <td style={{ border:'1px solid #ddd', padding:'4px 6px' }}>3000.00</td>
                  <td style={{ border:'1px solid #ddd', padding:'4px 6px' }}>0.00</td>
                  <td style={{ border:'1px solid #ddd', padding:'4px 6px', fontWeight:'bold' }}>{((c.amount || 0) + 3000).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr style={{ background:'#f0f0f0', fontWeight:'bold' }}>
              <td colSpan={5} style={{ border:'1px solid #000', padding:'4px 6px', textAlign:'right' }}>Total Admission Fees Amount:</td>
              <td style={{ border:'1px solid #000', padding:'4px 6px' }}>Rs. {totalFee.toLocaleString()}.00</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {}
      <div>
        <div style={{ fontWeight:'bold', marginBottom:'6px', textDecoration:'underline' }}>Paid Admission Fees Record</div>
        <table style={{ width:'100%', borderCollapse:'collapse', border:'1px solid #000', fontSize:'10px' }}>
          <thead>
            <tr style={{ background:'#1e3a5f', color:'#fff' }}>
              {['Class','Challan No.','Paid Amount','Challan Date','Remarks'].map(h => (
                <th key={h} style={{ border:'1px solid #000', padding:'4px 6px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paidChallans.length === 0 ? (
              <tr><td colSpan={5} style={{ padding:'8px', textAlign:'center', color:'#888' }}>No payments yet</td></tr>
            ) : (
              paidChallans.map((c, i) => (
                <tr key={c.id} style={{ background: i%2===0 ? '#f9f9f9' : '#fff' }}>
                  <td style={{ border:'1px solid #ddd', padding:'4px 6px' }}>{c.part || 'FIRST YEAR'}</td>
                  <td style={{ border:'1px solid #ddd', padding:'4px 6px' }}>{c.challanNo || c.id?.slice(-9) || '—'}</td>
                  <td style={{ border:'1px solid #ddd', padding:'4px 6px', fontWeight:'bold' }}>{c.amount?.toLocaleString()}.00</td>
                  <td style={{ border:'1px solid #ddd', padding:'4px 6px' }}>
                    {c.paidAt ? new Date(c.paidAt.toDate?.() || c.paidAt).toLocaleDateString('en-PK') : '—'}
                  </td>
                  <td style={{ border:'1px solid #ddd', padding:'4px 6px' }}>ANNUAL FEE</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop:'30px', fontSize:'10px', color:'#555', borderTop:'1px solid #ddd', paddingTop:'8px' }}>
        This is a computer generated statement. No signature required.
      </div>
    </div>
  )
}

export default function Downloads() {
  const { userProfile } = useAuth()
  const [challans, setChallans] = useState([])

  useEffect(() => {
    const fetch = async () => {
      if (!userProfile?.uid) return
      try {
        const snap = await getDocs(query(collection(db,'challans'), where('studentId','==',userProfile.uid), orderBy('createdAt','desc')))
        setChallans(snap.docs.map(d => ({ id:d.id, ...d.data() })))
      } catch { }
    }
    fetch()
  }, [userProfile])

  const handlePrintAdmission = () => {
    const el = document.getElementById('admission-statement-print')
    if (el) { el.style.display = 'block'; window.print(); el.style.display = 'none' }
  }

  const handlePrintHostelNoDues = () => {
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>Hostel No Dues Certificate</title></head><body style="font-family:Arial;padding:40px;">
      <h2 style="text-align:center;border-bottom:2px solid #000;padding-bottom:10px;">${userProfile?.universityName || 'UNIVERSITY OF SINDH'}</h2>
      <h3 style="text-align:center;">HOSTEL NO DUES CERTIFICATE</h3>
      <p><strong>Student Name:</strong> ${userProfile?.name || '—'}</p>
      <p><strong>Roll No.:</strong> ${userProfile?.rollNumber || '—'}</p>
      <p><strong>Program:</strong> ${userProfile?.program || '—'}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-PK', { day:'numeric', month:'long', year:'numeric' })}</p>
      <p style="margin-top:20px;">This is to certify that the above-mentioned student has <strong>NO DUES</strong> outstanding against the University Hostel.</p>
      <p style="color:red; font-size:12px; margin-top:16px;">Print this document and get it signed from the Provost Office after completing your degree.</p>
      <div style="margin-top:60px; display:flex; justify-content:space-between;">
        <div><p>Student Signature</p><div style="border-top:1px solid #000; width:120px; margin-top:30px;"></div></div>
        <div><p>Provost Signature & Stamp</p><div style="border-top:1px solid #000; width:150px; margin-top:30px;"></div></div>
      </div>
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  const documents = [
    {
      name: 'Admission Fees Statement',
      desc: 'Complete fee payment history and challan details',
      icon: FileText,
      color: 'bg-blue-50 text-blue-600',
      remarks: '',
      onDownload: handlePrintAdmission
    },
    {
      name: 'Hostel No Dues Certificate',
      desc: 'Clearance certificate for hostel',
      icon: FileText,
      color: 'bg-green-50 text-green-600',
      remarks: 'Print this document and get it signed from the Provost Office after completing your degree.',
      onDownload: handlePrintHostelNoDues
    },
  ]

  return (
    <>
      <AdmissionStatement userProfile={userProfile} challans={challans} />

      <div className="space-y-6 animate-fade-in">
        <div className="bg-[#1e3a5f] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <Download className="w-6 h-6 text-blue-300" />
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily:'Outfit,sans-serif' }}>DOWNLOADS</h1>
              <p className="text-blue-200 text-sm">Download and print official university documents</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="table-header">Document Name</th>
                <th className="table-header">Download / Print</th>
                <th className="table-header">Remarks</th>
              </tr></thead>
              <tbody>
                {documents.map(d => (
                  <tr key={d.name} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${d.color}`}>
                          <d.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{d.name}</p>
                          <p className="text-gray-400 text-xs mt-0.5">{d.desc}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={d.onDownload}
                        className="flex items-center gap-2 text-[#1e3a5f] text-sm font-semibold hover:underline">
                        <Printer className="w-4 h-4" /> Download
                      </button>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs italic max-w-xs">{d.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
