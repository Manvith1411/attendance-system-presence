import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Search,
  Trash2,
  LogOut,
  Moon,
  Sun,
  LayoutGrid,
  List,
  Save,
  CheckSquare,
  GraduationCap,
  Briefcase,
  FileSpreadsheet,
  Building2,
  BookOpen,
  Check
} from 'lucide-react';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export type Role = 'ADMIN' | 'FACULTY' | 'STUDENT';

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface Student {
  id: string;
  usn: string;
  name: string;
  email: string;
  deptCode: string;
  semester: number;
}

export interface Faculty {
  id: string;
  facultyId: string;
  name: string;
  email: string;
  deptCode: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  deptCode: string;
  semester: number;
  facultyId: string;
}

export interface Session {
  id: string;
  courseId: string;
  date: string;
  hours: number;
  topic?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: 'P' | 'A' | 'OD';
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  studentId: string;
  courseId: string;
  date: string;
  reason: string;
  type: 'OD' | 'MEDICAL';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface SystemConfig {
  institutionName: string;
  attendanceThreshold: number;
  isInitialized: boolean;
}

export interface AuthSession {
  role: Role;
  userId: string;
  name: string;
  identifier: string;
}

// ==========================================
// STORAGE HELPERS
// ==========================================

const STORAGE_KEYS = {
  CONFIG: 'presence_inst_config',
  ADMIN_AUTH: 'presence_inst_admin',
  DEPTS: 'presence_inst_depts',
  STUDENTS: 'presence_inst_students',
  FACULTY: 'presence_inst_faculty',
  COURSES: 'presence_inst_courses',
  SESSIONS: 'presence_inst_sessions',
  ATTENDANCE: 'presence_inst_attendance',
  LEAVES: 'presence_inst_leaves',
  CURRENT_USER: 'presence_inst_current_user',
  THEME: 'presence_theme'
};

const getStored = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const setStored = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed saving to ${key}`, err);
  }
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.THEME) === 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    }
  }, [darkMode]);

  // Master Data
  const [config, setConfig] = useState<SystemConfig>(() =>
    getStored<SystemConfig>(STORAGE_KEYS.CONFIG, {
      institutionName: '',
      attendanceThreshold: 75,
      isInitialized: false
    })
  );

  const [adminAuth, setAdminAuth] = useState<{ email: string; pass: string } | null>(() =>
    getStored(STORAGE_KEYS.ADMIN_AUTH, null)
  );

  const [departments, setDepartments] = useState<Department[]>(() =>
    getStored<Department[]>(STORAGE_KEYS.DEPTS, [])
  );
  const [students, setStudents] = useState<Student[]>(() =>
    getStored<Student[]>(STORAGE_KEYS.STUDENTS, [])
  );
  const [faculty, setFaculty] = useState<Faculty[]>(() =>
    getStored<Faculty[]>(STORAGE_KEYS.FACULTY, [])
  );
  const [courses, setCourses] = useState<Course[]>(() =>
    getStored<Course[]>(STORAGE_KEYS.COURSES, [])
  );
  const [sessions, setSessions] = useState<Session[]>(() =>
    getStored<Session[]>(STORAGE_KEYS.SESSIONS, [])
  );
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() =>
    getStored<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, [])
  );
  const [leaves, setLeaves] = useState<LeaveRequest[]>(() =>
    getStored<LeaveRequest[]>(STORAGE_KEYS.LEAVES, [])
  );

  // Auth & Routing
  const [currentUser, setCurrentUser] = useState<AuthSession | null>(() =>
    getStored<AuthSession | null>(STORAGE_KEYS.CURRENT_USER, null)
  );

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Persistence hooks
  useEffect(() => setStored(STORAGE_KEYS.CONFIG, config), [config]);
  useEffect(() => setStored(STORAGE_KEYS.ADMIN_AUTH, adminAuth), [adminAuth]);
  useEffect(() => setStored(STORAGE_KEYS.DEPTS, departments), [departments]);
  useEffect(() => setStored(STORAGE_KEYS.STUDENTS, students), [students]);
  useEffect(() => setStored(STORAGE_KEYS.FACULTY, faculty), [faculty]);
  useEffect(() => setStored(STORAGE_KEYS.COURSES, courses), [courses]);
  useEffect(() => setStored(STORAGE_KEYS.SESSIONS, sessions), [sessions]);
  useEffect(() => setStored(STORAGE_KEYS.ATTENDANCE, attendance), [attendance]);
  useEffect(() => setStored(STORAGE_KEYS.LEAVES, leaves), [leaves]);
  useEffect(() => setStored(STORAGE_KEYS.CURRENT_USER, currentUser), [currentUser]);

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    setActiveTab('dashboard');
  };

  // 1. Initial Setup Guard
  if (!config.isInitialized) {
    return (
      <SetupWizard
        onComplete={(newConfig, adminCredentials, initialDept) => {
          setConfig(newConfig);
          setAdminAuth(adminCredentials);
          setDepartments([initialDept]);
        }}
        darkMode={darkMode}
        toggleTheme={() => setDarkMode(!darkMode)}
      />
    );
  }

  // 2. Login Gateway
  if (!currentUser) {
    return (
      <LoginPortal
        institutionName={config.institutionName}
        adminAuth={adminAuth}
        facultyList={faculty}
        studentList={students}
        onLogin={(session) => setCurrentUser(session)}
        darkMode={darkMode}
        toggleTheme={() => setDarkMode(!darkMode)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#121214] text-[#1C1C1E] dark:text-[#E8E8E6] transition-colors duration-150 flex flex-col font-sans">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-30 bg-[#FAFAF8]/90 dark:bg-[#121214]/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#2F5D62] text-white flex items-center justify-center font-serif font-bold text-lg">
            P
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
              Presence
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                {currentUser.role}
              </span>
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-mono truncate max-w-[200px] sm:max-w-none">
              {config.institutionName} • {currentUser.name}
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-stone-500 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Navigation Sub-bar */}
      <nav className="bg-white dark:bg-[#18181A] border-b border-stone-200 dark:border-stone-800 px-4 lg:px-8 flex overflow-x-auto gap-2 py-2">
        {currentUser.role === 'FACULTY' && (
          <>
            <NavTab active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={Calendar} label="Mark Attendance" />
            <NavTab active={activeTab === 'register'} onClick={() => setActiveTab('register')} icon={FileSpreadsheet} label="In-App Register" />
            <NavTab active={activeTab === 'leaves'} onClick={() => setActiveTab('leaves')} icon={CheckSquare} label="OD / Leave Requests" />
          </>
        )}

        {currentUser.role === 'STUDENT' && (
          <>
            <NavTab active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={GraduationCap} label="My Attendance" />
            <NavTab active={activeTab === 'leaves'} onClick={() => setActiveTab('leaves')} icon={CheckSquare} label="Submit OD / Leave" />
          </>
        )}

        {currentUser.role === 'ADMIN' && (
          <>
            <NavTab active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={Building2} label="Institute Overview" />
            <NavTab active={activeTab === 'register'} onClick={() => setActiveTab('register')} icon={FileSpreadsheet} label="Attendance Matrix" />
            <NavTab active={activeTab === 'students'} onClick={() => setActiveTab('students')} icon={Users} label="Student Batch" />
            <NavTab active={activeTab === 'faculty'} onClick={() => setActiveTab('faculty')} icon={Briefcase} label="Faculty Roster" />
            <NavTab active={activeTab === 'courses'} onClick={() => setActiveTab('courses')} icon={BookOpen} label="Course Allotment" />
          </>
        )}
      </nav>

      {/* Main Workspace */}
      <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
        {currentUser.role === 'FACULTY' && (
          <>
            {activeTab === 'dashboard' && (
              <FacultyMarkingView
                faculty={faculty.find((f) => f.id === currentUser.userId)!}
                courses={courses.filter((c) => c.facultyId === currentUser.userId)}
                students={students}
                onSaveSession={(newSession, newRecords) => {
                  setSessions((prev) => [...prev, newSession]);
                  setAttendance((prev) => [...prev, ...newRecords]);
                }}
              />
            )}
            {activeTab === 'register' && (
              <AttendanceRegisterView
                courses={courses.filter((c) => c.facultyId === currentUser.userId)}
                students={students}
                sessions={sessions}
                attendanceRecords={attendance}
                threshold={config.attendanceThreshold}
              />
            )}
            {activeTab === 'leaves' && (
              <FacultyLeaveApproval
                leaves={leaves}
                students={students}
                courses={courses.filter((c) => c.facultyId === currentUser.userId)}
                onUpdateLeave={(id, status) => {
                  setLeaves((prev) =>
                    prev.map((l) => (l.id === id ? { ...l, status } : l))
                  );
                }}
              />
            )}
          </>
        )}

        {currentUser.role === 'STUDENT' && (
          <>
            {activeTab === 'dashboard' && (
              <StudentDashboard
                student={students.find((s) => s.id === currentUser.userId)!}
                courses={courses.filter((c) => c.deptCode === currentUser.identifier || c.semester === 5 || true)}
                sessions={sessions}
                attendance={attendance}
                threshold={config.attendanceThreshold}
              />
            )}
            {activeTab === 'leaves' && (
              <StudentLeaveSubmission
                student={students.find((s) => s.id === currentUser.userId)!}
                courses={courses}
                leaves={leaves.filter((l) => l.studentId === currentUser.userId)}
                onSubmitLeave={(newReq) => setLeaves((prev) => [newReq, ...prev])}
              />
            )}
          </>
        )}

        {currentUser.role === 'ADMIN' && (
          <>
            {activeTab === 'dashboard' && (
              <AdminDashboard
                config={config}
                departments={departments}
                studentsCount={students.length}
                facultyCount={faculty.length}
                coursesCount={courses.length}
                sessionsCount={sessions.length}
                onUpdateThreshold={(val) => setConfig({ ...config, attendanceThreshold: val })}
              />
            )}
            {activeTab === 'register' && (
              <AttendanceRegisterView
                courses={courses}
                students={students}
                sessions={sessions}
                attendanceRecords={attendance}
                threshold={config.attendanceThreshold}
              />
            )}
            {activeTab === 'students' && (
              <AdminStudentManager
                departments={departments}
                students={students}
                onAddStudent={(newSt) => setStudents((prev) => [...prev, newSt])}
                onBulkAdd={(newStudents) => setStudents((prev) => [...prev, ...newStudents])}
                onDeleteStudent={(id) => {
                  setStudents((prev) => prev.filter((s) => s.id !== id));
                  setAttendance((prev) => prev.filter((a) => a.studentId !== id));
                }}
              />
            )}
            {activeTab === 'faculty' && (
              <AdminFacultyManager
                departments={departments}
                faculty={faculty}
                onAddFaculty={(newF) => setFaculty((prev) => [...prev, newF])}
                onDeleteFaculty={(id) => setFaculty((prev) => prev.filter((f) => f.id !== id))}
              />
            )}
            {activeTab === 'courses' && (
              <AdminCourseManager
                departments={departments}
                faculty={faculty}
                courses={courses}
                onAddCourse={(newC) => setCourses((prev) => [...prev, newC])}
                onDeleteCourse={(id) => setCourses((prev) => prev.filter((c) => c.id !== id))}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ==========================================
// NAVIGATION TAB COMPONENT
// ==========================================

function NavTab({
  active,
  onClick,
  icon: Icon,
  label
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
        active
          ? 'bg-[#2F5D62] text-white shadow-sm'
          : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );
}

// ==========================================
// 1. SETUP WIZARD (FIRST LAUNCH)
// ==========================================

function SetupWizard({
  onComplete,
  darkMode,
  toggleTheme
}: {
  onComplete: (config: SystemConfig, adminAuth: { email: string; pass: string }, dept: Department) => void;
  darkMode: boolean;
  toggleTheme: () => void;
}) {
  const [instName, setInstName] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [threshold, setThreshold] = useState(75);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instName || !deptName || !deptCode || !adminEmail || !adminPassword) {
      alert('Please fill out all required setup fields.');
      return;
    }

    const config: SystemConfig = {
      institutionName: instName,
      attendanceThreshold: threshold,
      isInitialized: true
    };

    const adminAuth = {
      email: adminEmail.trim().toLowerCase(),
      pass: adminPassword
    };

    const initialDept: Department = {
      id: 'dept_' + Date.now(),
      name: deptName.trim(),
      code: deptCode.trim().toUpperCase()
    };

    onComplete(config, adminAuth, initialDept);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#121214] flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-stone-500 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="w-full max-w-lg bg-white dark:bg-[#1C1C1E] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#2F5D62] text-white flex items-center justify-center font-serif font-bold text-xl">
            P
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
              Institutional Setup
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Configure Presence for your college deployment
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              Institution / College Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. N.M.A.M. Institute of Technology"
              value={instName}
              onChange={(e) => setInstName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-[#2F5D62]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Primary Department
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Information Science"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-[#2F5D62]"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Dept Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ISE"
                value={deptCode}
                onChange={(e) => setDeptCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm uppercase focus:outline-none focus:ring-1 focus:ring-[#2F5D62]"
              />
            </div>
          </div>

          <div className="border-t border-stone-200 dark:border-stone-800 pt-3">
            <h3 className="font-semibold text-stone-800 dark:text-stone-200 mb-2">
              Master Admin Credentials
            </h3>
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Master Admin Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@college.edu"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-[#2F5D62]"
                />
              </div>
              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Master Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-[#2F5D62]"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-stone-200 dark:border-stone-800 pt-3">
            <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              Minimum Attendance Threshold (%)
            </label>
            <input
              type="number"
              min={50}
              max={95}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-[#2F5D62]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-[#2F5D62] hover:bg-[#254a4e] text-white font-medium text-sm transition-colors mt-2 cursor-pointer"
          >
            Complete Setup & Initialize
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 2. LOGIN PORTAL
// ==========================================

function LoginPortal({
  institutionName,
  adminAuth,
  facultyList,
  studentList,
  onLogin,
  darkMode,
  toggleTheme
}: {
  institutionName: string;
  adminAuth: { email: string; pass: string } | null;
  facultyList: Faculty[];
  studentList: Student[];
  onLogin: (session: AuthSession) => void;
  darkMode: boolean;
  toggleTheme: () => void;
}) {
  const [role, setRole] = useState<Role>('FACULTY');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanId = identifier.trim().toLowerCase();

    if (role === 'ADMIN') {
      if (adminAuth && cleanId === adminAuth.email.toLowerCase() && password === adminAuth.pass) {
        onLogin({
          role: 'ADMIN',
          userId: 'master_admin',
          name: 'Master Administrator',
          identifier: adminAuth.email
        });
        return;
      }
      setError('Invalid admin credentials.');
      return;
    }

    if (role === 'FACULTY') {
      const match = facultyList.find(
        (f) => f.facultyId.toLowerCase() === cleanId || f.email.toLowerCase() === cleanId
      );
      if (match) {
        onLogin({
          role: 'FACULTY',
          userId: match.id,
          name: match.name,
          identifier: match.facultyId
        });
        return;
      }
      setError('Faculty not found with this ID or Email. Ask Master Admin to onboard you.');
      return;
    }

    if (role === 'STUDENT') {
      const match = studentList.find(
        (s) => s.usn.toLowerCase() === cleanId || s.email.toLowerCase() === cleanId
      );
      if (match) {
        onLogin({
          role: 'STUDENT',
          userId: match.id,
          name: match.name,
          identifier: match.usn
        });
        return;
      }
      setError('Student USN not registered. Check with your department admin.');
      return;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#121214] flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-stone-500 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-[#1C1C1E] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#2F5D62] text-white flex items-center justify-center font-serif font-bold text-2xl mx-auto mb-3">
            P
          </div>
          <h2 className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
            Presence
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{institutionName}</p>
        </div>

        {/* Role Switcher */}
        <div className="flex bg-stone-100 dark:bg-stone-900 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setRole('FACULTY');
              setError('');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              role === 'FACULTY'
                ? 'bg-white dark:bg-[#1C1C1E] text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            Faculty
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('STUDENT');
              setError('');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              role === 'STUDENT'
                ? 'bg-white dark:bg-[#1C1C1E] text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('ADMIN');
              setError('');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              role === 'ADMIN'
                ? 'bg-white dark:bg-[#1C1C1E] text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            Master Admin
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              {role === 'ADMIN'
                ? 'Master Admin Email'
                : role === 'FACULTY'
                ? 'Faculty ID or Email'
                : 'University USN / Roll No'}
            </label>
            <input
              type="text"
              required
              placeholder={
                role === 'ADMIN'
                  ? 'admin@college.edu'
                  : role === 'FACULTY'
                  ? 'FAC-101 or prof@college.edu'
                  : 'e.g. 4NM21IS001'
              }
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-[#2F5D62]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required={role === 'ADMIN'}
              placeholder={role === 'ADMIN' ? '••••••••' : 'Default: your institutional pass'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-[#2F5D62]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-[#2F5D62] hover:bg-[#254a4e] text-white font-medium text-sm transition-colors mt-2 cursor-pointer"
          >
            Sign In as {role === 'ADMIN' ? 'Admin' : role === 'FACULTY' ? 'Lecturer' : 'Student'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 3. FACULTY: RAPID ATTENDANCE MARKING
// ==========================================

function FacultyMarkingView({
  faculty,
  courses,
  students,
  onSaveSession
}: {
  faculty: Faculty;
  courses: Course[];
  students: Student[];
  onSaveSession: (session: Session, records: AttendanceRecord[]) => void;
}) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [sessionDate, setSessionDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [hoursWeight, setHoursWeight] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [topic, setTopic] = useState<string>('');

  const currentCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) || courses[0],
    [courses, selectedCourseId]
  );

  // Eligible students for the course's department & semester
  const courseStudents = useMemo(() => {
    if (!currentCourse) return [];
    return students.filter(
      (s) => s.deptCode === currentCourse.deptCode && s.semester === currentCourse.semester
    );
  }, [students, currentCourse]);

  // Attendance state for current session: { [studentId]: 'P' | 'A' }
  const [statusMap, setStatusMap] = useState<Record<string, 'P' | 'A'>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [savedSuccessNotice, setSavedSuccessNotice] = useState<boolean>(false);

  // Default everyone to 'P' on course or student changes
  useEffect(() => {
    const defaults: Record<string, 'P' | 'A'> = {};
    courseStudents.forEach((st) => {
      defaults[st.id] = 'P';
    });
    setStatusMap(defaults);
    setHasUnsavedChanges(false);
  }, [courseStudents]);

  const toggleStudent = (studentId: string) => {
    setStatusMap((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === 'P' ? 'A' : 'P'
    }));
    setHasUnsavedChanges(true);
  };

  const markAllPresent = () => {
    const nextMap: Record<string, 'P' | 'A'> = {};
    courseStudents.forEach((st) => {
      nextMap[st.id] = 'P';
    });
    setStatusMap(nextMap);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    if (!currentCourse) return;
    if (courseStudents.length === 0) {
      alert('No enrolled students in this course to mark attendance.');
      return;
    }

    const sessionId = 'ses_' + Date.now();
    const newSession: Session = {
      id: sessionId,
      courseId: currentCourse.id,
      date: sessionDate,
      hours: hoursWeight,
      topic: topic.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    const newRecords: AttendanceRecord[] = courseStudents.map((st) => ({
      id: 'att_' + Math.random().toString(36).substring(2, 9),
      sessionId,
      studentId: st.id,
      status: statusMap[st.id] || 'P',
      updatedAt: new Date().toISOString()
    }));

    onSaveSession(newSession, newRecords);
    setHasUnsavedChanges(false);
    setSavedSuccessNotice(true);
    setTimeout(() => setSavedSuccessNotice(false), 3000);
  };

  const presentCount = Object.values(statusMap).filter((v) => v === 'P').length;
  const absentCount = courseStudents.length - presentCount;

  if (courses.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1C1C1E] border border-stone-200 dark:border-stone-800 rounded-xl p-8 text-center">
        <p className="text-stone-500">No courses assigned to your faculty profile yet.</p>
        <p className="text-xs text-stone-400 mt-1">Contact your Master Admin to allot courses.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Session Header Selector */}
      <div className="bg-white dark:bg-[#1C1C1E] border border-stone-200 dark:border-stone-800 rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
                Select Course
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-medium focus:ring-1 focus:ring-[#2F5D62]"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} – {c.name} (Sem {c.semester})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
                Session Date
              </label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-[#2F5D62]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
                Session Weight
              </label>
              <div className="flex rounded-lg border border-stone-300 dark:border-stone-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setHoursWeight(1)}
                  className={`flex-1 py-2 text-xs font-semibold cursor-pointer ${
                    hoursWeight === 1
                      ? 'bg-[#2F5D62] text-white'
                      : 'bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  1 Hr (Theory)
                </button>
                <button
                  type="button"
                  onClick={() => setHoursWeight(2)}
                  className={`flex-1 py-2 text-xs font-semibold cursor-pointer ${
                    hoursWeight === 2
                      ? 'bg-[#2F5D62] text-white'
                      : 'bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  2 Hrs (Lab)
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t lg:border-t-0 pt-3 lg:pt-0 border-stone-200 dark:border-stone-800">
            <button
              onClick={markAllPresent}
              className="px-3 py-2 rounded-lg text-xs font-medium border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Mark All Present
            </button>

            <div className="flex bg-stone-100 dark:bg-stone-800 p-0.5 rounded-lg border border-stone-200 dark:border-stone-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white dark:bg-[#1C1C1E] shadow-xs' : 'text-stone-400'
                }`}
                title="Roll Number Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md cursor-pointer ${
                  viewMode === 'list' ? 'bg-white dark:bg-[#1C1C1E] shadow-xs' : 'text-stone-400'
                }`}
                title="Student List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800/80">
          <input
            type="text"
            placeholder="Lecture topic / remarks (optional, e.g. Dijkstra's Algorithm)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 text-stone-800 dark:text-stone-200 focus:outline-none"
          />
        </div>
      </div>

      {/* Roster Area */}
      {courseStudents.length === 0 ? (
        <div className="bg-white dark:bg-[#1C1C1E] border border-stone-200 dark:border-stone-800 rounded-xl p-8 text-center">
          <p className="text-stone-500">
            No students found enrolled in Semester {currentCourse.semester} ({currentCourse.deptCode}).
          </p>
          <p className="text-xs text-stone-400 mt-1">
            Ensure students are enrolled via the Admin Batch portal.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Roll Number Fast Tap Grid */
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {courseStudents.map((st) => {
            const isPresent = statusMap[st.id] === 'P';
            const shortRoll = st.usn.length > 4 ? st.usn.slice(-3) : st.usn;

            return (
              <button
                key={st.id}
                type="button"
                onClick={() => toggleStudent(st.id)}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isPresent
                    ? 'bg-[#6E8B74]/15 border-[#6E8B74]/30 hover:bg-[#6E8B74]/25 text-[#2c4732] dark:text-[#90b097]'
                    : 'bg-[#B86B61]/20 border-[#B86B61]/40 hover:bg-[#B86B61]/30 text-[#853930] dark:text-[#e4988f]'
                }`}
              >
                <span className="font-mono text-base font-bold">{shortRoll}</span>
                <span className="text-[10px] truncate max-w-full font-medium opacity-90">
                  {st.name.split(' ')[0]}
                </span>
                <span
                  className={`mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                    isPresent
                      ? 'bg-[#6E8B74]/20 text-[#2c4732] dark:text-[#a5c2ac]'
                      : 'bg-[#B86B61]/30 text-[#853930] dark:text-[#ffaba0]'
                  }`}
                >
                  {isPresent ? 'Present' : 'Absent'}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        /* Detailed List View */
        <div className="bg-white dark:bg-[#1C1C1E] border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden shadow-sm">
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {courseStudents.map((st) => {
              const isPresent = statusMap[st.id] === 'P';
              return (
                <div
                  key={st.id}
                  className="px-4 py-3 flex items-center justify-between hover:bg-stone-50/50 dark:hover:bg-stone-900/40 transition-colors"
                >
                  <div>
                    <span className="font-mono text-xs font-semibold text-stone-800 dark:text-stone-200 mr-2">
                      {st.usn}
                    </span>
                    <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
                      {st.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleStudent(st.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isPresent
                          ? 'bg-[#6E8B74] text-white shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                      }`}
                    >
                      P
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleStudent(st.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        !isPresent
                          ? 'bg-[#B86B61] text-white shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                      }`}
                    >
                      A
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Sticky Save Changes Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-2xl bg-white dark:bg-[#1C1C1E] border border-stone-200 dark:border-stone-800 rounded-2xl p-3 px-5 shadow-lg flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6E8B74]"></span>
            <span className="font-bold text-stone-800 dark:text-stone-200">{presentCount}</span>
            <span className="text-stone-500">Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B86B61]"></span>
            <span className="font-bold text-stone-800 dark:text-stone-200">{absentCount}</span>
            <span className="text-stone-500">Absent</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccessNotice && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved to Register!
            </span>
          )}

          <button
            type="button"
            onClick={handleSave}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-[#2F5D62] hover:bg-[#254a4e] shadow-md ring-2 ring-[#2F5D62]/40'
                : 'bg-stone-700 hover:bg-stone-800'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. IN-APP ATTENDANCE REGISTER & CSV EXPORT
// ==========================================

export function AttendanceRegisterView({
  courses,
  students,
  sessions,
  attendanceRecords,
  threshold
}: {
  courses: Course[];
  students: Student[];
  sessions: Session[];
  attendanceRecords: AttendanceRecord[];
  threshold: number;
}) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterShortageOnly, setFilterShortageOnly] = useState(false);

  const currentCourse = useMemo(() => {
    return courses.find((c) => c.id === selectedCourseId) || courses[0];
  }, [courses, selectedCourseId]);

  // Chronologically sorted sessions
  const courseSessions = useMemo(() => {
    if (!currentCourse) return [];
    return sessions
      .filter((s) => s.courseId === currentCourse.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sessions, currentCourse]);

  // Students belonging to this course
  const courseStudents = useMemo(() => {
    if (!currentCourse) return [];
    return students.filter(
      (s) => s.deptCode === currentCourse.deptCode && s.semester === currentCourse.semester
    );
  }, [students, currentCourse]);

  // Matrix construction
  const matrixData = useMemo(() => {
    return courseStudents.map((student) => {
      let attendedCount = 0;
      let totalConductedHours = 0;
      const sessionStatuses: Record<string, string> = {};

      courseSessions.forEach((session) => {
        const record = attendanceRecords.find(
          (r) => r.sessionId === session.id && r.studentId === student.id
        );
        const status = record ? record.status : 'A';
        sessionStatuses[session.id] = status;

        const weight = session.hours || 1;
        totalConductedHours += weight;
        if (status === 'P' || status === 'OD') {
          attendedCount += weight;
        }
      });

      const percentage =
        totalConductedHours > 0 ? Math.round((attendedCount / totalConductedHours) * 100) : 100;

      return {
        ...student,
        sessionStatuses,
        attendedCount,
        totalHeld: totalConductedHours,
        percentage,
        isShortage: percentage < threshold
      };
    });
  }, [courseStudents, courseSessions, attendanceRecords, threshold]);

  const filteredData = matrixData.filter((row) => {
    const matchesSearch =
      row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.usn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesShortage = filterShortageOnly ? row.isShortage : true;
    return matchesSearch && matchesShortage;
  });

  // Official College CSV Exporter
  const handleExportCSV = () => {
    if (!currentCourse) return;

    const sessionHeaders = courseSessions.map((s, idx) => {
      const d = new Date(s.date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit'
      });
      return `"Class ${idx + 1} (${d} - ${s.hours}hr)"`;
    });

    const headers = [
      '"USN"',
      '"Student Name"',
      ...sessionHeaders,
      '"Attended Hours"',
      '"Conducted Hours"',
      '"Percentage %"',
      '"Status"'
    ];

    const rows = (filterShortageOnly ? filteredData : matrixData).map((row) => {
      const marks = courseSessions.map((s) => `"${row.sessionStatuses[s.id] || 'A'}"`);
      const statusLabel = row.percentage >= threshold ? '"Eligible"' : `"${row.percentage}% Shortage"`;

      return [
        `"${row.usn}"`,
        `"${row.name.replace(/"/g, '""')}"`,
        ...marks,
        row.attendedCount,
        row.totalHeld,
        `"${row.percentage}%"`,
        statusLabel
      ].join(',');
    });

    const metadata = [
      `"Course: ${currentCourse.code} - ${currentCourse.name.replace(/"/g, '""')}"`,
      `"Conducted Sessions: ${courseSessions.length}"`,
      `"Required Threshold: ${threshold}%"`,
      `"Exported Date: ${new Date().toLocaleDateString('en-GB')}"`,
      ''
    ];

    const csvContent = [...metadata, headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentCourse.code}_Attendance_Register_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!currentCourse) {
    return (
      <div className="bg-white dark:bg-[#1C1C1E] border border-stone-200 dark:border-stone-800 rounded-xl p-8 text-center text-stone-500">
        No courses available to render registers.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Control Strip */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-[#1C1C1E] p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Course:
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-medium"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} – {c.name}
              </option>
            ))}
          </select>

          <span className="text-xs text-stone-500 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-md font-mono">
            {courseSessions.length} sessions held
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 sm:w-52">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search USN/Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Shortage filter */}
          <button
            type="button"
            onClick={() => setFilterShortageOnly(!filterShortageOnly)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
              filterShortageOnly
                ? 'bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200'
                : 'border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Shortage (&lt;{threshold}%)
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#2F5D62] hover:bg-[#254a4e] text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download CSV
          </button>
        </div>
      </div>

      {/* Spreadsheet Matrix Table */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-20">
              <tr className="bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400">
                <th className="py-3 px-4 sticky left-0 z-30 bg-stone-50 dark:bg-[#1a1a1c] min-w-[120px] border-r border-stone-200 dark:border-stone-800">
                  USN
                </th>
                <th className="py-3 px-4 sticky left-[120px] z-30 bg-stone-50 dark:bg-[#1a1a1c] min-w-[160px] border-r border-stone-200 dark:border-stone-800">
                  Student Name
                </th>

                {courseSessions.length === 0 ? (
                  <th className="py-3 px-4 text-center text-stone-400 font-normal">
                    No classes conducted yet
                  </th>
                ) : (
                  courseSessions.map((session, idx) => (
                    <th
                      key={session.id}
                      className="py-2 px-2 text-center min-w-[65px] border-r border-stone-100 dark:border-stone-800/60"
                    >
                      <div className="font-semibold text-stone-800 dark:text-stone-200">
                        {new Date(session.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit'
                        })}
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono">
                        #{idx + 1} ({session.hours}h)
                      </div>
                    </th>
                  ))
                )}

                <th className="py-3 px-3 text-center bg-stone-100/80 dark:bg-stone-800/80 min-w-[70px]">
                  Attended
                </th>
                <th className="py-3 px-3 text-center bg-stone-100/80 dark:bg-stone-800/80 min-w-[70px]">
                  Held
                </th>
                <th className="py-3 px-4 text-center bg-stone-100/80 dark:bg-stone-800/80 min-w-[85px] font-bold">
                  %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={courseSessions.length + 5} className="py-12 text-center text-stone-400">
                    No records found matching query.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-stone-50/70 dark:hover:bg-stone-900/40 transition-colors"
                  >
                    <td className="py-2.5 px-4 font-mono font-semibold text-stone-800 dark:text-stone-200 sticky left-0 bg-white dark:bg-[#1C1C1E] border-r border-stone-200 dark:border-stone-800 z-10">
                      {row.usn}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-stone-900 dark:text-stone-100 sticky left-[120px] bg-white dark:bg-[#1C1C1E] border-r border-stone-200 dark:border-stone-800 z-10 truncate max-w-[160px]">
                      {row.name}
                    </td>

                    {courseSessions.length === 0 ? (
                      <td className="py-2 px-4 text-center text-stone-400">—</td>
                    ) : (
                      courseSessions.map((session) => {
                        const status = row.sessionStatuses[session.id] || 'A';
                        const isPresent = status === 'P' || status === 'OD';
                        return (
                          <td
                            key={session.id}
                            className="py-1.5 px-1.5 text-center border-r border-stone-100 dark:border-stone-800/60"
                          >
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded text-[11px] font-bold ${
                                isPresent
                                  ? 'bg-[#6E8B74]/20 text-[#2f4935] dark:bg-[#6E8B74]/30 dark:text-[#a0c4a8]'
                                  : 'bg-[#B86B61]/20 text-[#853930] dark:bg-[#B86B61]/30 dark:text-[#ffaba0]'
                              }`}
                            >
                              {status}
                            </span>
                          </td>
                        );
                      })
                    )}

                    <td className="py-2.5 px-3 text-center font-semibold bg-stone-50/50 dark:bg-stone-900/30">
                      {row.attendedCount}
                    </td>
                    <td className="py-2.5 px-3 text-center text-stone-500 bg-stone-50/50 dark:bg-stone-900/30">
                      {row.totalHeld}
                    </td>
                    <td className="py-2.5 px-4 text-center bg-stone-50/50 dark:bg-stone-900/30">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          row.percentage >= threshold
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 ring-1 ring-rose-300 dark:ring-rose-800'
                        }`}
                      >
                        {row.percentage}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. STUDENT DASHBOARD (WITH BUNK BUFFER)
// ==========================================

function StudentDashboard({
  student,
  courses,
  sessions,
  attendance,
  threshold
}: {
  student: Student;
  courses: Course[];
  sessions: Session[];
  attendance: AttendanceRecord[];
  threshold: number;
}) {
  const subjectAnalytics = useMemo(() => {
    return courses.map((course) => {
      const courseSessions = sessions.filter((s) => s.courseId === course.id);
      let attendedHours = 0;
      let totalConductedHours = 0;

      courseSessions.forEach((ses) => {
        const weight = ses.hours || 1;
        totalConductedHours += weight;
        const record = attendance.find(
          (a) => a.sessionId === ses.id && a.studentId === student.id
        );
        if (record && (record.status === 'P' || record.status === 'OD')) {
          attendedHours += weight;
        }
      });

      const percentage =
        totalConductedHours > 0 ? Math.round((attendedHours / totalConductedHours) * 100) : 100;

      let bunkBuffer = 0;
      let recoveryTarget = 0;

      if (totalConductedHours > 0) {
        if (percentage >= threshold) {
          bunkBuffer = Math.floor(
            (attendedHours - (threshold / 100) * totalConductedHours) / (threshold / 100)
          );
        } else {
          recoveryTarget = Math.ceil(
            ((threshold / 100) * totalConductedHours - attendedHours) / (1 - threshold / 100)
          );
        }
      }

      return {
        course,
        attendedHours,
        totalConductedHours,
        percentage,
        bunkBuffer: Math.max(0, bunkBuffer),
        recoveryTarget: Math.max(0, recoveryTarget),
        isShortage: percentage < threshold
      };
    });
  }, [courses, sessions, attendance, student, threshold]);

  const overallHeld = subjectAnalytics.reduce((acc, s) => acc + s.totalConductedHours, 0);
  const overallAttended = subjectAnalytics.reduce((acc, s) => acc + s.attendedHours, 0);
  const overallPct = overallHeld > 0 ? Math.round((overallAttended / overallHeld) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Student Profile Header */}
      <div className="bg-white dark:bg-[#1C1C1E] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
            {student.usn}
          </span>
          <h2 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100 mt-1">
            {student.name}
          </h2>
          <p className="text-xs text-stone-500">
            Semester {student.semester} • {student.deptCode}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-stone-50 dark:bg-stone-900 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800">
          <div>
            <div className="text-[10px] uppercase font-semibold text-stone-400">Total Attendance</div>
            <div className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100">
              {overallPct}%
            </div>
          </div>
          <div className="text-xs text-stone-500 pl-3 border-l border-stone-200 dark:border-stone-700">
            <div>
              Attended: <strong className="text-stone-800 dark:text-stone-200">{overallAttended}</strong>
            </div>
            <div>
              Conducted: <strong className="text-stone-800 dark:text-stone-200">{overallHeld}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Cards with Bunk Buffer Engine */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjectAnalytics.map(
          ({
            course,
            attendedHours,
            totalConductedHours,
            percentage,
            bunkBuffer,
            recoveryTarget,
            isShortage
          }) => (
            <div
              key={course.id}
              className="bg-white dark:bg-[#1C1C1E] border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-semibold text-stone-400">
                    {course.code}
                  </span>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    {course.name}
                  </h3>
                </div>
                <div
                  className={`text-lg font-serif font-bold px-2.5 py-1 rounded-lg ${
                    percentage >= threshold
                      ? 'bg-[#6E8B74]/15 text-[#3b5942] dark:text-[#a0c5a8]'
                      : 'bg-[#B86B61]/15 text-[#853930] dark:text-[#ffaba0]'
                  }`}
                >
                  {percentage}%
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    percentage >= threshold ? 'bg-[#6E8B74]' : 'bg-[#B86B61]'
                  }`}
                  style={{ width: `${Math.min(100, percentage)}%` }}
                ></div>
              </div>

              {/* Statistics & Bunk Buffer */}
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                <span className="text-stone-500">
                  {attendedHours} / {totalConductedHours} Hours
                </span>

                {isShortage ? (
                  <span className="font-semibold text-[#853930] dark:text-[#ffaba0] flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Attend next {recoveryTarget} classes to reach {threshold}%
                  </span>
                ) : (
                  <span className="font-medium text-[#3b5942] dark:text-[#a0c5a8]">
                    Can safely miss <strong>{bunkBuffer}</strong> more classes
                  </span>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ==========================================
// 6. LEAVE & ON-DUTY (OD) WORKFLOW
// ==========================================

function FacultyLeaveApproval({
  leaves,
  students,
  courses,
  onUpdateLeave
}: {
  leaves: LeaveRequest[];
  students: Student[];
  courses: Course[];
  onUpdateLeave: (id: string, status: 'APPROVED' | 'REJECTED') => void;
}) {
  const pendingLeaves = leaves.filter((l) => l.status === 'PENDING');

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <h2 className="text-lg font-bold font-serif text-stone-900 dark:text-stone-100">
        On-Duty & Medical Leave Requests
      </h2>

      {pendingLeaves.length === 0 ? (
        <div className="bg-white dark:bg-[#1C1C1E] border border-stone-200 dark:border-stone-800 rounded-xl p-8 text-center text-stone-500 text-xs">
          No pending leave requests in your approval queue.
        </div>
      ) : (
        <div className="space-y-3">
          {pendingLeaves.map((req) => {
            const st = students.find((s) => s.id === req.studentId);
            const cr = courses.find((c) => c.id === req.courseId);

            return (
              <div
                key={req.id}
                className="bg-white dark:bg-[#1C1C1E] border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800">
                      {st?.usn || 'USN'}
                    </span>
                    <span className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                      {st?.name}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                      {req.type}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    Subject: <strong>{cr?.name || 'All Subjects'}</strong> • Date:{' '}
                    <strong>{req.date}</strong>
                  </p>
                  <p className="text-xs text-stone-700 dark:text-stone-300 mt-2 bg-stone-50 dark:bg-stone-900 p-2 rounded border border-stone-100 dark:border-stone-800">
                    "{req.reason}"
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateLeave(req.id, 'APPROVED')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#6E8B74] hover:bg-[#5b7360] text-white transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve (OD)
                  </button>
                  <button
                    onClick={() => onUpdateLeave(req.id, 'REJECTED')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#B86B61] hover:bg-[#99574f] text-white transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StudentLeaveSubmission({
  student,
  courses,
  leaves,
  onSubmitLeave
}: {
  student: Student;
  courses: Course[];
  leaves: LeaveRequest[];
  onSubmitLeave: (req: LeaveRequest) => void;
}) {
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<'OD' | 'MEDICAL'>('OD');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please state a valid reason.');
      return;
    }

    const newReq: LeaveRequest = {
      id: 'leave_' + Date.now(),
      studentId: student.id,
      courseId,
      date,
      reason: reason.trim(),
      type,
      status: 'PENDING'
    };

    onSubmitLeave(newReq);
    setReason('');
    alert('Leave request submitted to your faculty.');
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-white dark:bg-[#1C1C1E] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold font-serif text-stone-900 dark:text-stone-100 mb-4">
          Apply for On-Duty (OD) or Medical Leave
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              Select Course
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} – {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Date of Absence
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Category
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100"
              >
                <option value="OD">On-Duty (Fest / Hackathon / Sports)</option>
                <option value="MEDICAL">Medical Leave</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              Reason / Justification
            </label>
            <textarea
              required
              rows={3}
              placeholder="State purpose or event details..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-[#2F5D62] hover:bg-[#254a4e] text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Submit Application
          </button>
        </form>
      </div>

      {/* History */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Previous Applications
        </h3>
        {leaves.length === 0 ? (
          <p className="text-xs text-stone-400">No previous applications found.</p>
        ) : (
          leaves.map((l) => (
            <div
              key={l.id}
              className="bg-white dark:bg-[#1C1C1E] border border-stone-200 dark:border-stone-800 p-3 rounded-xl flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-semibold text-stone-800 dark:text-stone-200 mr-2">
                  {l.date}
                </span>
                <span className="text-stone-500">"{l.reason}"</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                  l.status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : l.status === 'REJECTED'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                {l.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ==========================================
// 7. MASTER ADMIN DASHBOARD & MANAGERS
// ==========================================

function AdminDashboard({
  config,
  departments,
  studentsCount,
  facultyCount,
  coursesCount,
  sessionsCount,
  onUpdateThreshold
}: {
  config: SystemConfig;
  departments: Department[];
  studentsCount: number;
  facultyCount: number;
  coursesCount: number;
  sessionsCount: number;
  onUpdateThreshold: (val: number) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Enrolled Students" value={studentsCount} icon={Users} />
        <StatCard label="Faculty Members" value={facultyCount} icon={Briefcase} />
        <StatCard label="Active Courses" value={coursesCount} icon={BookOpen} />
        <StatCard label="Classes Conducted" value={sessionsCount} icon={CheckSquare} />
      </div>

      <div className="bg-white dark:bg-[#1C1C1E] border border-stone-200 dark:border-stone-800 rounded-xl p-6 shadow-sm max-w-lg">
        <h3 className="text-sm font-bold font-serif text-stone-900 dark:text-stone-100 mb-2">
          Academic Attendance Threshold
        </h3>
        <p className="text-xs text-stone-500 mb-4">
          Students dropping below this percentage will be marked with shortage and detention alerts.
        </p>

        <div className="flex items-center gap-3">
          <input
            type="number"
            min={50}
            max={90}
            value={config.attendanceThreshold}
            onChange={(e) => onUpdateThreshold(Number(e.target.value))}
            className="w-24 px-3 py-1.5 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-bold"
          />
          <span className="text-xs text-stone-600 dark:text-stone-400 font-semibold">% minimum</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="bg-white dark:bg-[#1C1C1E] border border-stone-200 dark:border-stone-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between text-stone-400 mb-2">
        <span className="text-xs font-semibold">{label}</span>
        <Icon className="w-4 h-4 text-[#2F5D62]" />
      </div>
      <div className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">{value}</div>
    </div>
  );
}

function AdminStudentManager({
  departments,
  students,
  onAddStudent,
  onBulkAdd,
  onDeleteStudent
}: {
  departments: Department[];
  students: Student[];
  onAddStudent: (st: Student) => void;
  onBulkAdd: (sts: Student[]) => void;
  onDeleteStudent: (id: string) => void;
}) {
  const [usn, setUsn] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [deptCode, setDeptCode] = useState(departments[0]?.code || 'ISE');
  const [semester, setSemester] = useState(5);

  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);

  const handleSingleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usn.trim() || !name.trim()) return;

    onAddStudent({
      id: 'st_' + Date.now(),
      usn: usn.trim().toUpperCase(),
      name: name.trim(),
      email: email.trim().toLowerCase() || `${usn.toLowerCase()}@college.edu`,
      deptCode,
      semester
    });

    setUsn('');
    setName('');
    setEmail('');
  };

  const handleBulkSubmit = () => {
    const lines = bulkText.split('\n').filter((l) => l.trim().length > 0);
    const parsed: Student[] = [];

    lines.forEach((line) => {
      const parts = line.split(',').map((p) => p.trim());
      if (parts[0] && parts[1]) {
        parsed.push({
          id: 'st_' + Math.random().toString(36).substring(2, 9),
          usn: parts[0].toUpperCase(),
          name: parts[1],
          email: parts[2] || `${parts[0].toLowerCase()}@college.edu`,
          deptCode,
          semester
        });
      }
    });

    if (parsed.length > 0) {
      onBulkAdd(parsed);
      setBulkText('');
      setShowBulk(false);
      alert(`Enrolled ${parsed.length} students into ${deptCode} Sem ${semester}!`);
    } else {
      alert('Could not parse lines. Use format: USN, Student Name');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1C1C1E] border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold font-serif text-stone-900 dark:text-stone-100">
            Enroll Students
          </h3>
          <button
            type="button"
            onClick={() => setShowBulk(!showBulk)}
            className="text-xs font-semibold text-[#2F5D62] hover:underline cursor-pointer"
          >
            {showBulk ? 'Switch to Single Entry' : '+ Bulk Batch Import (CSV lines)'}
          </button>
        </div>

        {showBulk ? (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              <div>
                <label className="block font-semibold mb-1">Target Department</label>
                <select
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.code}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Semester</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
                />
              </div>
            </div>

            <textarea
              rows={4}
              placeholder="Paste line by line:&#10;4NM21IS001, Aarav Sharma&#10;4NM21IS002, Bhavana Rao"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100"
            />
            <button
              onClick={handleBulkSubmit}
              className="px-4 py-2 rounded-lg bg-[#2F5D62] hover:bg-[#254a4e] text-white font-medium cursor-pointer"
            >
              Parse & Enroll Batch
            </button>
          </div>
        ) : (
          <form onSubmit={handleSingleAdd} className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <input
                type="text"
                required
                placeholder="USN (e.g. 4NM21IS001)"
                value={usn}
                onChange={(e) => setUsn(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 uppercase font-mono"
              />
            </div>
            <div>
              <input
                type="text"
                required
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
              />
            </div>
            <div>
              <select
                value={deptCode}
                onChange={(e) => setDeptCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.code}>
                    {d.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <input
                type="number"
                min={1}
                max={8}
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-[#2F5D62] hover:bg-[#254a4e] text-white font-semibold transition-colors cursor-pointer"
              >
                + Add Student
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Roster Table */}
      <div className="bg-white dark:bg-[#1C1C1E] border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center text-xs">
          <span className="font-semibold text-stone-500">
            Total Enrolled: {students.length} students
          </span>
        </div>
        <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
          {students.map((st) => (
            <div key={st.id} className="p-3 px-4 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold mr-3">{st.usn}</span>
                <span className="font-medium mr-2">{st.name}</span>
                <span className="text-stone-400">
                  ({st.deptCode} • Sem {st.semester})
                </span>
              </div>
              <button
                onClick={() => onDeleteStudent(st.id)}
                className="text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminFacultyManager({
  departments,
  faculty,
  onAddFaculty,
  onDeleteFaculty
}: {
  departments: Department[];
  faculty: Faculty[];
  onAddFaculty: (f: Faculty) => void;
  onDeleteFaculty: (id: string) => void;
}) {
  const [fid, setFid] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [deptCode, setDeptCode] = useState(departments[0]?.code || 'ISE');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fid.trim() || !name.trim()) return;

    onAddFaculty({
      id: 'fac_' + Date.now(),
      facultyId: fid.trim().toUpperCase(),
      name: name.trim(),
      email: email.trim().toLowerCase() || `${fid.toLowerCase()}@college.edu`,
      deptCode
    });

    setFid('');
    setName('');
    setEmail('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1C1C1E] border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold font-serif text-stone-900 dark:text-stone-100 mb-4">
          Onboard Faculty Member
        </h3>

        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          <input
            type="text"
            required
            placeholder="Faculty ID (e.g. FAC-101)"
            value={fid}
            onChange={(e) => setFid(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 uppercase font-mono"
          />
          <input
            type="text"
            required
            placeholder="Prof. Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
          />
          <input
            type="email"
            placeholder="Institutional Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
          />
          <select
            value={deptCode}
            onChange={(e) => setDeptCode(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
          >
            {departments.map((d) => (
              <option key={d.id} value={d.code}>
                {d.code}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-[#2F5D62] hover:bg-[#254a4e] text-white font-semibold transition-colors cursor-pointer"
          >
            + Onboard Faculty
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-[#1C1C1E] border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden shadow-sm">
        <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
          {faculty.map((f) => (
            <div key={f.id} className="p-3 px-4 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold mr-3">{f.facultyId}</span>
                <span className="font-medium mr-2">{f.name}</span>
                <span className="text-stone-400">
                  ({f.deptCode} • {f.email})
                </span>
              </div>
              <button
                onClick={() => onDeleteFaculty(f.id)}
                className="text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminCourseManager({
  departments,
  faculty,
  courses,
  onAddCourse,
  onDeleteCourse
}: {
  departments: Department[];
  faculty: Faculty[];
  courses: Course[];
  onAddCourse: (c: Course) => void;
  onDeleteCourse: (id: string) => void;
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [deptCode, setDeptCode] = useState(departments[0]?.code || 'ISE');
  const [semester, setSemester] = useState(5);
  const [facultyId, setFacultyId] = useState(faculty[0]?.id || '');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    onAddCourse({
      id: 'crs_' + Date.now(),
      code: code.trim().toUpperCase(),
      name: name.trim(),
      deptCode,
      semester,
      facultyId: facultyId || (faculty[0] ? faculty[0].id : '')
    });

    setCode('');
    setName('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1C1C1E] border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold font-serif text-stone-900 dark:text-stone-100 mb-4">
          Register & Allot Course
        </h3>

        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          <input
            type="text"
            required
            placeholder="Course Code (e.g. 21CS51)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 uppercase font-mono"
          />
          <input
            type="text"
            required
            placeholder="Course Title"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
          />
          <select
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Sem {s}
              </option>
            ))}
          </select>
          <select
            value={facultyId}
            onChange={(e) => setFacultyId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900"
          >
            {faculty.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.facultyId})
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-[#2F5D62] hover:bg-[#254a4e] text-white font-semibold transition-colors cursor-pointer"
          >
            + Allot Course
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-[#1C1C1E] border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden shadow-sm">
        <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
          {courses.map((c) => {
            const fac = faculty.find((f) => f.id === c.facultyId);
            return (
              <div key={c.id} className="p-3 px-4 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold mr-3">{c.code}</span>
                  <span className="font-medium mr-2">{c.name}</span>
                  <span className="text-stone-400">
                    ({c.deptCode} • Sem {c.semester} • Allotted to: {fac?.name || 'Unassigned'})
                  </span>
                </div>
                <button
                  onClick={() => onDeleteCourse(c.id)}
                  className="text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}