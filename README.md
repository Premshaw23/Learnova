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
- Separate dashboards for **Students**, **Teachers**, **Institutes**, **Parents**, and **Admins**
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
- **Parent Dashboard** — monitor linked children's daily/weekly/monthly attendance trends, grades breakdown, low attendance alerts, and announcements
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

## 👨‍👩‍👧 Parent Portal Feature

Learnova features a comprehensive Parent Portal that allows parents to securely monitor their children's academic status, notifications, and attendance.

### Key Capabilities
1. **Parent-Student Linking**: Admins can securely link one or multiple student accounts to a single Parent account via the Admin Dashboard.
2. **Attendance Tracking**: Dynamic attendance analytics displaying daily, weekly, and monthly trends using high-fidelity Recharts visualisations.
3. **Academic Performance**: Subject-wise grade breakdown, scores, and GPAs with automatic grade notifications.
4. **Self-Healing Low Attendance Alerts**: Automated background check triggers when student attendance drops below 75%, generating notifications for parents.
5. **Notice Board Integration**: Parents can view notices and announcements posted by the student's institute.

### Data Schemas

#### `parent_student_links` (Firestore & MongoDB)
Maps the relationship between a parent and their linked child/children:
- `_id / documentId`: `${parentId}_${studentId}`
- `parentId`: Firebase UID of the parent user
- `studentId`: Firebase UID of the student user
- `createdAt`: ISO Timestamp

