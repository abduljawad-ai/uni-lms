// src/pages/student/Challan.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { db } from '../../firebase/config'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { CreditCard, Download, CheckCircle, XCircle, Printer } from 'lucide-react'

function numberToWords(n) {
  if (!n || n === 0) return 'ZERO'
  const a = ['','ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE','TEN','ELEVEN','TWELVE','THIRTEEN','FOURTEEN','FIFTEEN','SIXTEEN','SEVENTEEN','EIGHTEEN','NINETEEN']
  const b = ['','','TWENTY','THIRTY','FORTY','FIFTY','SIXTY','SEVENTY','EIGHTY','NINETY']
  if (n < 20) return a[n]
  if (n < 100) return b[Math.floor(n/10)] + (n%10 ? ' '+a[n%10] : '')
  if (n < 1000) return a[Math.floor(n/100)]+' HUNDRED'+(n%100?' '+numberToWords(n%100):'')
  if (n < 100000) return numberToWords(Math.floor(n/1000))+' THOUSAND'+(n%1000?' '+numberToWords(n%1000):'')
  return numberToWords(Math.floor(n/100000))+' LAKH'+(n%100000?' '+numberToWords(n%100000):'')
}

function ChallanCopyBox({ challan, userProfile, label }) {
  const due = challan.dueDate ? new Date(challan.dueDate.toDate?.() || challan.dueDate).toLocaleDateString('en-PK') : '-'
  return (
    <div style={{ border:'2px solid #333', padding:'8px', fontSize:'9px', fontFamily:'Arial', width:'100%' }}>
      <div style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid #333', paddingBottom:'4px', marginBottom:'4px' }}>
        <div>
          <div style={{ fontWeight:'bold', fontSize:'10px' }}>{userProfile?.universityName || 'UNIVERSITY OF SINDH'}</div>
          <div style={{ color:'#555' }}>Jamshoro, Sindh, Pakistan</div>
          <div style={{ color:'#555' }}>Directorate of Admissions</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontWeight:'bold' }}>1-BILL / HBL</div>
          <div style={{ border:'1px solid #999', width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center', marginLeft:'auto' }}>QR</div>
        </div>
      </div>
      <div style={{ textAlign:'center', fontWeight:'bold', fontSize:'10px', marginBottom:'4px' }}>ADMISSION FEES PAID CHALLAN DETAILS</div>
      <div style={{ color:'#555', textAlign:'center', marginBottom:'4px' }}>Institutional Fee Collection: {challan.semester || 'YTS-31'}</div>
      {[
        ['1-Bill ID', challan.iBillId || '100114509421263304'],
        ['Challan No.', challan.challanNo || challan.id?.slice(-9) || '212633049'],
        ['Valid upto', due],
        ['MERIT CATEGORY',''],
        ['Roll No', userProfile?.rollNumber || '-'],
        ['Seat No.', userProfile?.seatNo || '-'],
        ['App ID', userProfile?.appId || '-'],
        ["Student's Name", userProfile?.name || '-'],
        ["Father's Name", userProfile?.fatherName || '-'],
        ['Surname', userProfile?.surname || '-'],
        ['Class', challan.part || 'SECOND YEAR'],
        ['Program', userProfile?.program || '-'],
        ['Campus', userProfile?.universityAddress || userProfile?.department || '-'],
      ].map(([k,v]) => k === 'MERIT CATEGORY' ? (
        <div key={k} style={{ background:'#111', color:'#fff', textAlign:'center', fontWeight:'bold', padding:'2px', margin:'3px 0' }}>{k}</div>
      ) : (
        <div key={k} style={{ display:'flex', borderBottom:'1px solid #eee', padding:'1px 0' }}>
          <span style={{ width:'95px', flexShrink:0, color:'#555' }}>{k}:</span>
          <span style={{ fontWeight:'600' }}>{v}</span>
        </div>
      ))}
      <div style={{ border:'1px solid #333', marginTop:'4px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', padding:'2px 4px', background:'#f0f0f0', fontWeight:'bold' }}>
          <span>{challan.semester || 'THIRD SEMESTER'} FEE</span>
          <span>Rs. {challan.amount?.toLocaleString() || '0'}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', padding:'2px 4px', borderTop:'1px solid #333', fontWeight:'bold' }}>
          <span>TOTAL FEE</span>
          <span>Rs. {challan.amount?.toLocaleString() || '0'}</span>
        </div>
      </div>
      <div style={{ marginTop:'3px', color:'#333' }}>
        Amount (in words): {numberToWords(challan.amount || 0)} ONLY
      </div>
      <div style={{ marginTop:'4px', border:'1px solid #999', padding:'4px', fontSize:'8px', background:'#fafafa' }}>
        <strong>IMPORTANT NOTE:</strong> The criteria for promotion to next higher classes shall be according to the rules and regulations of the University. The provisional admission is allowed on the basis of data provided/submitted by the candidate. In case any applicant submitted/provided wrong information, admission shall be cancelled.
      </div>
      <div style={{ textAlign:'center', marginTop:'4px', fontWeight:'bold', fontSize:'8px' }}>
        Scan this QR code to verify payment &nbsp;&nbsp; Powered by: ITSC, University.
      </div>
      <div style={{ textAlign:'center', fontWeight:'bold', borderTop:'1px solid #333', marginTop:'4px', paddingTop:'3px' }}>
        — {label} —
      </div>
    </div>
  )
}

