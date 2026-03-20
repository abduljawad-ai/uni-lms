// src/controllers/challanController.js
// ============================================================
//  UniPortal — Challan (Fee Voucher) Controller  (v2)
//
//  1. Admin generates bulk challans → targets dept+year+semester
//  2. System queries all APPROVED students matching that cohort
//  3. A challan doc is created per student (pushed to their portal)
//  4. Download: generates a clean jsPDF voucher (no screenshot hack)
// ============================================================

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

// Generates a human-readable challan number
// Format: CHLN-YYYYMM-XXXXX  e.g. CHLN-202509-00142
function generateChallanNumber() {
  const now    = new Date();
  const ym     = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const serial = String(Math.floor(Math.random() * 90000) + 10000); // 5-digit
  return `CHLN-${ym}-${serial}`;
}

// ─────────────────────────────────────────────────────────────
//  1. ADMIN — Generate Bulk Challans
//     Finds every APPROVED student in (dept + year + semester),
//     creates a challan doc for each, records a bulk job.
// ─────────────────────────────────────────────────────────────
export async function generateBulkChallans({
  adminId,
  targetDepartmentId,
  targetYear,          // 1 | 2 | 3 | 4
  targetSemesterId,
  amount,              // in PKR e.g. 35000
  dueDate,             // JS Date object
  feeDescription,      // e.g. "Tuition Fee — Fall 2025"
}) {
  if (!adminId || !targetDepartmentId || !targetYear || !targetSemesterId)
    throw new Error('Admin ID, department, year, and semester are required.');
  if (!amount || amount <= 0)
    throw new Error('Amount must be a positive number.');
  if (!dueDate || !(dueDate instanceof Date))
    throw new Error('A valid due date is required.');

  // 1. Create the bulk job doc first (for auditability)
  const jobRef = await addDoc(collection(db, 'challanBulkJobs'), {
    targetDepartmentId,
    targetYear,
    targetSemesterId,
    amount,
    feeDescription,
    dueDate:         Timestamp.fromDate(dueDate),
    studentsTargeted: 0,
    studentsReached:  0,
    status:          'PENDING',
    createdBy:       adminId,
    createdAt:       serverTimestamp(),
    completedAt:     null,
  });

  // 2. Query all APPROVED students in the target cohort
  const studentsQuery = query(
    collection(db, 'users'),
    where('role',               '==', 'student'),
    where('enrollmentStatus',   '==', 'APPROVED'),
    where('departmentId',       '==', targetDepartmentId),
    where('currentYear',        '==', targetYear),
    where('currentSemesterId',  '==', targetSemesterId)
  );
  const studentsSnap = await getDocs(studentsQuery);

  if (studentsSnap.empty) {
    await updateDoc(jobRef, {
      status:           'COMPLETE',
      studentsTargeted: 0,
      studentsReached:  0,
      completedAt:      serverTimestamp(),
    });
    return { jobId: jobRef.id, studentsReached: 0 };
  }

  const students        = studentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const studentsTargeted = students.length;

  // 3. Batch-write a challan per student
  //    Firestore batch limit = 500 ops → chunk if needed
  const BATCH_SIZE = 400;
  let studentsReached = 0;

  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const chunk = students.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    chunk.forEach((student) => {
      const challanRef = doc(collection(db, 'challans'));
      batch.set(challanRef, {
        challanNumber:       generateChallanNumber(),
        bulkGenerationId:    jobRef.id,
        generatedBy:         adminId,
        studentId:           student.id,
        studentName:         student.displayName,
        rollNumber:          student.rollNumber,
        departmentId:        targetDepartmentId,
        departmentName:      student.departmentName,
        programId:           student.programId,
        programName:         student.programName,
        batchYear:           student.batchYear,
        currentYear:         targetYear,
        semesterId:          targetSemesterId,
        amount,
        feeDescription,
        dueDate:             Timestamp.fromDate(dueDate),
        issueDate:           serverTimestamp(),
        status:              'UNPAID',    // UNPAID | PAID | OVERDUE | CANCELLED
        paidAt:              null,
        paymentRef:          null,
        isActive:            true,
      });
    });

    await batch.commit();
    studentsReached += chunk.length;
  }

  // 4. Update bulk job with final count
  await updateDoc(jobRef, {
    studentsTargeted,
    studentsReached,
    status:      'COMPLETE',
    completedAt: serverTimestamp(),
  });

  // 5. Send a notification to the cohort about the new challan
  await addDoc(collection(db, 'notifications'), {
    title:              `Fee Challan Issued — ${feeDescription}`,
    body:               `A fee challan of PKR ${amount.toLocaleString()} has been issued. Due date: ${dueDate.toLocaleDateString('en-PK')}. Please visit the Fee Challan section to download your voucher.`,
    type:               'FEE',
    createdBy:          adminId,
    createdByRole:      'admin',
    targetDepartmentId,
    targetYear,
    targetSemesterId,
    isActive:           true,
    createdAt:          serverTimestamp(),
    updatedAt:          serverTimestamp(),
  });

  return { jobId: jobRef.id, studentsReached };
}

