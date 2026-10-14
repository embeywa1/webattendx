# AttendX: Cyber Tracker

# LOVABLE MASTER SYSTEM PROMPT: ATTENDX

You are an expert full-stack React and Supabase developer. Your task is to generate and refine a complete, production-ready React web application named **AttendX**.

## 1. PROJECT OVERVIEW

AttendX is a role-based attendance tracking platform for educational institutions. It features strict Row Level Security (RLS) separating "faculty" and "student" roles. 

**Design Aesthetic (CRITICAL):**

The UI must follow a "Cyber-Dark" and "High-Tech Terminal" aesthetic. 

*   **Backgrounds:** Deep charcoal and true blacks (`bg-gray-900`, `bg-black`).

*   **Primary Accents:** Electric cyan (`text-cyan-400`, `border-cyan-500`) for active states and primary buttons.

*   **Secondary/Highlight Accents:** Bitcoin orange (`text-orange-500`, `bg-orange-500`) for warnings, highlights, or critical call-to-actions.

*   **Typography:** Monospace fonts for data grids and roll numbers; clean sans-serif for general UI text.

## 2. TECH STACK

*   **Frontend:** React (Vite), React Router DOM v6

*   **Styling:** Tailwind CSS, Shadcn UI components (dark mode default), Lucide React (icons)

*   **State Management:** React Context (for Auth), TanStack React Query (for data fetching)

*   **Backend & DB:** Supabase (PostgreSQL, GoTrue Auth)

## 3. SUPABASE DATABASE SCHEMA & RLS

*Assume the database is already provisioned with the following tables and strict RLS policies are active. Do not write queries that attempt to bypass RLS.*

*   `profiles`: `id` (uuid, references auth.users), `email`, `full_name`, `role` ('faculty' or 'student'), `roll_number`, `created_at`.

*   `classes`: `id`, `teacher_id` (refs profiles), `course_code`, `course_name`, `created_at`.

*   `class_students`: `id`, `class_id`, `student_id` (refs profiles, nullable), `roll_number`, `joined_at`.

*   `attendance_sessions`: `id`, `class_id`, `session_date`, `status` ('open', 'closed').

*   `attendance_records`: `id`, `session_id`, `class_student_id`, `status` ('present', 'absent', 'late').

## 4. APPLICATION ARCHITECTURE & FILE STRUCTURE

Generate the application following this exact directory structure:

```text

src/

├── components/

│   ├── auth/

│   │   ├── LoginForm.jsx

│   │   └── ProtectedRoute.jsx      # Checks role and auth state

│   ├── layout/

│   │   ├── DashboardSidebar.jsx    # Renders diff links based on role

│   │   └── TopNav.jsx

│   ├── faculty/

│   │   ├── ClassManager.jsx        # CRUD for classes

│   │   ├── RosterUpload.jsx        # CSV/Manual roll number entry

│   │   ├── LiveAttendanceTaker.jsx # Data grid for marking presence

│   │   └── ReportGenerator.jsx     # Export to PDF/CSV

│   └── student/

│       ├── StudentDashboard.jsx

│       └── MyAttendanceView.jsx    # Read-only attendance stats

├── services/

│   ├── supabaseClient.js           # Supabase initialization

│   ├── authApi.js                  # Login/Logout/Session management

│   ├── classApi.js                 # Fetching/Creating classes

│   └── attendanceApi.js            # Submitting attendance records

├── contexts/

│   └── AuthContext.jsx             # Provides current user and role

└── App.jsx                         # React Router configuration
5. CORE FUNCTIONALITY REQUIREMENTS

Authentication Flow:

Users log in via email/password.

On login, fetch the user's profile to determine role.

Route faculty to /faculty/dashboard and student to /student/dashboard.

Faculty Workflows:

Create Class: Form to input course_code and course_name.

Manage Roster: Faculty can add students to a class by roll_number.

Take Attendance:

Faculty creates a new attendance_session for a class.

UI displays a list of all students in class_students for that class.

Faculty clicks Present/Absent/Late toggles.

Save button performs a bulk upsert to attendance_records.

Student Workflows:

View Classes: See all classes where their roll_number or student_id is on the roster.

View Attendance: See aggregate stats (e.g., "85% attendance in CS101") and session-by-session history.

6. CODING STANDARDS

Create distinct, reusable UI components.

Extract all Supabase database calls into the /services/ directory. Do not embed Supabase queries directly inside React UI components.

Handle all loading and error states gracefully using electric cyan spinners or orange error banners.

Ensure all forms are fully controlled and validated before submission.


<ElicitationsGroup message="How would you like to proceed with the frontend?">
  <Elicitation label="Draft the Supabase Service APIs" query="Generate the React service files (classApi.js and attendanceApi.js) that execute the Supabase queries."/>
  <Elicitation label="Build the LiveAttendanceTaker component" query="Write the LiveAttendanceTaker.jsx React component with the cyber-dark styling and toggle logic."/>
  <ElicitationsGroup label="Design the AuthContext" query="Generate the AuthContext.jsx file to handle Supabase session state and role-based routing."/>
</ElicitationsGroup>

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://webattendx.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6409721a-e49b-4101-b8f7-4054dd2c5c7e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