export default function StudentChallan() {
  const { userProfile } = useAuth()
  const [challans, setChallans] = useState([])
  const [loading, setLoading] = useState(true)
  const [printChallan, setPrintChallan] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      if (!userProfile?.uid) return setLoading(false)
      try {
        const snap = await getDocs(query(
          collection(db, 'challans'),
          where('studentId', '==', userProfile.uid),
          orderBy('createdAt', 'desc')
        ))
        setChallans(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch { } finally { setLoading(false) }
    }
    fetch()
  }, [userProfile])

  const handlePrint = (c) => {
    setPrintChallan(c)
    setTimeout(() => window.print(), 200)
  }

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #challan-print { display: block !important; }
        }
        #challan-print { display: none; }
      `}</style>

      {printChallan && (
        <div id="challan-print" style={{ padding:'16px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
            {['BANK COPY','STUDENT COPY','ACCOUNTS COPY','OFFICE COPY'].map(lbl => (
              <ChallanCopyBox key={lbl} challan={printChallan} userProfile={userProfile} label={lbl} />
            ))}
          </div>
          <div style={{ textAlign:'center', color:'red', fontWeight:'bold', marginTop:'8px', fontSize:'11px' }}>
            Please DO NOT pay this challan at Easypaisa / UBL Omni / TCS / JazzCash.
          </div>
          <div style={{ textAlign:'center', color:'#555', fontSize:'10px', marginTop:'4px' }}>
            This page is only for the information of payment method. DO NOT PRINT this page.
          </div>
        </div>
      )}

      <div className="space-y-6 animate-fade-in">
        <div className="bg-[#1e3a5f] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-blue-300" />
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily:'Outfit,sans-serif' }}>Admission Fees Statement</h1>
              <p className="text-blue-200 text-sm">Fee challan details and payment history</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-sm">
          ⚠️ If you have paid hostel challan please wait for 2 working days to get PAID status, yet the fee is not marked as paid ask the concerned provost for update the fee ledger of your payment date.
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-[#1e3a5f] px-5 py-3">
            <h3 className="text-white font-bold" style={{ fontFamily:'Outfit,sans-serif' }}>Paid / Unpaid Challans</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin mx-auto" /></div>
          ) : challans.length === 0 ? (
            <div className="p-8 text-center">
              <CreditCard className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No challans issued yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr>
                  <th className="table-header">PAYMENT</th>
                  <th className="table-header">CHALLAN TITLE</th>
                  <th className="table-header">PART</th>
                  <th className="table-header">SEMESTER</th>
                  <th className="table-header">AMOUNT</th>
                  <th className="table-header">DUE DATE</th>
                  <th className="table-header">DOWNLOAD CHALLAN</th>
                  <th className="table-header">DOWNLOAD ADMISSION FORM</th>
                </tr></thead>
                <tbody>
                  {challans.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        {c.status === 'paid'
                          ? <span className="text-green-600 font-bold text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" />Paid</span>
                          : <span className="text-red-600 font-bold text-xs flex items-center gap-1"><XCircle className="w-3 h-3" />Unpaid</span>}
                      </td>
                      <td className="table-cell font-medium text-sm">{c.title}</td>
                      <td className="table-cell text-xs">{c.part || 'SECOND YEAR'}</td>
                      <td className="table-cell text-xs">{c.semester || 'THIRD SEMESTER'}</td>
                      <td className="table-cell font-bold text-xs">PKR {c.amount?.toLocaleString()}</td>
                      <td className="table-cell text-xs">
                        {c.dueDate ? new Date(c.dueDate.toDate?.() || c.dueDate).toLocaleDateString('en-PK', { day:'2-digit', month:'2-digit', year:'numeric' }) : '-'}
                      </td>
                      <td className="table-cell">
                        <button onClick={() => handlePrint(c)}
                          className="text-[#1e3a5f] text-xs font-semibold hover:underline flex items-center gap-1">
                          <Printer className="w-3.5 h-3.5" /> Click here to Download
                        </button>
                      </td>
                      <td className="table-cell">
                        <button onClick={() => handlePrint(c)}
                          className="text-[#1e3a5f] text-xs font-semibold hover:underline flex items-center gap-1">
                          <Download className="w-3.5 h-3.5" /> Download Admission Form
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
    </>
  )
}
