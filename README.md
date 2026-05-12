<div align="center">

# 🎓 Learnova

### AI-Powered Smart Student Engagement & Attendance Platform

**Transforming Education — One Institution at a Time**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-learnova--web.vercel.app-blue?style=for-the-badge&logo=vercel)](https://learnova-web.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Analytics-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?style=for-the-badge&logo=mongodb)](https://mongodb.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)

</div>

---

## 🌟 What is Learnova?

Learnova is a modern, AI-powered educational platform built to eliminate the inefficiencies of traditional school management. It replaces manual attendance, siloed data, and disengaged learning with a seamless, integrated experience for every stakeholder in education.

- 🧑‍🏫 **Teachers** regain ~1 hour/day — more time to teach, less time on admin
- 🎒 **Students** convert ~90+ hours/year of idle time into productive learning
- 🏫 **Institutions** improve attendance metrics and engagement across departments
- 👨‍👩‍👧 **Parents** gain transparent, real-time insights into their child's progress

---

## ✨ Features

### 🔐 Role-Based Authentication
- Separate dashboards for **Students**, **Teachers**, **Institutes**, and **Admins**
- Firebase-powered sign-up/login with email verification and password reset
- Secure protected routes with role-based redirects

### 📸 Face Recognition Attendance
- AI-powered face recognition using **Face API.js** for contactless attendance
- Attendance validation and conflict resolution built-in
- Reduces manual roll-call time dramatically

### 📊 Role-Specific Dashboards
- **Student Dashboard** — view attendance records and academic progress
- **Teacher Dashboard** — manage classes, take attendance, monitor students
- **Institute Dashboard** — oversee departments and institution-wide metrics
- **Admin Dashboard** — full system administration and user management

### 📋 Notice Board
- Institution-wide announcements and notices for all roles
- Real-time updates accessible across dashboards

### 📅 Activity Centre
- Track academic and co-curricular activities
- Centralised log accessible to students and teachers

### 🤖 AI Chatbot
- Built-in Learnova chatbot for platform assistance
- Available globally across all pages

### 📱 Progressive Web App (PWA)
- Installable on any device — mobile or desktop
- Works in low-network environments for maximum accessibility

### 📬 Contact & Communication
- Integrated contact form powered by **EmailJS**
- Direct communication channel between users and the Learnova team

### ⚙️ Profile & Settings
- Universal profile management for all roles
- Customisable settings per user type

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI Library | React 19 |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion, GSAP |
| Authentication | Firebase Auth |
| Database | MongoDB |
| File Storage | Vercel Blob |
| Face Recognition | Face API.js |
| Email | EmailJS |
| Analytics | Firebase Analytics |
| PWA | @ducanh2912/next-pwa |
| Notifications | React Hot Toast |

---

## 📁 Project Structure

```
learnova/
├── app/
│   ├── page.js                   # Landing / About page
│   ├── layout.js                 # Root layout with metadata & providers
│   ├── auth/                     # Sign in / Sign up
│   ├── verify/                   # Email verification
│   ├── register/                 # New user registration
│   ├── profile/                  # Profile setup
│   ├── student/dashboard/        # Student dashboard
│   ├── teacher/dashboard/        # Teacher dashboard
│   ├── institute/dashboard/      # Institute dashboard
│   ├── admin/dashboard/          # Admin dashboard
│   ├── attendance/               # Attendance management
│   ├── activity/                 # Activity centre
│   ├── notices/                  # Notice board
│   ├── settings/                 # User settings
│   └── contact/                  # Contact page
│
├── components/
│   ├── AuthForm.js               # Authentication form
│   ├── RoleSelection.js          # Role selection UI
│   ├── FaceRecognizer.js         # Face recognition component
│   ├── AttendanceValidation.js   # Attendance validation logic
│   ├── StudentDashboard.js       # Student dashboard component
│   ├── TeacherDashboardComponent.js
│   ├── InstituteDashboard.js
│   ├── AdminDashboard.js
│   ├── ChatBot.js                # AI chatbot
│   ├── noticeBoard.js            # Notice board component
│   ├── Navbar.js                 # Navigation
│   ├── ProtectedRoute.js         # Route protection
│   ├── InstallPWA.js             # PWA install prompt
│   └── profile.js / settings.js # Profile & settings
│
├── constants/
│   └── userRoles.js              # Role definitions and config
│
├── contexts/
│   └── AuthContext.js            # Global auth state
│
├── hooks/
│   └── useAuth.js                # Authentication hook
│
├── services/
│   └── authService.js            # Firebase auth service
│
├── utils/
│   └── authUtils.js              # Auth utility functions
│
└── lib/
    └── firebaseConfig.js         # Firebase configuration
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project (Auth + Analytics enabled)
- A MongoDB instance (local or Atlas)
- A Vercel Blob store (for file uploads)

### 1. Clone the repository

```bash
git clone https://github.com/Premshaw23/Learnova.git
cd Learnova
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the root directory and add your credentials:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Vercel Blob
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# EmailJS
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for production

```bash
npm run build
npm run start
```

---

## 🌐 Deployment

Learnova is deployed on **Vercel**. To deploy your own instance:

1. Push your code to GitHub
2. Import the repository on [vercel.com](https://vercel.com)
3. Add all environment variables in the Vercel dashboard
4. Deploy — Vercel handles the rest

Live at: **[https://learnova-web.vercel.app](https://learnova-web.vercel.app)**

---

## 👥 Meet the Team

| Name | Role |
|---|---|
| **Prem Shaw** | Founder & Creator — Team Leader, Full-Stack Developer |
| **Prashant Bhati** | Web Developer |
| **Polawar Pranav Shirish** | Frontend Developer |
| **Abir Ghosh** | Machine Learning Specialist |
| **Anuj Ram Shrivastava** | ML & Backend Developer |
| **Chandana S** | Testing & Documentation |

---

## 💡 Our Values

| Value | Description |
|---|---|
| ⚡ **Efficiency** | Streamline workflows and reduce redundancy so educators can focus on teaching |
| 💜 **Engagement** | Interactive and gamified experiences that motivate students |
| 🌍 **Accessibility** | Designed for all schools, even in low-network areas, with affordable solutions |

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) file for details.

You are free to use, modify, and distribute this software commercially or personally, as long as you include the license and original copyright notice.

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:
- How to report bugs
- Feature request guidelines
- Development setup instructions
- Code style standards
- Pull request process

---

## 📋 Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

---

## 🔒 Security

Found a security vulnerability? Please report it responsibly to **security@learnova.com** instead of opening a public issue. See [SECURITY.md](SECURITY.md) for details.