#### `grades` (Firestore & MongoDB)
Stores subject-wise student grades:
- `_id / documentId`: Unique ID
- `studentId`: Firebase UID of the student user
- `subject`: Name of the subject (e.g. "Computer Science")
- `grade`: Letter grade (e.g. "A+")
- `score`: Numeric score (e.g. 98)
- `maxScore`: Maximum possible score (e.g. 100)
- `term`: Academic term (e.g. "Midterm")
- `date`: Grading date (e.g. "2026-06-01")
- `createdAt`: ISO Timestamp

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
│   ├── parent/dashboard/         # Parent dashboard
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
│   ├── TeacherDashboardComponent.js # Teacher dashboard component
│   ├── InstituteDashboard.js     # Institute dashboard
│   ├── ParentDashboard.js        # Parent dashboard component
│   ├── AdminDashboard.js         # Admin dashboard
│   ├── ChatBot.js                # AI chatbot
│   ├── noticeBoard.js            # Notice board component
│   ├── Navbar.js                 # Navigation
│   ├── ProtectedRoute.js         # Route protection
│   ├── InstallPWA.js             # PWA install prompt
│   └── profile.js / settings.js  # Profile & settings
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
git clone [https://github.com/Premshaw23/Learnova.git](https://github.com/Premshaw23/Learnova.git)
cd Learnova
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

A `.env.example` file is included in the repo with all required keys. Copy it first:

```bash
cp .env.example .env.local
```

Then fill in your actual values:

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
NEXT_PUBLIC_EMAILJS_USER_ID=your_user_id
NEXT_PUBLIC_CONTACT_RECEIVER_EMAIL=your-actual-admin-email@example.com
NEXT_PUBLIC_CONTACT_RECEIVER_NAME=Learnova Administration
```

### 4. Run the development server

By default, Next.js starts the development server on port 3000. Run the server using:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Troubleshooting

### `npm install` fails

- Use **Node.js 18+** (`node -v`).
- Delete `node_modules` and `package-lock.json`, then run `npm install` again.
- On Apple Silicon, if native modules fail, try `npm install --legacy-peer-deps`.

### Missing or incorrect environment variables

- Ensure `.env.local` exists in the project root (not committed to git).
- Restart the dev server after changing env vars — Next.js only reads them at startup.
- Verify Firebase keys match your Firebase console project settings.

### Firebase auth / configuration errors

- Confirm **Email/Password** sign-in is enabled in Firebase Authentication.
- Check that `NEXT_PUBLIC_FIREBASE_*` values are complete and have no trailing spaces.
- For local testing, add `localhost` to Firebase authorized domains if redirects fail.

### Port already in use (`EADDRINUSE`)

- Another process may be using port 3000. Stop it or run `npm run dev -- -p 3001`.
- On macOS/Linux: `lsof -i :3000` to find the blocking process.

### Dev server or build failures

- Clear the Next.js cache: `rm -rf .next` then `npm run dev`.
- Run `npm run build` locally to surface TypeScript or lint errors before deploying.
- Check the terminal for missing `MONGODB_URI` or Firebase errors on API routes.

### MongoDB connection issues

- Confirm `MONGODB_URI` includes the database name and valid credentials.
- For Atlas, allow your current IP in Network Access and verify the cluster is running.

---

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

### ⚠️ Contribution Limits

To maintain repository quality and ensure fair visibility for all contributors, please note:

**Per-Contributor Limits:**
- **Maximum 3 open Issues** per contributor at a time
- **Maximum 3 open PRs** per contributor at a time

**Repository-Wide Limit:**
- **Maximum 30 open PRs** total in the repository at any time

**Why these limits?**
- Encourages focused, high-quality work
- Reduces spam and duplicate submissions
- Ensures maintainers can review thoroughly
- Gives all contributors fair visibility
- Keeps repository manageable and organized

**Before opening new Issues/PRs:**
✅ Close or merge previous open work  
✅ Ensure proper testing and documentation  
✅ Focus on quality over quantity  

---

## 📋 Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

---

## 🔒 Security

Found a security vulnerability? Please report it responsibly to **security@learnova.com** instead of opening a public issue. See [SECURITY.md](SECURITY.md) for details.

---

## 👥 Contributors

<!-- CONTRIBUTORS:START -->
| <a href="https://github.com/Premshaw23"><img src="https://github.com/Premshaw23.png?size=60" width="52" height="52" alt="Premshaw23"/></a><br>**Prem Shaw** | <a href="https://github.com/ionfwsrijan"><img src="https://github.com/ionfwsrijan.png?size=60" width="52" height="52" alt="ionfwsrijan"/></a><br>@ionfwsrijan | <a href="https://github.com/atul-upadhyay-7"><img src="https://github.com/atul-upadhyay-7.png?size=60" width="52" height="52" alt="atul-upadhyay-7"/></a><br>@atul-upadhyay-7 | <a href="https://github.com/pithva007"><img src="https://github.com/pithva007.png?size=60" width="52" height="52" alt="pithva007"/></a><br>@pithva007 | <a href="https://github.com/mrdeyroy"><img src="https://github.com/mrdeyroy.png?size=60" width="52" height="52" alt="mrdeyroy"/></a><br>@mrdeyroy |
| :---: | :---: | :---: | :---: | :---: |
| <a href="https://github.com/Aditya8369"><img src="https://github.com/Aditya8369.png?size=60" width="52" height="52" alt="Aditya8369"/></a><br>@Aditya8369 | <a href="https://github.com/Prateek2007-cmd"><img src="https://github.com/Prateek2007-cmd.png?size=60" width="52" height="52" alt="Prateek2007-cmd"/></a><br>@Prateek2007-cmd | <a href="https://github.com/RUSHILPATEL33"><img src="https://github.com/RUSHILPATEL33.png?size=60" width="52" height="52" alt="RUSHILPATEL33"/></a><br>@RUSHILPATEL33 | <a href="https://github.com/Siddh2024"><img src="https://github.com/Siddh2024.png?size=60" width="52" height="52" alt="Siddh2024"/></a><br>@Siddh2024 | <a href="https://github.com/nivedha2025cse-gif"><img src="https://github.com/nivedha2025cse-gif.png?size=60" width="52" height="52" alt="nivedha2025cse-gif"/></a><br>@nivedha2025cse-gif |
| <a href="https://github.com/leonagoel"><img src="https://github.com/leonagoel.png?size=60" width="52" height="52" alt="leonagoel"/></a><br>@leonagoel | <a href="https://github.com/Hrithik-ui753"><img src="https://github.com/Hrithik-ui753.png?size=60" width="52" height="52" alt="Hrithik-ui753"/></a><br>@Hrithik-ui753 | <a href="https://github.com/codedbydollys10"><img src="https://github.com/codedbydollys10.png?size=60" width="52" height="52" alt="codedbydollys10"/></a><br>@codedbydollys10 | <a href="https://github.com/pranav-cholleti"><img src="https://github.com/pranav-cholleti.png?size=60" width="52" height="52" alt="pranav-cholleti"/></a><br>@pranav-cholleti | <a href="https://github.com/sanrishi"><img src="https://github.com/sanrishi.png?size=60" width="52" height="52" alt="sanrishi"/></a><br>@sanrishi |
| <a href="https://github.com/Srushti-Kamble14"><img src="https://github.com/Srushti-Kamble14.png?size=60" width="52" height="52" alt="Srushti-Kamble14"/></a><br>@Srushti-Kamble14 | <a href="https://github.com/HarshaNaidu11"><img src="https://github.com/HarshaNaidu11.png?size=60" width="52" height="52" alt="HarshaNaidu11"/></a><br>@HarshaNaidu11 | <a href="https://github.com/sricharan-213"><img src="https://github.com/sricharan-213.png?size=60" width="52" height="52" alt="sricharan-213"/></a><br>@sricharan-213 | <a href="https://github.com/knoxiboy"><img src="https://github.com/knoxiboy.png?size=60" width="52" height="52" alt="knoxiboy"/></a><br>@knoxiboy | <a href="https://github.com/prakshithamalla-art"><img src="https://github.com/prakshithamalla-art.png?size=60" width="52" height="52" alt="prakshithamalla-art"/></a><br>@prakshithamalla-art |
| <a href="https://github.com/Pratyush-Panda-2006"><img src="https://github.com/Pratyush-Panda-2006.png?size=60" width="52" height="52" alt="Pratyush-Panda-2006"/></a><br>@Pratyush-Panda-2006 | <a href="https://github.com/Vaishnav-Hub9"><img src="https://github.com/Vaishnav-Hub9.png?size=60" width="52" height="52" alt="Vaishnav-Hub9"/></a><br>@Vaishnav-Hub9 | <a href="https://github.com/basantnema31"><img src="https://github.com/basantnema31.png?size=60" width="52" height="52" alt="basantnema31"/></a><br>@basantnema31 | <a href="https://github.com/Sandeep6135"><img src="https://github.com/Sandeep6135.png?size=60" width="52" height="52" alt="Sandeep6135"/></a><br>@Sandeep6135 | <a href="https://github.com/Arhanabdullah"><img src="https://github.com/Arhanabdullah.png?size=60" width="52" height="52" alt="Arhanabdullah"/></a><br>@Arhanabdullah |
| <a href="https://github.com/Chakshu-Bamotra-04"><img src="https://github.com/Chakshu-Bamotra-04.png?size=60" width="52" height="52" alt="Chakshu-Bamotra-04"/></a><br>@Chakshu-Bamotra-04 | <a href="https://github.com/DhruvalBhinsara1"><img src="https://github.com/DhruvalBhinsara1.png?size=60" width="52" height="52" alt="DhruvalBhinsara1"/></a><br>@DhruvalBhinsara1 | <a href="https://github.com/paripnj"><img src="https://github.com/paripnj.png?size=60" width="52" height="52" alt="paripnj"/></a><br>@paripnj | <a href="https://github.com/nancy-verma780"><img src="https://github.com/nancy-verma780.png?size=60" width="52" height="52" alt="nancy-verma780"/></a><br>@nancy-verma780 | <a href="https://github.com/KRUSHAL2956"><img src="https://github.com/KRUSHAL2956.png?size=60" width="52" height="52" alt="KRUSHAL2956"/></a><br>@KRUSHAL2956 |
| <a href="https://github.com/wyf027"><img src="https://github.com/wyf027.png?size=60" width="52" height="52" alt="wyf027"/></a><br>@wyf027 | <a href="https://github.com/akashgoudsidduluri"><img src="https://github.com/akashgoudsidduluri.png?size=60" width="52" height="52" alt="akashgoudsidduluri"/></a><br>@akashgoudsidduluri | <a href="https://github.com/jainiksha"><img src="https://github.com/jainiksha.png?size=60" width="52" height="52" alt="jainiksha"/></a><br>@jainiksha | <a href="https://github.com/tamannaa-rath"><img src="https://github.com/tamannaa-rath.png?size=60" width="52" height="52" alt="tamannaa-rath"/></a><br>@tamannaa-rath | <a href="https://github.com/dynamo-pentester"><img src="https://github.com/dynamo-pentester.png?size=60" width="52" height="52" alt="dynamo-pentester"/></a><br>@dynamo-pentester |
| <a href="https://github.com/pragya0129"><img src="https://github.com/pragya0129.png?size=60" width="52" height="52" alt="pragya0129"/></a><br>@pragya0129 | <a href="https://github.com/anshul23102"><img src="https://github.com/anshul23102.png?size=60" width="52" height="52" alt="anshul23102"/></a><br>@anshul23102 | <a href="https://github.com/siddharth277"><img src="https://github.com/siddharth277.png?size=60" width="52" height="52" alt="siddharth277"/></a><br>@siddharth277 | <a href="https://github.com/PRODHOSH"><img src="https://github.com/PRODHOSH.png?size=60" width="52" height="52" alt="PRODHOSH"/></a><br>@PRODHOSH | <a href="https://github.com/anshika1179"><img src="https://github.com/anshika1179.png?size=60" width="52" height="52" alt="anshika1179"/></a><br>@anshika1179 |
| <a href="https://github.com/paridhijain153"><img src="https://github.com/paridhijain153.png?size=60" width="52" height="52" alt="paridhijain153"/></a><br>@paridhijain153 | <a href="https://github.com/omnipotentchaos"><img src="https://github.com/omnipotentchaos.png?size=60" width="52" height="52" alt="omnipotentchaos"/></a><br>@omnipotentchaos | <a href="https://github.com/vedant7007"><img src="https://github.com/vedant7007.png?size=60" width="52" height="52" alt="vedant7007"/></a><br>@vedant7007 | <a href="https://github.com/Ayushh-Sharmaa"><img src="https://github.com/Ayushh-Sharmaa.png?size=60" width="52" height="52" alt="Ayushh-Sharmaa"/></a><br>@Ayushh-Sharmaa | <a href="https://github.com/suhaniiz"><img src="https://github.com/suhaniiz.png?size=60" width="52" height="52" alt="suhaniiz"/></a><br>@suhaniiz |
| <a href="https://github.com/AMAN194701"><img src="https://github.com/AMAN194701.png?size=60" width="52" height="52" alt="AMAN194701"/></a><br>@AMAN194701 | <a href="https://github.com/Divyanshu227"><img src="https://github.com/Divyanshu227.png?size=60" width="52" height="52" alt="Divyanshu227"/></a><br>@Divyanshu227 | <a href="https://github.com/thevaibhavtyagi"><img src="https://github.com/thevaibhavtyagi.png?size=60" width="52" height="52" alt="thevaibhavtyagi"/></a><br>@thevaibhavtyagi | <a href="https://github.com/skypank-coder"><img src="https://github.com/skypank-coder.png?size=60" width="52" height="52" alt="skypank-coder"/></a><br>@skypank-coder | <a href="https://github.com/harshbok69-bit"><img src="https://github.com/harshbok69-bit.png?size=60" width="52" height="52" alt="harshbok69-bit"/></a><br>@harshbok69-bit |
| <a href="https://github.com/SuhridXSingh"><img src="https://github.com/SuhridXSingh.png?size=60" width="52" height="52" alt="SuhridXSingh"/></a><br>@SuhridXSingh | <a href="https://github.com/Sweksha-Kakkar"><img src="https://github.com/Sweksha-Kakkar.png?size=60" width="52" height="52" alt="Sweksha-Kakkar"/></a><br>@Sweksha-Kakkar | <a href="https://github.com/Pratikshya32"><img src="https://github.com/Pratikshya32.png?size=60" width="52" height="52" alt="Pratikshya32"/></a><br>@Pratikshya32 | <a href="https://github.com/adityayadav176"><img src="https://github.com/adityayadav176.png?size=60" width="52" height="52" alt="adityayadav176"/></a><br>@adityayadav176 | <a href="https://github.com/advikdivekar"><img src="https://github.com/advikdivekar.png?size=60" width="52" height="52" alt="advikdivekar"/></a><br>@advikdivekar |
| <a href="https://github.com/PanditG4303"><img src="https://github.com/PanditG4303.png?size=60" width="52" height="52" alt="PanditG4303"/></a><br>@PanditG4303 | <a href="https://github.com/NiranjanDoijode23"><img src="https://github.com/NiranjanDoijode23.png?size=60" width="52" height="52" alt="NiranjanDoijode23"/></a><br>@NiranjanDoijode23 | <a href="https://github.com/vaishnavijha12"><img src="https://github.com/vaishnavijha12.png?size=60" width="52" height="52" alt="vaishnavijha12"/></a><br>@vaishnavijha12 | <a href="https://github.com/ishitaajain22-tech"><img src="https://github.com/ishitaajain22-tech.png?size=60" width="52" height="52" alt="ishitaajain22-tech"/></a><br>@ishitaajain22-tech | <a href="https://github.com/yuvraj-k-singh"><img src="https://github.com/yuvraj-k-singh.png?size=60" width="52" height="52" alt="yuvraj-k-singh"/></a><br>@yuvraj-k-singh |
| <a href="https://github.com/Vikrant0207"><img src="https://github.com/Vikrant0207.png?size=60" width="52" height="52" alt="Vikrant0207"/></a><br>@Vikrant0207 | <a href="https://github.com/DebasmitaBose0"><img src="https://github.com/DebasmitaBose0.png?size=60" width="52" height="52" alt="DebasmitaBose0"/></a><br>@DebasmitaBose0 | <a href="https://github.com/Julliet-Mohanta"><img src="https://github.com/Julliet-Mohanta.png?size=60" width="52" height="52" alt="Julliet-Mohanta"/></a><br>@Julliet-Mohanta | <a href="https://github.com/Shanidhya01"><img src="https://github.com/Shanidhya01.png?size=60" width="52" height="52" alt="Shanidhya01"/></a><br>@Shanidhya01 | <a href="https://github.com/nimkarprachi17"><img src="https://github.com/nimkarprachi17.png?size=60" width="52" height="52" alt="nimkarprachi17"/></a><br>@nimkarprachi17 |
| <a href="https://github.com/thakurakanksha288"><img src="https://github.com/thakurakanksha288.png?size=60" width="52" height="52" alt="thakurakanksha288"/></a><br>@thakurakanksha288 | <a href="https://github.com/SOHALIYAJAY"><img src="https://github.com/SOHALIYAJAY.png?size=60" width="52" height="52" alt="SOHALIYAJAY"/></a><br>@SOHALIYAJAY | <a href="https://github.com/Nihal-Reddy-K"><img src="https://github.com/Nihal-Reddy-K.png?size=60" width="52" height="52" alt="Nihal-Reddy-K"/></a><br>@Nihal-Reddy-K | <a href="https://github.com/AdityaNarayanPadhi"><img src="https://github.com/AdityaNarayanPadhi.png?size=60" width="52" height="52" alt="AdityaNarayanPadhi"/></a><br>@AdityaNarayanPadhi | <a href="https://github.com/Dhyeya29"><img src="https://github.com/Dhyeya29.png?size=60" width="52" height="52" alt="Dhyeya29"/></a><br>@Dhyeya29 |
| <a href="https://github.com/hitdepani"><img src="https://github.com/hitdepani.png?size=60" width="52" height="52" alt="hitdepani"/></a><br>@hitdepani | <a href="https://github.com/varun29sharma"><img src="https://github.com/varun29sharma.png?size=60" width="52" height="52" alt="varun29sharma"/></a><br>@varun29sharma | <a href="https://github.com/Vaghasiya-Jemit-kanaiyalal"><img src="https://github.com/Vaghasiya-Jemit-kanaiyalal.png?size=60" width="52" height="52" alt="Vaghasiya-Jemit-kanaiyalal"/></a><br>@Vaghasiya-Jemit-kanaiyalal | <a href="https://github.com/udaycodespace"><img src="https://github.com/udaycodespace.png?size=60" width="52" height="52" alt="udaycodespace"/></a><br>@udaycodespace | <a href="https://github.com/PradeepTech-hub"><img src="https://github.com/PradeepTech-hub.png?size=60" width="52" height="52" alt="PradeepTech-hub"/></a><br>@PradeepTech-hub |
| <a href="https://github.com/the-rahul-07"><img src="https://github.com/the-rahul-07.png?size=60" width="52" height="52" alt="the-rahul-07"/></a><br>@the-rahul-07 | <a href="https://github.com/Meenbudha"><img src="https://github.com/Meenbudha.png?size=60" width="52" height="52" alt="Meenbudha"/></a><br>@Meenbudha | <a href="https://github.com/kanishka-2007-tech"><img src="https://github.com/kanishka-2007-tech.png?size=60" width="52" height="52" alt="kanishka-2007-tech"/></a><br>@kanishka-2007-tech | <a href="https://github.com/dhiraj-dev-19"><img src="https://github.com/dhiraj-dev-19.png?size=60" width="52" height="52" alt="dhiraj-dev-19"/></a><br>@dhiraj-dev-19 | <a href="https://github.com/4nshhh"><img src="https://github.com/4nshhh.png?size=60" width="52" height="52" alt="4nshhh"/></a><br>@4nshhh |
| <a href="https://github.com/Ayushia5"><img src="https://github.com/Ayushia5.png?size=60" width="52" height="52" alt="Ayushia5"/></a><br>@Ayushia5 | <a href="https://github.com/VishnuVardhanCodes"><img src="https://github.com/VishnuVardhanCodes.png?size=60" width="52" height="52" alt="VishnuVardhanCodes"/></a><br>@VishnuVardhanCodes | <a href="https://github.com/Tanish-Solanki"><img src="https://github.com/Tanish-Solanki.png?size=60" width="52" height="52" alt="Tanish-Solanki"/></a><br>@Tanish-Solanki | <a href="https://github.com/pericharlabindhumadhavi-data"><img src="https://github.com/pericharlabindhumadhavi-data.png?size=60" width="52" height="52" alt="pericharlabindhumadhavi-data"/></a><br>@pericharlabindhumadhavi-data | <a href="https://github.com/pracheyyy"><img src="https://github.com/pracheyyy.png?size=60" width="52" height="52" alt="pracheyyy"/></a><br>@pracheyyy |
| <a href="https://github.com/Shrutiii01"><img src="https://github.com/Shrutiii01.png?size=60" width="52" height="52" alt="Shrutiii01"/></a><br>@Shrutiii01 | <a href="https://github.com/pradeep0153"><img src="https://github.com/pradeep0153.png?size=60" width="52" height="52" alt="pradeep0153"/></a><br>@pradeep0153 | <a href="https://github.com/mxskaaan"><img src="https://github.com/mxskaaan.png?size=60" width="52" height="52" alt="mxskaaan"/></a><br>@mxskaaan | <a href="https://github.com/Kritika200520"><img src="https://github.com/Kritika200520.png?size=60" width="52" height="52" alt="Kritika200520"/></a><br>@Kritika200520 | <a href="https://github.com/zairahussain27"><img src="https://github.com/zairahussain27.png?size=60" width="52" height="52" alt="zairahussain27"/></a><br>@zairahussain27 |
| <a href="https://github.com/tanishksinha"><img src="https://github.com/tanishksinha.png?size=60" width="52" height="52" alt="tanishksinha"/></a><br>@tanishksinha | <a href="https://github.com/Shayan-Bhowmik"><img src="https://github.com/Shayan-Bhowmik.png?size=60" width="52" height="52" alt="Shayan-Bhowmik"/></a><br>@Shayan-Bhowmik | <a href="https://github.com/NiravaM"><img src="https://github.com/NiravaM.png?size=60" width="52" height="52" alt="NiravaM"/></a><br>@NiravaM | <a href="https://github.com/namrarafique93-del"><img src="https://github.com/namrarafique93-del.png?size=60" width="52" height="52" alt="namrarafique93-del"/></a><br>@namrarafique93-del | <a href="https://github.com/yashvi-3106"><img src="https://github.com/yashvi-3106.png?size=60" width="52" height="52" alt="yashvi-3106"/></a><br>@yashvi-3106 |
| <a href="https://github.com/riddhimagupta2"><img src="https://github.com/riddhimagupta2.png?size=60" width="52" height="52" alt="riddhimagupta2"/></a><br>@riddhimagupta2 | <a href="https://github.com/Copilot"><img src="https://github.com/Copilot.png?size=60" width="52" height="52" alt="Copilot"/></a><br>@Copilot | <a href="https://github.com/priyanshi-coder-2"><img src="https://github.com/priyanshi-coder-2.png?size=60" width="52" height="52" alt="priyanshi-coder-2"/></a><br>@priyanshi-coder-2 | <a href="https://github.com/khushi897920-lang"><img src="https://github.com/khushi897920-lang.png?size=60" width="52" height="52" alt="khushi897920-lang"/></a><br>@khushi897920-lang | <a href="https://github.com/Animesh-86"><img src="https://github.com/Animesh-86.png?size=60" width="52" height="52" alt="Animesh-86"/></a><br>@Animesh-86 |
| <a href="https://github.com/anujsharma8d"><img src="https://github.com/anujsharma8d.png?size=60" width="52" height="52" alt="anujsharma8d"/></a><br>@anujsharma8d | <a href="https://github.com/Bhavex"><img src="https://github.com/Bhavex.png?size=60" width="52" height="52" alt="Bhavex"/></a><br>@Bhavex | <a href="https://github.com/ash1shkumar"><img src="https://github.com/ash1shkumar.png?size=60" width="52" height="52" alt="ash1shkumar"/></a><br>@ash1shkumar | <a href="https://github.com/dchokshi28"><img src="https://github.com/dchokshi28.png?size=60" width="52" height="52" alt="dchokshi28"/></a><br>@dchokshi28 | <a href="https://github.com/parakramgambhir2025"><img src="https://github.com/parakramgambhir2025.png?size=60" width="52" height="52" alt="parakramgambhir2025"/></a><br>@parakramgambhir2025 |
| <a href="https://github.com/shruti-codes-design"><img src="https://github.com/shruti-codes-design.png?size=60" width="52" height="52" alt="shruti-codes-design"/></a><br>@shruti-codes-design | <a href="https://github.com/tanishrajh"><img src="https://github.com/tanishrajh.png?size=60" width="52" height="52" alt="tanishrajh"/></a><br>@tanishrajh | <a href="https://github.com/Hiral-Barot"><img src="https://github.com/Hiral-Barot.png?size=60" width="52" height="52" alt="Hiral-Barot"/></a><br>@Hiral-Barot | <a href="https://github.com/Rajal-ui"><img src="https://github.com/Rajal-ui.png?size=60" width="52" height="52" alt="Rajal-ui"/></a><br>@Rajal-ui | <a href="https://github.com/pari-dubey1"><img src="https://github.com/pari-dubey1.png?size=60" width="52" height="52" alt="pari-dubey1"/></a><br>@pari-dubey1 |
| <a href="https://github.com/shauryaparth1902-blip"><img src="https://github.com/shauryaparth1902-blip.png?size=60" width="52" height="52" alt="shauryaparth1902-blip"/></a><br>@shauryaparth1902-blip | <a href="https://github.com/surya0904shankar"><img src="https://github.com/surya0904shankar.png?size=60" width="52" height="52" alt="surya0904shankar"/></a><br>@surya0904shankar | <a href="https://github.com/AdityaSekharDas"><img src="https://github.com/AdityaSekharDas.png?size=60" width="52" height="52" alt="AdityaSekharDas"/></a><br>@AdityaSekharDas | <a href="https://github.com/adityack477"><img src="https://github.com/adityack477.png?size=60" width="52" height="52" alt="adityack477"/></a><br>@adityack477 | <a href="https://github.com/Kirtan-pc"><img src="https://github.com/Kirtan-pc.png?size=60" width="52" height="52" alt="Kirtan-pc"/></a><br>@Kirtan-pc |
| <a href="https://github.com/ANSHIKATYAGI30"><img src="https://github.com/ANSHIKATYAGI30.png?size=60" width="52" height="52" alt="ANSHIKATYAGI30"/></a><br>@ANSHIKATYAGI30 | <a href="https://github.com/Asifmd45"><img src="https://github.com/Asifmd45.png?size=60" width="52" height="52" alt="Asifmd45"/></a><br>@Asifmd45 | <a href="https://github.com/vaishalig03"><img src="https://github.com/vaishalig03.png?size=60" width="52" height="52" alt="vaishalig03"/></a><br>@vaishalig03 | <a href="https://github.com/ssuyashhhh"><img src="https://github.com/ssuyashhhh.png?size=60" width="52" height="52" alt="ssuyashhhh"/></a><br>@ssuyashhhh | <a href="https://github.com/Prashantbhati7"><img src="https://github.com/Prashantbhati7.png?size=60" width="52" height="52" alt="Prashantbhati7"/></a><br>@Prashantbhati7 |
| <a href="https://github.com/Neelr1912"><img src="https://github.com/Neelr1912.png?size=60" width="52" height="52" alt="Neelr1912"/></a><br>@Neelr1912 | <a href="https://github.com/Neel-Aiprog"><img src="https://github.com/Neel-Aiprog.png?size=60" width="52" height="52" alt="Neel-Aiprog"/></a><br>@Neel-Aiprog | <a href="https://github.com/Nazia012"><img src="https://github.com/Nazia012.png?size=60" width="52" height="52" alt="Nazia012"/></a><br>@Nazia012 | <a href="https://github.com/aaradhyasinghai-ux"><img src="https://github.com/aaradhyasinghai-ux.png?size=60" width="52" height="52" alt="aaradhyasinghai-ux"/></a><br>@aaradhyasinghai-ux | <a href="https://github.com/Abhii-afk"><img src="https://github.com/Abhii-afk.png?size=60" width="52" height="52" alt="Abhii-afk"/></a><br>@Abhii-afk |
| <a href="https://github.com/vansh-09"><img src="https://github.com/vansh-09.png?size=60" width="52" height="52" alt="vansh-09"/></a><br>@vansh-09 | <a href="https://github.com/sujal-rana58"><img src="https://github.com/sujal-rana58.png?size=60" width="52" height="52" alt="sujal-rana58"/></a><br>@sujal-rana58 | <a href="https://github.com/Sha-lini3"><img src="https://github.com/Sha-lini3.png?size=60" width="52" height="52" alt="Sha-lini3"/></a><br>@Sha-lini3 | <a href="https://github.com/shreyasingh260"><img src="https://github.com/shreyasingh260.png?size=60" width="52" height="52" alt="shreyasingh260"/></a><br>@shreyasingh260 | <a href="https://github.com/oshin-30"><img src="https://github.com/oshin-30.png?size=60" width="52" height="52" alt="oshin-30"/></a><br>@oshin-30 |
| <a href="https://github.com/ziyakhan04"><img src="https://github.com/ziyakhan04.png?size=60" width="52" height="52" alt="ziyakhan04"/></a><br>@ziyakhan04 | <a href="https://github.com/Yashrajsinh-Kanchva"><img src="https://github.com/Yashrajsinh-Kanchva.png?size=60" width="52" height="52" alt="Yashrajsinh-Kanchva"/></a><br>@Yashrajsinh-Kanchva | <a href="https://github.com/Subham503"><img src="https://github.com/Subham503.png?size=60" width="52" height="52" alt="Subham503"/></a><br>@Subham503 | <a href="https://github.com/Smrithi-krishna"><img src="https://github.com/Smrithi-krishna.png?size=60" width="52" height="52" alt="Smrithi-krishna"/></a><br>@Smrithi-krishna | <a href="https://github.com/Shashank-8p"><img src="https://github.com/Shashank-8p.png?size=60" width="52" height="52" alt="Shashank-8p"/></a><br>@Shashank-8p |
| <a href="https://github.com/saniya196"><img src="https://github.com/saniya196.png?size=60" width="52" height="52" alt="saniya196"/></a><br>@saniya196 | <a href="https://github.com/aanyabansal-22"><img src="https://github.com/aanyabansal-22.png?size=60" width="52" height="52" alt="aanyabansal-22"/></a><br>@aanyabansal-22 | <a href="https://github.com/Ankitkr16"><img src="https://github.com/Ankitkr16.png?size=60" width="52" height="52" alt="Ankitkr16"/></a><br>@Ankitkr16 | <a href="https://github.com/ApekshaRao27"><img src="https://github.com/ApekshaRao27.png?size=60" width="52" height="52" alt="ApekshaRao27"/></a><br>@ApekshaRao27 | <a href="https://github.com/dhruv-jani-0808"><img src="https://github.com/dhruv-jani-0808.png?size=60" width="52" height="52" alt="dhruv-jani-0808"/></a><br>@dhruv-jani-0808 |
| <a href="https://github.com/gowthamrdyy"><img src="https://github.com/gowthamrdyy.png?size=60" width="52" height="52" alt="gowthamrdyy"/></a><br>@gowthamrdyy | <a href="https://github.com/HarmiBhikadiya"><img src="https://github.com/HarmiBhikadiya.png?size=60" width="52" height="52" alt="HarmiBhikadiya"/></a><br>@HarmiBhikadiya | <a href="https://github.com/Ketandora"><img src="https://github.com/Ketandora.png?size=60" width="52" height="52" alt="Ketandora"/></a><br>@Ketandora | <a href="https://github.com/KhushiYadav-26"><img src="https://github.com/KhushiYadav-26.png?size=60" width="52" height="52" alt="KhushiYadav-26"/></a><br>@KhushiYadav-26 | <a href="https://github.com/Kokila-chandrakar"><img src="https://github.com/Kokila-chandrakar.png?size=60" width="52" height="52" alt="Kokila-chandrakar"/></a><br>@Kokila-chandrakar |
| <a href="https://github.com/ranbeer06052009"><img src="https://github.com/ranbeer06052009.png?size=60" width="52" height="52" alt="ranbeer06052009"/></a><br>@ranbeer06052009 | <a href="https://github.com/rajesh-puripanda"><img src="https://github.com/rajesh-puripanda.png?size=60" width="52" height="52" alt="rajesh-puripanda"/></a><br>@rajesh-puripanda | <a href="https://github.com/parakramgambhir14"><img src="https://github.com/parakramgambhir14.png?size=60" width="52" height="52" alt="parakramgambhir14"/></a><br>@parakramgambhir14 | <a href="https://github.com/Owais-Siddique-11"><img src="https://github.com/Owais-Siddique-11.png?size=60" width="52" height="52" alt="Owais-Siddique-11"/></a><br>@Owais-Siddique-11 | <a href="https://github.com/Nirmai-06"><img src="https://github.com/Nirmai-06.png?size=60" width="52" height="52" alt="Nirmai-06"/></a><br>@Nirmai-06 |
| <a href="https://github.com/Lishhhh07"><img src="https://github.com/Lishhhh07.png?size=60" width="52" height="52" alt="Lishhhh07"/></a><br>@Lishhhh07 | <a href="https://github.com/Meera2906"><img src="https://github.com/Meera2906.png?size=60" width="52" height="52" alt="Meera2906"/></a><br>@Meera2906 | <a href="https://github.com/Nilamma19"><img src="https://github.com/Nilamma19.png?size=60" width="52" height="52" alt="Nilamma19"/></a><br>@Nilamma19 | <a href="https://github.com/kannatinaveena"><img src="https://github.com/kannatinaveena.png?size=60" width="52" height="52" alt="kannatinaveena"/></a><br>@kannatinaveena | <a href="https://github.com/Shrutii-Rai"><img src="https://github.com/Shrutii-Rai.png?size=60" width="52" height="52" alt="Shrutii-Rai"/></a><br>@Shrutii-Rai |
| <a href="https://github.com/Shrutika-Dahale"><img src="https://github.com/Shrutika-Dahale.png?size=60" width="52" height="52" alt="Shrutika-Dahale"/></a><br>@Shrutika-Dahale | <a href="https://github.com/panditshubham766-dotcom"><img src="https://github.com/panditshubham766-dotcom.png?size=60" width="52" height="52" alt="panditshubham766-dotcom"/></a><br>@panditshubham766-dotcom | <a href="https://github.com/Tannie02"><img src="https://github.com/Tannie02.png?size=60" width="52" height="52" alt="Tannie02"/></a><br>@Tannie02 | <a href="https://github.com/Thejaswini-VS"><img src="https://github.com/Thejaswini-VS.png?size=60" width="52" height="52" alt="Thejaswini-VS"/></a><br>@Thejaswini-VS | <a href="https://github.com/UTKARSHH20"><img src="https://github.com/UTKARSHH20.png?size=60" width="52" height="52" alt="UTKARSHH20"/></a><br>@UTKARSHH20 |
| <a href="https://github.com/vikasverma101"><img src="https://github.com/vikasverma101.png?size=60" width="52" height="52" alt="vikasverma101"/></a><br>@vikasverma101 | <a href="https://github.com/VikashRaj110"><img src="https://github.com/VikashRaj110.png?size=60" width="52" height="52" alt="VikashRaj110"/></a><br>@VikashRaj110 | <a href="https://github.com/Vinuthnainti"><img src="https://github.com/Vinuthnainti.png?size=60" width="52" height="52" alt="Vinuthnainti"/></a><br>@Vinuthnainti | <a href="https://github.com/bertolikimberly"><img src="https://github.com/bertolikimberly.png?size=60" width="52" height="52" alt="bertolikimberly"/></a><br>@bertolikimberly | <a href="https://github.com/AnxhDarji"><img src="https://github.com/AnxhDarji.png?size=60" width="52" height="52" alt="AnxhDarji"/></a><br>@AnxhDarji |
| <a href="https://github.com/indreshgit10"><img src="https://github.com/indreshgit10.png?size=60" width="52" height="52" alt="indreshgit10"/></a><br>@indreshgit10 | <a href="https://github.com/karthick7204"><img src="https://github.com/karthick7204.png?size=60" width="52" height="52" alt="karthick7204"/></a><br>@karthick7204 | <a href="https://github.com/nisha-bugalia"><img src="https://github.com/nisha-bugalia.png?size=60" width="52" height="52" alt="nisha-bugalia"/></a><br>@nisha-bugalia | <a href="https://github.com/nishitha011"><img src="https://github.com/nishitha011.png?size=60" width="52" height="52" alt="nishitha011"/></a><br>@nishitha011 | <a href="https://github.com/pratikshasuryawanshi843-ui"><img src="https://github.com/pratikshasuryawanshi843-ui.png?size=60" width="52" height="52" alt="pratikshasuryawanshi843-ui"/></a><br>@pratikshasuryawanshi843-ui |
| <a href="https://github.com/Sagun-Bajpai"><img src="https://github.com/Sagun-Bajpai.png?size=60" width="52" height="52" alt="Sagun-Bajpai"/></a><br>@Sagun-Bajpai | <a href="https://github.com/sarthakshruti999-code"><img src="https://github.com/sarthakshruti999-code.png?size=60" width="52" height="52" alt="sarthakshruti999-code"/></a><br>@sarthakshruti999-code | <a href="https://github.com/shambhavivartika06-cmyk"><img src="https://github.com/shambhavivartika06-cmyk.png?size=60" width="52" height="52" alt="shambhavivartika06-cmyk"/></a><br>@shambhavivartika06-cmyk | <a href="https://github.com/suhanimaurya05"><img src="https://github.com/suhanimaurya05.png?size=60" width="52" height="52" alt="suhanimaurya05"/></a><br>@suhanimaurya05 | <a href="https://github.com/workwithme67"><img src="https://github.com/workwithme67.png?size=60" width="52" height="52" alt="workwithme67"/></a><br>@workwithme67 |
| <a href="https://github.com/lover3123"><img src="https://github.com/lover3123.png?size=60" width="52" height="52" alt="lover3123"/></a><br>@lover3123 | <a href="https://github.com/25032007"><img src="https://github.com/25032007.png?size=60" width="52" height="52" alt="25032007"/></a><br>@25032007 | <a href="https://github.com/pratyuxxhh"><img src="https://github.com/pratyuxxhh.png?size=60" width="52" height="52" alt="pratyuxxhh"/></a><br>@pratyuxxhh | <a href="https://github.com/Achiever199"><img src="https://github.com/Achiever199.png?size=60" width="52" height="52" alt="Achiever199"/></a><br>@Achiever199 | <a href="https://github.com/aishwary-vansh"><img src="https://github.com/aishwary-vansh.png?size=60" width="52" height="52" alt="aishwary-vansh"/></a><br>@aishwary-vansh |
| <a href="https://github.com/Anshika-Gupta9"><img src="https://github.com/Anshika-Gupta9.png?size=60" width="52" height="52" alt="Anshika-Gupta9"/></a><br>@Anshika-Gupta9 | <a href="https://github.com/ARCHITVARMA15"><img src="https://github.com/ARCHITVARMA15.png?size=60" width="52" height="52" alt="ARCHITVARMA15"/></a><br>@ARCHITVARMA15 | <a href="https://github.com/Ayush2496"><img src="https://github.com/Ayush2496.png?size=60" width="52" height="52" alt="Ayush2496"/></a><br>@Ayush2496 | <a href="https://github.com/Dippp10-ally"><img src="https://github.com/Dippp10-ally.png?size=60" width="52" height="52" alt="Dippp10-ally"/></a><br>@Dippp10-ally | <a href="https://github.com/Hussain053"><img src="https://github.com/Hussain053.png?size=60" width="52" height="52" alt="Hussain053"/></a><br>@Hussain053 |
| <a href="https://github.com/krishsoni-hub"><img src="https://github.com/krishsoni-hub.png?size=60" width="52" height="52" alt="krishsoni-hub"/></a><br>@krishsoni-hub | <a href="https://github.com/LalithMadhav-CODING"><img src="https://github.com/LalithMadhav-CODING.png?size=60" width="52" height="52" alt="LalithMadhav-CODING"/></a><br>@LalithMadhav-CODING | <a href="https://github.com/sahare-mayur-0071"><img src="https://github.com/sahare-mayur-0071.png?size=60" width="52" height="52" alt="sahare-mayur-0071"/></a><br>@sahare-mayur-0071 | <a href="https://github.com/Nishita-Thakur"><img src="https://github.com/Nishita-Thakur.png?size=60" width="52" height="52" alt="Nishita-Thakur"/></a><br>@Nishita-Thakur | <a href="https://github.com/Bhavikapatel06"><img src="https://github.com/Bhavikapatel06.png?size=60" width="52" height="52" alt="Bhavikapatel06"/></a><br>@Bhavikapatel06 |
| <a href="https://github.com/PojashriJM"><img src="https://github.com/PojashriJM.png?size=60" width="52" height="52" alt="PojashriJM"/></a><br>@PojashriJM | <a href="https://github.com/Pragya005"><img src="https://github.com/Pragya005.png?size=60" width="52" height="52" alt="Pragya005"/></a><br>@Pragya005 | <a href="https://github.com/pritesh-4"><img src="https://github.com/pritesh-4.png?size=60" width="52" height="52" alt="pritesh-4"/></a><br>@pritesh-4 | <a href="https://github.com/priya434960"><img src="https://github.com/priya434960.png?size=60" width="52" height="52" alt="priya434960"/></a><br>@priya434960 | <a href="https://github.com/Chaudhary8587"><img src="https://github.com/Chaudhary8587.png?size=60" width="52" height="52" alt="Chaudhary8587"/></a><br>@Chaudhary8587 |
| <a href="https://github.com/SARTHAKJINDAL1"><img src="https://github.com/SARTHAKJINDAL1.png?size=60" width="52" height="52" alt="SARTHAKJINDAL1"/></a><br>@SARTHAKJINDAL1 | <a href="https://github.com/Sanjay452656"><img src="https://github.com/Sanjay452656.png?size=60" width="52" height="52" alt="Sanjay452656"/></a><br>@Sanjay452656 | <a href="https://github.com/SatyajeetSahoo08"><img src="https://github.com/SatyajeetSahoo08.png?size=60" width="52" height="52" alt="SatyajeetSahoo08"/></a><br>@SatyajeetSahoo08 | <a href="https://github.com/savniagrawal1701"><img src="https://github.com/savniagrawal1701.png?size=60" width="52" height="52" alt="savniagrawal1701"/></a><br>@savniagrawal1701 |  |
<!-- CONTRIBUTORS:END -->

---

## 🏗️ System Architecture Blueprint

Want to learn more about how Learnova's underlying technology behaves under the hood? Read our detailed, Mermaid-enhanced [System Architecture Guide](file:///e:/Learnova/Learnova/docs/ARCHITECTURE.md) to understand routing middleware verification, neural network face detection thresholds, and offline PWA queues.

### 🛠️ Documentation Improvements
- Add badges (optional): build, license, contributors
- Add screenshots for better UI understanding
- Standardize code blocks for commands

### 🎯 Goal
Improve onboarding experience for new contributors and users by making README more structured, readable, and professional.

| <a href="https://github.com/AdityaSekharDas"><img src="https://github.com/AdityaSekharDas.png?size=60" width="52" height="52" alt="AdityaSekharDas"/></a><br>@AdityaSekharDas | <a href="https://github.com/adityayadav176"><img src="https://github.com/adityayadav176.png?size=60" width="52" height="52" alt="adityayadav176"/></a><br>@adityayadav176 | <a href="https://github.com/adityack477"><img src="https://github.com/adityack477.png?size=60" width="52" height="52" alt="adityack477"/></a><br>@adityack477 | <a href="https://github.com/Nazia012"><img src="https://github.com/Nazia012.png?size=60" width="52" height="52" alt="Nazia012"/></a><br>@Nazia012 | <a href="https://github.com/dchokshi28"><img src="https://github.com/dchokshi28.png?size=60" width="52" height="52" alt="dchokshi28"/></a><br>@dchokshi28 |
| <a href="https://github.com/ash1shkumar"><img src="https://github.com/ash1shkumar.png?size=60" width="52" height="52" alt="ash1shkumar"/></a><br>@ash1shkumar | | | | |
| :---: | :---: | :---: | :---: | :---: |

### GSSoC Attendance Passcode Masking Guidelines
- Always mask attendance code states internally.