// ─────────────────────────────────────────────────────────────
//  2. STUDENT — Fetch own challans
// ─────────────────────────────────────────────────────────────
export async function fetchStudentChallans(studentId) {
  const q = query(
    collection(db, 'challans'),
    where('studentId', '==', studentId),
    where('isActive',  '==', true),
    orderBy('issueDate', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─────────────────────────────────────────────────────────────
//  3. ADMIN — Mark challan as paid
// ─────────────────────────────────────────────────────────────
export async function markChallanPaid(challanId, paymentRef) {
  await updateDoc(doc(db, 'challans', challanId), {
    status:     'PAID',
    paidAt:     serverTimestamp(),
    paymentRef: paymentRef || null,
  });
}

// ─────────────────────────────────────────────────────────────
//  4. DOWNLOAD CHALLAN AS PDF
//     Replaces the broken "take screenshot of screen" approach
//     Uses jsPDF (import from cdnjs or npm)
//
//  Usage (in your React component):
//    import { downloadChallanPDF } from '../controllers/challanController';
//    <button onClick={() => downloadChallanPDF(challan, universityInfo)}>
//      Download PDF
//    </button>
// ─────────────────────────────────────────────────────────────
export async function downloadChallanPDF(challan, universityInfo = {}) {
  // Dynamic import so jsPDF is only loaded when needed
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit:        'mm',
    format:      'a4',
  });

  const PAGE_W   = 210;
  const PAGE_H   = 297;
  const MARGIN   = 20;
  const COL_W    = (PAGE_W - MARGIN * 2 - 10) / 2; // two columns with 10mm gap
  const uniName  = universityInfo.name  || 'University Name';
  const uniAddr  = universityInfo.address || 'University Address, Pakistan';
  const uniPhone = universityInfo.phone || '';

  // Format dates safely
  const formatDate = (val) => {
    if (!val) return '—';
    const d = val?.toDate ? val.toDate() : new Date(val);
    return d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatAmount = (amt) =>
    `PKR ${Number(amt).toLocaleString('en-PK')}`;

  // ── HELPER FUNCTIONS ────────────────────────────────────────
  const setFont = (style = 'normal', size = 10) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
  };

  const hLine = (y, x1 = MARGIN, x2 = PAGE_W - MARGIN, w = 0.3) => {
    doc.setLineWidth(w);
    doc.line(x1, y, x2, y);
  };

  const drawBox = (x, y, w, h, fillColor = null) => {
    if (fillColor) {
      doc.setFillColor(...fillColor);
      doc.rect(x, y, w, h, 'F');
    }
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.rect(x, y, w, h, 'S');
  };

  const labelVal = (label, value, x, y, labelW = 45) => {
    setFont('bold', 9);
    doc.setTextColor(100, 100, 100);
    doc.text(label, x, y);
    setFont('normal', 9);
    doc.setTextColor(30, 30, 30);
    doc.text(String(value || '—'), x + labelW, y);
  };

  // ── HEADER BAND ─────────────────────────────────────────────
  doc.setFillColor(15, 76, 129);   // deep navy
  doc.rect(0, 0, PAGE_W, 28, 'F');

  setFont('bold', 16);
  doc.setTextColor(255, 255, 255);
  doc.text(uniName, PAGE_W / 2, 12, { align: 'center' });

  setFont('normal', 8);
  doc.text(uniAddr, PAGE_W / 2, 18, { align: 'center' });
  if (uniPhone) doc.text(`Tel: ${uniPhone}`, PAGE_W / 2, 23, { align: 'center' });

  // ── CHALLAN TITLE ────────────────────────────────────────────
  setFont('bold', 13);
  doc.setTextColor(15, 76, 129);
  doc.text('FEE DEPOSIT CHALLAN', PAGE_W / 2, 38, { align: 'center' });

  hLine(41, MARGIN, PAGE_W - MARGIN, 0.5);

  // ── STATUS BADGE ─────────────────────────────────────────────
  const statusColors = {
    UNPAID:    [220, 53, 69],
    PAID:      [40, 167, 69],
    OVERDUE:   [255, 100, 0],
    CANCELLED: [150, 150, 150],
  };
  const sColor = statusColors[challan.status] || [100, 100, 100];
  doc.setFillColor(...sColor);
  doc.roundedRect(PAGE_W - MARGIN - 30, 31, 30, 8, 2, 2, 'F');
  setFont('bold', 8);
  doc.setTextColor(255, 255, 255);
  doc.text(challan.status, PAGE_W - MARGIN - 15, 36.5, { align: 'center' });

  // ── CHALLAN META (two columns) ───────────────────────────────
  let y = 50;
  setFont('bold', 9);
  doc.setTextColor(80, 80, 80);

  labelVal('Challan No.:', challan.challanNumber, MARGIN, y);
  labelVal('Issue Date:', formatDate(challan.issueDate), MARGIN + COL_W + 10, y);

  y += 7;
  labelVal('Due Date:', formatDate(challan.dueDate), MARGIN, y);
  labelVal('Fee Description:', challan.feeDescription, MARGIN + COL_W + 10, y);

  y += 10;
  hLine(y, MARGIN, PAGE_W - MARGIN, 0.3);

  // ── STUDENT INFO BOX ─────────────────────────────────────────
  y += 5;
  doc.setFillColor(245, 248, 252);
  doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 38, 'F');
  doc.setDrawColor(200, 215, 230);
  doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 38, 'S');

  setFont('bold', 10);
  doc.setTextColor(15, 76, 129);
  doc.text('Student Information', MARGIN + 4, y + 6);

  y += 10;
  setFont('normal', 9);
  doc.setTextColor(30, 30, 30);

  labelVal('Student Name:', challan.studentName,  MARGIN + 4, y, 42);
  labelVal('Roll Number:', challan.rollNumber,    MARGIN + COL_W + 14, y, 36);

  y += 7;
  labelVal('Department:', challan.departmentName, MARGIN + 4, y, 42);
  labelVal('Program:', challan.programName,       MARGIN + COL_W + 14, y, 36);

  y += 7;
  labelVal('Batch Year:', challan.batchYear,      MARGIN + 4, y, 42);
  labelVal('Year of Study:', `Year ${challan.currentYear}`, MARGIN + COL_W + 14, y, 36);

  y += 16;

  // ── FEE BREAKDOWN TABLE ──────────────────────────────────────
  // Header row
  doc.setFillColor(15, 76, 129);
  doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 8, 'F');
  setFont('bold', 9);
  doc.setTextColor(255, 255, 255);
  doc.text('Description', MARGIN + 4,                  y + 5.5);
  doc.text('Amount (PKR)', PAGE_W - MARGIN - 4,        y + 5.5, { align: 'right' });

  y += 8;

  // Data row(s) — currently one fee line; extend array for multi-line breakdown
  const feeRows = [
    { label: challan.feeDescription || 'Tuition Fee', amount: challan.amount },
  ];

  feeRows.forEach((row, i) => {
    const rowFill = i % 2 === 0 ? [255, 255, 255] : [248, 250, 253];
    doc.setFillColor(...rowFill);
    doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 8, 'F');
    doc.setDrawColor(220, 220, 220);
    doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 8, 'S');

    setFont('normal', 9);
    doc.setTextColor(30, 30, 30);
    doc.text(row.label, MARGIN + 4,           y + 5.5);
    doc.text(formatAmount(row.amount), PAGE_W - MARGIN - 4, y + 5.5, { align: 'right' });
    y += 8;
  });

  // Total row
  doc.setFillColor(230, 240, 250);
  doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 9, 'F');
  setFont('bold', 10);
  doc.setTextColor(15, 76, 129);
  doc.text('TOTAL AMOUNT DUE', MARGIN + 4,       y + 6);
  doc.text(formatAmount(challan.amount), PAGE_W - MARGIN - 4, y + 6, { align: 'right' });
  y += 9;

  y += 8;

  // ── BANK DEPOSIT INSTRUCTIONS ────────────────────────────────
  doc.setFillColor(255, 252, 235);
  doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 30, 'F');
  doc.setDrawColor(230, 200, 50);
  doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 30, 'S');

  setFont('bold', 9);
  doc.setTextColor(130, 100, 0);
  doc.text('Payment Instructions', MARGIN + 4, y + 6);

  setFont('normal', 8.5);
  doc.setTextColor(60, 60, 60);
  const instructions = [
    '1. Deposit this challan at any branch of the designated bank.',
    '2. Keep the bank-stamped copy for your records.',
    '3. Submit a scanned copy to the university finance office.',
    '4. Online transfer accepted — use Challan No. as payment reference.',
    '5. Challans deposited after due date are subject to a late payment surcharge.',
  ];
  instructions.forEach((line, i) => {
    doc.text(line, MARGIN + 4, y + 13 + i * 4.5);
  });

  y += 35;

  // ── PAID STAMP (conditional) ─────────────────────────────────
  if (challan.status === 'PAID') {
    doc.setDrawColor(40, 167, 69);
    doc.setLineWidth(1.5);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 167, 69);
    // Rotate "PAID" stamp diagonally
    doc.saveGraphicsState();
    doc.text('✓ PAID', PAGE_W / 2, y - 10, { align: 'center', angle: 0 });
    doc.restoreGraphicsState();

    setFont('normal', 9);
    doc.setTextColor(100, 100, 100);
    if (challan.paidAt) {
      doc.text(`Payment Date: ${formatDate(challan.paidAt)}`, PAGE_W / 2, y, { align: 'center' });
    }
    if (challan.paymentRef) {
      doc.text(`Payment Ref: ${challan.paymentRef}`, PAGE_W / 2, y + 5, { align: 'center' });
    }
    y += 10;
  }

  y += 4;
  hLine(y, MARGIN, PAGE_W - MARGIN, 0.3);
  y += 5;

  // ── FOOTER ───────────────────────────────────────────────────
  setFont('normal', 8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Generated by UniPortal on ${new Date().toLocaleDateString('en-PK')} · ${uniName}`,
    PAGE_W / 2, y + 4,
    { align: 'center' }
  );
  doc.text(
    'This is a computer-generated document and does not require a physical signature.',
    PAGE_W / 2, y + 9,
    { align: 'center' }
  );

  // ── SAVE ─────────────────────────────────────────────────────
  const filename = `Challan_${challan.challanNumber}_${challan.rollNumber || challan.studentId}.pdf`;
  doc.save(filename);
}

// ─────────────────────────────────────────────────────────────
//  5. ADMIN — Fetch challans for a specific cohort
// ─────────────────────────────────────────────────────────────
export async function fetchCohortChallans({
  departmentId,
  targetYear,
  semesterId,
}) {
  const q = query(
    collection(db, 'challans'),
    where('departmentId', '==', departmentId),
    where('currentYear',  '==', targetYear),
    where('semesterId',   '==', semesterId),
    where('isActive',     '==', true),
    orderBy('issueDate',  'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─────────────────────────────────────────────────────────────
//  6. ADMIN — Fetch all bulk generation jobs
// ─────────────────────────────────────────────────────────────
export async function fetchBulkJobs() {
  const q = query(
    collection(db, 'challanBulkJobs'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
