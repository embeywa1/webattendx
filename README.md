# ⚡ AttendX — Role-Based Academic Attendance Platform



An enterprise-grade, role-based academic attendance tracking platform built to eliminate proxy attendance, streamline session toggling, and deliver real-time audit logging for institutional workloads. Powered by **React**, **Tailwind CSS**, and **Supabase** with granular **PostgreSQL Row-Level Security (RLS)** policies.

---

## 🔐 Core Features & Security Architecture

- **Role-Based Access Control (RBAC):** Distinct dashboard interfaces, routing permissions, and database policies for Administrators, Instructors, and Students.
- **Dynamic Session Toggling:** Instructors can launch, monitor, and lock live attendance sessions on demand with microsecond precision.
- **PostgreSQL Row-Level Security (RLS):** Data access rules enforced directly at the database engine level—preventing unauthorized API data access across student accounts.
- **Real-Time Telemetry & Auditing:** Real-time log monitoring for active sessions, attendance marking, and data reconciliation.
- **Cyber-Dark High-Contrast Dashboard:** Optimized for low-light lab environments and high-density system operations.

---

## 🛠️ Tech Stack

- **Frontend:** React.js, Tailwind CSS, Lucide React Icons
- **Backend / BaaS:** Supabase (Auth, Realtime, Database)
- **Database:** PostgreSQL with custom PL/pgSQL functions & RLS policies
- **Version Control & CI/CD:** Git, GitHub, Vercel / Lovable Deployment

---

## 🚀 Quickstart & Local Setup

### Prerequisites

Ensure you have the following installed on your local environment:
- **Node.js** (v18.0 or higher)
- **npm** or **pnpm**
- A **Supabase** project instance

### 1. Clone the Repository

```bash
git clone [https://github.com/embeywa1/webattendx.git](https://github.com/embeywa1/webattendx.git)
cd webattendx
```
2.Install Dependencies
Bash
npm install

3. Configure Environment Variables
Create a .env.local file in the project root directory and attach your Supabase API credentials:

Code snippet
VITE_SUPABASE_URL=[https://your-supabase-project.supabase.co](https://your-supabase-project.supabase.co)
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
4. Run Development Server
Bash
npm run dev
Open http://localhost:5173 in your browser to view the application.

🗄️ Database Schema & Security Setup
Execute the schema migration script in your Supabase SQL Editor to initialize required tables and security rules:
-- Enable Row Level Security (RLS) on Attendance Records
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Create policy allowing instructors full session management
CREATE POLICY "Instructors manage sessions"
ON public.attendance_records
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'instructor');

-- Create policy allowing students to view only their own records
CREATE POLICY "Students read own records"
ON public.attendance_records
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

📂 Project Structure
Plaintext
webattendx/
├── src/
│   ├── components/      # Reusable Cyber-Dark UI components
│   ├── context/         # Auth & Session React Providers
│   ├── hooks/           # Custom Supabase real-time hooks
│   ├── pages/           # Admin, Instructor, and Student Dashboards
│   ├── lib/             # Supabase client configuration
│   └── styles/          # Tailwind custom utility layers
├── public/              # Static assets & brand icons
├── .env.local           # Environment configuration
└── package.json         # Project manifests and scripts
