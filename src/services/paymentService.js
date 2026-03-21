// src/services/paymentService.js
// ============================================================
//  UniPortal — Mock Payment Service
//  Mirrors real 1BILL flow exactly.
//  To switch to real 1BILL later:
//  1. Replace simulateInquiry() with real 1BILL Inquiry API call
//  2. Replace simulateConfirmation() with real 1BILL webhook handler
//  3. Remove the mock UI — everything else stays identical
// ============================================================

import {
  doc, collection, addDoc, updateDoc,
  getDocs, query, where, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'

// ─── MOCK BANK LIST (same as real 1BILL supported banks) ──────
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

// ─── GENERATE MOCK TRANSACTION ID ─────────────────────────────
function generateTxnId() {
  const ts     = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `TXN-${ts}-${random}`
}

// ─────────────────────────────────────────────────────────────
//  STEP 1 — INQUIRY
//  In real 1BILL: bank calls YOUR inquiry endpoint with consumer number
//  Here: we query Firestore directly (same logic, no HTTP call)
//
//  Returns: { found, studentName, amount, dueDate, challanNumber, challanId }
// ─────────────────────────────────────────────────────────────
export async function mockInquiry(consumerNumber) {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 1200))

  // Consumer number = roll number OR challan number
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

// ─────────────────────────────────────────────────────────────
//  STEP 2 — CONFIRMATION
//  In real 1BILL: their server sends a POST to your webhook
//  Here: we update Firestore directly after user confirms
//
//  Returns: { success, transactionId, message }
// ─────────────────────────────────────────────────────────────
export async function mockConfirmation({
  challanId,
  bankCode,
  amount,
}) {
  // Simulate payment processing delay
  await new Promise(r => setTimeout(r, 2000))

  // Simulate 95% success rate (like real payment gateways)
  const success = Math.random() > 0.05

  if (!success) {
    return {
      success:   false,
      message:   'Transaction declined by bank. Please try again.',
    }
  }

  const transactionId = generateTxnId()
  const bank          = MOCK_BANKS.find(b => b.code === bankCode)

  // Update challan in Firestore — same fields real 1BILL confirmation sets
  await updateDoc(doc(db, 'challans', challanId), {
    status:        'PAID',
    paidAt:        serverTimestamp(),
    paymentRef:    transactionId,
    paymentMethod: bankCode,
    bankName:      bank?.name || bankCode,
    paidAmount:    amount,
  })

  // Log the transaction for audit trail
  await addDoc(collection(db, 'paymentTransactions'), {
    challanId,
    transactionId,
    bankCode,
    bankName:    bank?.name || bankCode,
    amount,
    status:      'SUCCESS',
    processedAt: serverTimestamp(),
    // When switching to real 1BILL, add:
    // billerID, consumerNumber, bankTransactionId, etc.
  })

  return {
    success:       true,
    transactionId,
    message:       'Payment successful!',
    bankName:      bank?.name || bankCode,
  }
}