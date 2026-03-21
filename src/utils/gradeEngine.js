const GRADE_TABLE = [
  { min: 90, letter: 'A+', gradePoint: 4.0, remarks: 'Distinction'  },
  { min: 85, letter: 'A',  gradePoint: 4.0, remarks: 'Excellent'    },
  { min: 80, letter: 'A-', gradePoint: 3.7, remarks: 'Excellent'    },
  { min: 75, letter: 'B+', gradePoint: 3.3, remarks: 'Good'         },
  { min: 71, letter: 'B',  gradePoint: 3.0, remarks: 'Good'         },
  { min: 68, letter: 'B-', gradePoint: 2.7, remarks: 'Good'         },
  { min: 64, letter: 'C+', gradePoint: 2.3, remarks: 'Average'      },
  { min: 61, letter: 'C',  gradePoint: 2.0, remarks: 'Average'      },
  { min: 58, letter: 'C-', gradePoint: 1.7, remarks: 'Average'      },
  { min: 54, letter: 'D+', gradePoint: 1.3, remarks: 'Below Average'},
  { min: 50, letter: 'D',  gradePoint: 1.0, remarks: 'Below Average'},
  { min:  0, letter: 'F',  gradePoint: 0.0, remarks: 'Fail'         },
];

export const PASS_MARK = 50;
export const MIN_GRADUATION_CGPA = 2.0;
export const MIN_ATTENDANCE_PERCENT = 75;

export function getGrade(totalMarks) {
  if (typeof totalMarks !== 'number' || isNaN(totalMarks)) throw new Error(`Invalid marks: ${totalMarks}`);
  const clamped = Math.min(100, Math.max(0, totalMarks));
  const entry = GRADE_TABLE.find(g => clamped >= g.min);
  return {
    letter: entry.letter,
    gradePoint: entry.gradePoint,
    remarks: entry.remarks,
    isPassed: clamped >= PASS_MARK,
    totalMarks: clamped,
  };
}

export function computeTotal({ attendanceMarks, assignmentMarks, midMarks, finalMarks }) {
  const errors = [];
  if (attendanceMarks < 0 || attendanceMarks > 10) errors.push(`Invalid attendance: ${attendanceMarks}`);
  if (assignmentMarks < 0 || assignmentMarks > 10) errors.push(`Invalid assignment: ${assignmentMarks}`);
  if (midMarks < 0 || midMarks > 30) errors.push(`Invalid mid: ${midMarks}`);
  if (finalMarks < 0 || finalMarks > 50) errors.push(`Invalid final: ${finalMarks}`);

  if (errors.length) return { totalMarks: null, letter: null, gradePoint: null, remarks: null, isPassed: false, errors };
  return { ...getGrade(attendanceMarks + assignmentMarks + midMarks + finalMarks), errors: [] };
}

export function calculateGPA(courses) {
  if (!courses?.length) return 0;
  const totalPoints = courses.reduce((sum, c) => sum + (c.gradePoint * c.creditHours), 0);
  const totalCredits = courses.reduce((sum, c) => sum + c.creditHours, 0);
  return totalCredits === 0 ? 0 : Math.round((totalPoints / totalCredits) * 100) / 100;
}

export function calculateCGPA(allCourses) {
  return calculateGPA(allCourses);
}

export function checkGraduationEligibility(allCourses) {
  const cgpa = calculateCGPA(allCourses);
  const failedCourses = allCourses.filter(c => !c.isPassed).length;

  if (failedCourses > 0) return { cgpa, isEligible: false, failedCourses, reason: `Failed courses: ${failedCourses}` };
  if (cgpa < MIN_GRADUATION_CGPA) return { cgpa, isEligible: false, failedCourses: 0, reason: `CGPA below ${MIN_GRADUATION_CGPA}` };
  return { cgpa, isEligible: true, failedCourses: 0, reason: null };
}

export function checkAttendanceEligibility(attendanceRecords) {
  if (!attendanceRecords?.length) return { percentage: 0, isEligible: false, present: 0, total: 0 };
  const present = attendanceRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
  const total = attendanceRecords.length;
  const percentage = Math.round((present / total) * 100);
  return { percentage, isEligible: percentage >= MIN_ATTENDANCE_PERCENT, present, total };
}
