
import {
  doc, collection, addDoc, updateDoc,
  getDocs, query, where, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'

export const MOCK_BANKS = [
  { code: 'HBL',      name: 'Habib Bank Limited',        logo: '🏦' },
  { code: 'MCB',      name: 'MCB Bank',                  logo: '🏦' },
  { code: 'UBL',      name: 'United Bank Limited',       logo: '🏦' },
  { code: 'ABL',      name: 'Allied Bank Limited',       logo: '🏦' },
  { code: 'MEZZ',     name: 'Meezan Bank',               logo: '🏦' },
  { code: 'JAZZ',     name: 'JazzCash',                  logo: '📱' },
  { code: 'EASY',     name: 'Easypaisa',                 logo: '📱' },
  { code: 'NAYAPAY',  name: 'NayaPay',                   logo: '📱' },
  { code: 'SADAPAY',  name: 'SadaPay',                   logo: '📱' },
]

function generateTxnId() {
  const ts     = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `TXN-${ts}-${random}`
}

export async function mockInquiry(consumerNumber) {

  await new Promise(r => setTimeout(r, 1200))

  const byRoll = query(
    collection(db, 'challans'),
    where('rollNumber',    '==', consumerNumber),
    where('status',        '==', 'UNPAID'),
    where('isActive',      '==', true)
  )
  const byChallan = query(
    collection(db, 'challans'),
    where('challanNumber', '==', consumerNumber),
    where('status',        '==', 'UNPAID'),
    where('isActive',      '==', true)
  )

  const [rollSnap, challanSnap] = await Promise.all([
    getDocs(byRoll),
    getDocs(byChallan),
  ])

  const snap = !rollSnap.empty ? rollSnap : challanSnap

  if (snap.empty) {
    return {
      found:   false,
      message: 'No unpaid challan found for this consumer number.',
    }
  }

  const challan = { id: snap.docs[0].id, ...snap.docs[0].data() }
  const dueDate = challan.dueDate?.toDate
    ? challan.dueDate.toDate()
    : new Date(challan.dueDate)

  return {
    found:         true,
    challanId:     challan.id,
    challanNumber: challan.challanNumber,
    studentName:   challan.studentName,
    rollNumber:    challan.rollNumber,
    department:    challan.departmentName,
    program:       challan.programName,
    amount:        challan.amount,
    feeDescription: challan.feeDescription,
    dueDate:       dueDate.toLocaleDateString('en-PK'),
    isOverdue:     dueDate < new Date(),
  }
}

export async function mockConfirmation({
  challanId,
  bankCode,
  amount,
}) {

  await new Promise(r => setTimeout(r, 2000))

  const success = Math.random() > 0.05

  if (!success) {
    return {
      success:   false,
      message:   'Transaction declined by bank. Please try again.',
    }
  }

  const transactionId = generateTxnId()
  const bank          = MOCK_BANKS.find(b => b.code === bankCode)

  await updateDoc(doc(db, 'challans', challanId), {
    status:        'PAID',
    paidAt:        serverTimestamp(),
    paymentRef:    transactionId,
    paymentMethod: bankCode,
    bankName:      bank?.name || bankCode,
    paidAmount:    amount,
  })

  await addDoc(collection(db, 'paymentTransactions'), {
    challanId,
    transactionId,
    bankCode,
    bankName:    bank?.name || bankCode,
    amount,
    status:      'SUCCESS',
    processedAt: serverTimestamp(),

  })

  return {
    success:       true,
    transactionId,
    message:       'Payment successful!',
    bankName:      bank?.name || bankCode,
  }
}