
import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { fetchStudentChallans, downloadChallanPDF } from '../../controllers/challanController'
import { mockInquiry, mockConfirmation, MOCK_BANKS } from '../../services/paymentService'
import { CreditCard, Download, CheckCircle, XCircle, Clock, Search, X, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

function StatusBadge({ status }) {
  const map = {
    UNPAID:    'bg-red-50 text-red-700 border border-red-200',
    PAID:      'bg-green-50 text-green-700 border border-green-200',
    OVERDUE:   'bg-orange-50 text-orange-700 border border-orange-200',
    CANCELLED: 'bg-gray-100 text-gray-500 border border-gray-200',
  }
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${map[status] || map.UNPAID}`}>
      {status}
    </span>
  )
}

function PaymentModal({ challan, onClose, onPaid }) {
  const [step, setStep]           = useState('inquiry')  
  const [consumerNo, setConsumerNo] = useState(challan?.rollNumber || '')
  const [inquiryResult, setInquiryResult] = useState(null)
  const [selectedBank, setSelectedBank]   = useState('')
  const [txnResult, setTxnResult]         = useState(null)
  const [loading, setLoading]             = useState(false)

  const handleInquiry = async () => {
    if (!consumerNo.trim()) return toast.error('Enter your consumer number')
    setLoading(true)
    try {
      const result = await mockInquiry(consumerNo.trim())
      if (!result.found) {
        toast.error(result.message)
        return
      }
      setInquiryResult(result)
      setStep('bank')
    } catch (e) {
      toast.error('Inquiry failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!selectedBank) return toast.error('Please select a payment method')
    setStep('processing')
    try {
      const result = await mockConfirmation({
        challanId: inquiryResult.challanId,
        bankCode:  selectedBank,
        amount:    inquiryResult.amount,
      })
      setTxnResult(result)
      setStep(result.success ? 'receipt' : 'failed')
      if (result.success) onPaid()
    } catch (e) {
      setStep('failed')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {}
        <div className="bg-[#1e3a5f] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-blue-300" />
            <span className="text-white font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {step === 'receipt' ? 'Payment Receipt' : 'Pay Fee Challan'}
            </span>
          </div>
          {step !== 'processing' && (
            <button onClick={onClose} className="text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {}
        {!['processing', 'receipt', 'failed'].includes(step) && (
          <div className="flex items-center px-6 py-3 bg-gray-50 border-b border-gray-100">
            {['inquiry', 'bank'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s ? 'bg-[#1e3a5f] text-white' :
                  ['inquiry','bank'].indexOf(step) > i ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>{i + 1}</div>
                <span className={`ml-1.5 text-xs ${step === s ? 'text-[#1e3a5f] font-semibold' : 'text-gray-400'}`}>
                  {s === 'inquiry' ? 'Verify' : 'Pay'}
                </span>
                {i < 1 && <div className="w-8 h-px bg-gray-200 mx-2" />}
              </div>
            ))}
          </div>
        )}

        <div className="p-6">

          {}
          {step === 'inquiry' && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
                Enter your <strong>Roll Number</strong> or <strong>Challan Number</strong> as the consumer number — same as you would at a bank or ATM.
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Consumer Number</label>
                <input
                  type="text"
                  value={consumerNo}
                  onChange={e => setConsumerNo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInquiry()}
                  placeholder="e.g. 2K23/CS/001 or CHLN-202509-00142"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] font-mono"
                />
              </div>
              <button
                onClick={handleInquiry}
                disabled={loading}
                className="w-full bg-[#1e3a5f] text-white py-3 rounded-xl font-semibold hover:bg-[#162a47] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Checking...</>
                  : <><Search className="w-4 h-4" /> Verify Consumer</>
                }
              </button>
            </div>
          )}

          {}
          {step === 'bank' && inquiryResult && (
            <div className="space-y-4">
              {}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-800">Consumer Verified</span>
                </div>
                {[
                  ['Name',        inquiryResult.studentName],
                  ['Roll No',     inquiryResult.rollNumber],
                  ['Fee',         inquiryResult.feeDescription],
                  ['Amount',      `PKR ${Number(inquiryResult.amount).toLocaleString('en-PK')}`],
                  ['Due Date',    inquiryResult.dueDate],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-green-600">{label}</span>
                    <span className="font-semibold text-green-800">{val}</span>
                  </div>
                ))}
                {inquiryResult.isOverdue && (
                  <div className="flex items-center gap-1 text-orange-600 text-xs mt-1">
                    <AlertCircle className="w-3 h-3" /> This challan is overdue
                  </div>
                )}
              </div>

              {}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Select Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {MOCK_BANKS.map(bank => (
                    <button
                      key={bank.code}
                      onClick={() => setSelectedBank(bank.code)}
                      className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                        selectedBank === bank.code
                          ? 'border-[#1e3a5f] bg-[#1e3a5f]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-lg">{bank.logo}</div>
                      <div className={`text-xs font-semibold mt-0.5 ${selectedBank === bank.code ? 'text-[#1e3a5f]' : 'text-gray-600'}`}>
                        {bank.code}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('inquiry')}
                  className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!selectedBank}
                  className="flex-2 flex-1 bg-[#1e3a5f] text-white py-3 rounded-xl font-semibold hover:bg-[#162a47] transition-all disabled:opacity-50 text-sm"
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          )}

          {}
          {step === 'processing' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin mx-auto" />
              <p className="font-semibold text-gray-800">Processing Payment</p>
              <p className="text-sm text-gray-500">Please wait, do not close this window...</p>
              <div className="flex justify-center gap-1 mt-2">
                {['Connecting to bank', 'Verifying amount', 'Confirming transaction'].map((s, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {}
          {step === 'receipt' && txnResult?.success && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-lg font-bold text-gray-800">Payment Successful!</p>
                <p className="text-sm text-gray-500 mt-1">Your fee has been paid successfully</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100">
                {[
                  ['Transaction ID', txnResult.transactionId],
                  ['Bank',           txnResult.bankName],
                  ['Amount',         `PKR ${Number(inquiryResult?.amount).toLocaleString('en-PK')}`],
                  ['Status',         'PAID'],
                  ['Date',           new Date().toLocaleDateString('en-PK')],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-semibold text-gray-800">{val}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={onClose}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-all"
              >
                Done
              </button>
            </div>
          )}

          {}
          {step === 'failed' && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-lg font-bold text-gray-800">Payment Failed</p>
                <p className="text-sm text-gray-500 mt-1">Transaction was declined. Please try again.</p>
              </div>
              <button
                onClick={() => setStep('bank')}
                className="w-full bg-[#1e3a5f] text-white py-3 rounded-xl font-semibold hover:bg-[#162a47] transition-all"
              >
                Try Again
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function StudentChallan() {
  const { userProfile } = useAuth()
  const [challans, setChallans]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [payingChallan, setPayingChallan] = useState(null)
  const [downloading, setDownloading]   = useState(null)

  const loadChallans = async () => {
    try {
      const data = await fetchStudentChallans(userProfile.uid)
      setChallans(data)
    } catch (e) {
      toast.error('Failed to load challans')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadChallans() }, [])

  const handleDownload = async (challan) => {
    setDownloading(challan.id)
    try {
      await downloadChallanPDF(challan, {
        name:    userProfile?.universityName || 'UniPortal University',
        address: 'University Road, Pakistan',
        phone:   '',
      })
    } catch (e) {
      toast.error('Failed to generate PDF')
    } finally {
      setDownloading(null)
    }
  }

  const handlePaid = () => {
    toast.success('Payment confirmed! Challan updated.')
    loadChallans()
  }

  const unpaid = challans.filter(c => c.status === 'UNPAID' || c.status === 'OVERDUE')
  const paid   = challans.filter(c => c.status === 'PAID')

  return (
    <div className="space-y-6 animate-fade-in">

      {}
      <div className="bg-[#1e3a5f] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-blue-300" />
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Fee Challans</h1>
            <p className="text-blue-200 text-sm">View and pay your fee vouchers</p>
          </div>
        </div>
      </div>

      {}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total',   value: challans.length, color: 'bg-blue-50 text-blue-700' },
          { label: 'Unpaid',  value: unpaid.length,   color: 'bg-red-50 text-red-700' },
          { label: 'Paid',    value: paid.length,     color: 'bg-green-50 text-green-700' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-2xl p-4 text-center`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-[#1e3a5f]/20 border-t-[#1e3a5f] rounded-full animate-spin" />
        </div>
      ) : challans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <CreditCard className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No challans issued yet</p>
          <p className="text-gray-400 text-sm mt-1">Your fee challans will appear here when issued by admin</p>
        </div>
      ) : (
        <div className="space-y-3">
          {challans.map(challan => (
            <div key={challan.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-mono text-sm font-bold text-[#1e3a5f]">{challan.challanNumber}</span>
                    <StatusBadge status={challan.status} />
                  </div>
                  <p className="font-semibold text-gray-800">{challan.feeDescription}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                    <span>Amount: <strong className="text-gray-800">PKR {Number(challan.amount).toLocaleString('en-PK')}</strong></span>
                    <span>Due: <strong className="text-gray-800">
                      {challan.dueDate?.toDate
                        ? challan.dueDate.toDate().toLocaleDateString('en-PK')
                        : '—'}
                    </strong></span>
                    {challan.paidAt && (
                      <span>Paid: <strong className="text-green-700">
                        {challan.paidAt?.toDate
                          ? challan.paidAt.toDate().toLocaleDateString('en-PK')
                          : '—'}
                      </strong></span>
                    )}
                    {challan.paymentRef && (
                      <span>Txn: <strong className="text-gray-800 font-mono">{challan.paymentRef}</strong></span>
                    )}
                  </div>
                </div>

                {}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(challan)}
                    disabled={downloading === challan.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    {downloading === challan.id
                      ? <div className="w-3 h-3 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin" />
                      : <Download className="w-3.5 h-3.5" />
                    }
                    PDF
                  </button>

                  {challan.status === 'UNPAID' || challan.status === 'OVERDUE' ? (
                    <button
                      onClick={() => setPayingChallan(challan)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1e3a5f] text-white hover:bg-[#162a47] text-xs font-semibold transition-all"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Pay Now
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-50 text-green-700 text-xs font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" /> Paid
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {}
      {payingChallan && (
        <PaymentModal
          challan={payingChallan}
          onClose={() => setPayingChallan(null)}
          onPaid={handlePaid}
        />
      )}
    </div>
  )
}
