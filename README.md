# 🎓 UniPortal — Open Source University LMS for Pakistan

A fully-featured, modern **Learning Management System** built with React + Firebase, designed specifically for Pakistani universities that don't have their own LMS. Free and open source.

---

## ✨ Features

### 👨‍🎓 Student Portal
| Feature | Description |
|---|---|
| **Program Enrollment** | Choose department, degree program & batch — auto-assigned roll number |
| **My Courses** | View all enrolled courses for current semester |
| **Course Detail** | See materials, assignments per course |
| **Attendance** | View per-course attendance with % and warnings |
| **Exam Results** | Filter by semester, year, type — full marks breakdown with grades |
| **Fee Challan** | View paid/unpaid challans, download challan forms |
| **Scholarship** | Browse & apply for scholarships (NEST, HEC, Need-cum-Merit etc.) |
| **Notice Board** | University announcements filtered by type |
| **Timetable** | Visual class schedule |
| **Digital Library** | Browse & download books/resources |
| **Virtual Classroom** | Join live/recorded online classes |
| **Profile** | Edit profile, change password |

### 👨‍🏫 Teacher Portal
| Feature | Description |
|---|---|
| **My Courses** | View assigned courses with student lists |
| **Mark Attendance** | Select course, date → mark present/absent/leave per student |
| **Enter Marks** | Attendance (10) + Assignment (10) + Mid (30) + Final (50) = auto grade |
| **Assignments** | Create and manage assignments with due dates |
| **Course Materials** | Upload PDFs, videos, slides (Firebase Storage) |
| **Timetable** | View teaching schedule |
| **Profile** | Edit designation, specialization, change password |

### ⚙️ Admin Panel
| Feature | Description |
|---|---|
| **Dashboard** | Stats + charts + quick actions |
| **Students** | View all students, update semester, search/filter |
| **Teachers** | Approve/revoke teacher access, manage accounts |
| **Departments** | Add/delete departments |
| **Courses** | Add courses, assign teachers, set program/semester/batch |
| **Batches** | Manage batch years (2K19, 2K20 etc.) |
| **Enrollments** | View all enrolled students |
| **Fee Challans** | Issue challans to individuals or all students at once, mark paid |
| **Notice Board** | Post/hide/delete notices by type |
| **Scholarships** | Add scholarship announcements |
| **Timetable** | Add class slots per program/semester/day |
| **Results** | View teacher-entered results, publish/unpublish to students |
| **Settings** | University info, academic dates, portal toggles, maintenance mode |
| **Initial Seed** | One-click seed default departments, programs & batches |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- A Firebase project

### 1. Clone / Extract the Project
```bash
cd university-lms
```

### 2. Configure Firebase
Edit `src/firebase/config.js` with your Firebase project credentials:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

**Where to find these:** Firebase Console → Your Project → Project Settings → Web App → SDK setup

### 3. Install Dependencies
```bash
npm install
```

### 4. Start the Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## 🔥 Firebase Setup

### Authentication
1. Firebase Console → Authentication → Get Started
2. Enable **Email/Password** provider

### Firestore Database
1. Firebase Console → Firestore Database → Create database
2. Start in **production mode**
3. Go to **Rules** tab → paste the contents of `firestore.rules`

### Storage
1. Firebase Console → Storage → Get Started
2. Go to **Rules** tab → paste the contents of `storage.rules`

### Firestore Indexes (Required)
Create these composite indexes in Firebase Console → Firestore → Indexes:

| Collection | Fields | Order |
|---|---|---|
| `attendance` | `studentId` ASC, `courseId` ASC | - |
| `results` | `studentId` ASC, `semester` ASC, `examYear` ASC, `examType` ASC | - |
| `challans` | `studentId` ASC, `createdAt` DESC | - |
| `notices` | `isActive` ASC, `createdAt` DESC | - |
| `scholarships` | `startDate` DESC | - |
| `courses` | `programId` ASC, `semester` ASC | - |
| `timetable` | `programId` ASC, `semester` ASC | - |

> **Tip:** Run the app and Firebase will suggest the exact indexes via console errors — just click the link.

---

## 🌱 First Time Setup (Seed Initial Data)

1. Register an **Admin** account
2. Login → Go to **Admin → Profile**
3. Click **"Seed Initial Data"** — this adds:
   - 10 default departments (CS, IT, SE, EE, ME, BBA, MBA, Math, English, Physics)
   - 10 degree programs
   - Batches: 2K19 through 2K25

After seeding, you can add more departments/programs/batches through the admin panel.

---

## 👤 User Roles & Flow

### Student
1. Register → Select role: **Student**
2. Login → Dashboard shows warning to enroll
3. Go to **Choose Program** → Select department → program → batch
4. Roll number auto-assigned (e.g., `2K25/CS/001`)
5. Now all portal features are accessible

### Teacher
1. Register → Select role: **Teacher**
2. Wait for **Admin to approve** the account
3. Once approved → Login → Full teacher portal available

### Admin
1. Register → Select role: **Admin**
2. Login immediately (no approval needed)
3. First action: Go to **Profile** → Seed initial data
4. Then: Add courses, assign teachers, manage the university

---

## 📁 Project Structure

```
src/
├── firebase/
│   ├── config.js          # Firebase initialization
│   └── seed.js            # Initial data seeder
├── contexts/
│   └── AuthContext.jsx    # Auth state, login, register, profile
├── components/
│   ├── student/
│   │   └── StudentLayout.jsx
│   ├── teacher/
│   │   └── TeacherLayout.jsx
│   └── admin/
│       └── AdminLayout.jsx
├── pages/
│   ├── auth/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── ForgotPassword.jsx
│   ├── student/           # 12 student pages
│   ├── teacher/           # 9 teacher pages
│   └── admin/             # 13 admin pages
├── App.jsx                # All routes + role guards
├── main.jsx               # Entry point
└── index.css              # Tailwind + custom styles
```

---

## 🎨 Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** | Frontend UI |
| **Vite** | Build tool |
| **Tailwind CSS** | Styling |
| **React Router v6** | Client-side routing |
| **Firebase Auth** | Authentication |
| **Firestore** | Database |
| **Firebase Storage** | File uploads |
| **Recharts** | Dashboard charts |
| **Lucide React** | Icons |
| **React Hot Toast** | Notifications |
| **Google Fonts (Outfit + Plus Jakarta Sans)** | Typography |

---

## 🏗️ Build for Production

```bash
npm run build
```
Output is in `dist/` — deploy to Firebase Hosting, Vercel, Netlify etc.

### Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

---

## 🤝 Contributing

This project is open source and built for Pakistani universities that cannot afford commercial LMS solutions. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Submit a Pull Request

---

## 📄 License

MIT License — Free to use, modify and distribute.

---

## 💬 Support

Built with ❤️ for Pakistan's educational institutions.
If you deploy this for your university, we'd love to hear about it!

---

*UniPortal is not affiliated with any government or HEC body. It is an independent open-source project.*
