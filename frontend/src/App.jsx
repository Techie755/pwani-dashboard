import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API = "http://127.0.0.1:5000/api";

const PWANI_DEPARTMENTS = [
  { id: 1, name: "School of Pure and Applied Sciences" },
  { id: 2, name: "School of Education" },
  { id: 3, name: "School of Humanities and Social Sciences" },
  { id: 4, name: "School of Agriculture and Environmental Sciences" },
];

const PWANI_PROGRAMS_BY_SCHOOL = {
  "School of Pure and Applied Sciences": [
    "Bachelor of Science",
    "Bachelor of Science (Biochemistry)",
    "Bachelor of Science (Industrial Chemistry)",
    "Bachelor of Science (Biotechnology)",
    "Bachelor of Science (Marine)",
    "Bachelor of Science (Nursing)",
    "Bachelor of Science (Nursing Upgrading)",
    "Bachelor of Science (Computer Science)",
    "Bachelor of Science (Microbiology)",
    "Bachelor of Science (Chemistry)",
    "Bachelor of Science (Physics, Mathematics, Statistics)",
    "Bachelor of Science (Environmental Health)",
    "Diploma in Applied Biology",
    "Diploma in Computer Science",
    "Masters in Chemistry",
    "Masters of Science (Applied Entomology)",
    "Masters of Science (Physics)",
    "Masters of Science (Fisheries)",
    "Masters of Science (Microbiology)",
    "Masters of Health",
    "PhD - Statistics",
    "PhD - Chemistry",
    "PhD - Medical Entomology",
  ],
  "School of Education": [
    "Bachelor of Education (Arts)",
    "Bachelor of Education (Science)",
    "Bachelor of Education (Early Childhood Education)",
    "Bachelor of Science (Agri. Educ. and Extension)",
    "Bachelor of Education (Special Needs)",
    "Bachelor of Education Arts (French)",
    "Bachelor of Education Science (Agriculture)",
    "Bachelor of Education Science (Computer)",
    "Diploma in Early Childhood Development",
    "Diploma Primary Education",
    "Diploma in Agri. Educ and Extension",
    "Diploma in Guidance & Counseling",
    "Certificate in Early Childhood Development",
    "Postgraduate Diploma in Education",
    "Masters of Education",
    "Masters of Education (Curriculum Development)",
    "Masters of Education (Psychology)",
    "Masters of Education (Special Needs)",
    "Masters in Management In Education",
    "Masters in AGED",
    "Masters of Education Planning",
    "Masters in Education (Science and Maths methods)",
    "PhD - Educational Psychology",
    "PhD - Education Administration",
    "PhD - Educational Planning",
    "PhD - History Of Education",
    "PhD - Sociology Of Education",
    "PhD - Communication Technology and French",
  ],
  "School of Humanities and Social Sciences": [
    "Bachelor of Commerce",
    "Bachelor of Arts (General)",
    "Bachelor of Science (Hospitality and Tourism Mgt)",
    "Bachelor of Science (Food, Nutrition & Dietetics)",
    "Bachelor of Science (Tourism Management)",
    "Diploma in Hospitality and Tourism Mgt",
    "Diploma in Nutrition & Health",
    "Diploma in Travel and Tour Operations",
    "Diploma in Business Management",
    "Masters of Business Administration (MBA)",
    "M.A - Religious Studies",
    "M.A - English",
    "M.A - Kiswahili",
    "M.A - Literature",
    "M.A - Sociology",
    "M.A - History",
    "PhD - Religious Studies",
    "PhD - Linguistics (English and Kiswahili)",
    "PhD - Literature",
    "PhD - Psychology",
    "PhD - Sociology",
    "PhD - Geography",
  ],
  "School of Agriculture and Environmental Sciences": [
    "Bachelor of Environmental Science",
    "Bachelor of Environmental Studies (Community Development)",
    "Bachelor of Environmental Planning & Management",
    "Bachelor of Science (Agri. Enterprise Development)",
    "Bachelor of Science (Agricultural Resource Management)",
    "Bachelor of Science (Animal Production and Health)",
    "Bachelor of Science (Horticulture)",
    "Bachelor of Science (Agribusiness Management and Trade)",
    "Diploma in Animal Health Management",
    "Diploma in Community Development",
    "Diploma in Agriculture and Marketing",
    "Diploma in Horticulture and Marketing",
    "Certificate in Agriculture",
    "Certificate in Community Development",
    "Masters in Environmental Studies (Community Development)",
    "Masters in Environmental Science",
    "Masters of Science (Livestock)",
    "Masters of Science (Agronomy)",
    "Masters of Science (Environmental Science - CD)",
    "PhD - Environmental Planning and Management",
    "PhD - Environmental Science",
    "PhD - Horticulture",
  ],
};
function App() {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('pu_user');
    return saved ? JSON.parse(saved) : null;
  });
const handleLogin = (userData) => {
    sessionStorage.setItem('pu_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('pu_user');
    setUser(null);
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;
 
  return <Dashboard user={user} onLogout={handleLogout} />;
}
function Dashboard({ user, onLogout }) {
  const isAdmin = user?.role === 'admin';
  const isLecturer = user?.role === 'lecturer';
  const [overview, setOverview] = useState(null);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [page, setPage] = useState("overview");

  const loadStudents = () => axios.get(`${API}/students`).then(r => setStudents(r.data)).catch(() => {});
  const loadCourses = () => axios.get(`${API}/courses`).then(r => setCourses(r.data)).catch(() => {});
  const loadOverview = () => axios.get(`${API}/dashboard/overview`).then(r => setOverview(r.data)).catch(() => {});
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  const handleMinimize = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    document.title = "Attendance ≠ Performance Dashboard — Pwani University";
    loadOverview();
    loadStudents();
    loadCourses();
    axios.get(`${API}/departments`).then(r => setDepartments(r.data)).catch(() => {});
  }, []);

const navItems = [
    { id: "overview", label: "Dashboard", icon: "🏠" },
    ...(isAdmin ? [
      { id: "students", label: "Students", icon: "🎓" },
      { id: "courses", label: "Courses", icon: "📚" },
    ] : []),
    { id: "attendance", label: "Attendance", icon: "📋" },
    { id: "assignments", label: "Assessments", icon: "📝" },
    { id: "insights", label: "Insights", icon: "💡" },
    { id: "quadrant", label: "Att ≠ Perf", icon: "📊" },
    ...(isAdmin ? [
      { id: "enrollments", label: "Enrollments", icon: "🔗" },
      { id: "lecturers", label: "Lecturers", icon: "👨‍🏫" },
      { id: "grades", label: "Grades", icon: "📊" },
      { id: "charts", label: "Charts", icon: "📈" },
      { id: "reports", label: "Reports", icon: "📄" },
    ] : []),
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

 const pageTitle = { overview: "Dashboard", students: "Students", courses: "Courses", attendance: "Attendance", assignments: "Assessments", insights: "Insights", quadrant: "Attendance ≠ Performance", enrollments: "Student Enrollments", lecturers: "Manage Lecturers", settings: "Settings", charts: "Analytics Charts", reports: "Reports & Exports", grades: "Grades" };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', Arial, sans-serif", background: "#f0f4f8" }}>
      {/* Sidebar */}
      <div style={{ width: sidebarOpen ? 240 : 0, minWidth: sidebarOpen ? 240 : 0, background: "linear-gradient(180deg, #0a3d62 0%, #1a5276 100%)", color: "white", position: "fixed", height: "100vh", overflowY: "auto", overflowX: "hidden", transition: "all 0.3s", zIndex: 100, boxShadow: "2px 0 12px #00000033" }}>
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #ffffff22" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "#f39c12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900 }}>PU</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 14, letterSpacing: 0.3 }}>Pwani University</div>
              <div style={{ fontSize: 10, color: "#a9c8e8", marginTop: 1 }}>Attendance ≠ Performance Dashboard</div>
            </div>
          </div>
        </div>
        <nav style={{ padding: "12px 10px" }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 14px", borderRadius: 8, border: "none", background: page === n.id ? "rgba(255,255,255,0.18)" : "transparent", color: page === n.id ? "white" : "#a9c8e8", fontWeight: page === n.id ? 700 : 400, fontSize: 14, cursor: "pointer", marginBottom: 3, textAlign: "left", borderLeft: page === n.id ? "3px solid #f39c12" : "3px solid transparent" }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, padding: "0 16px" }}>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 14px", fontSize: 11, color: "#a9c8e8" }}>
            <div style={{ fontWeight: 700, color: "white", marginBottom: 4 }}>📅 Academic Year 2025/2026</div>
            <div>Semester 1 — Active</div>
            <div style={{ marginTop: 4, color: "#f39c12", fontWeight: 600 }}>⚠️ Verify Attendance vs Performance</div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, marginLeft: sidebarOpen ? 240 : 0, transition: "margin-left 0.3s", display: "flex", flexDirection: "column" }}>
        {/* Topbar */}
        <div style={{ background: "white", padding: "0 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", height: 60, position: "sticky", top: 0, zIndex: 50, boxShadow: "0 2px 8px #0000000d" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#4a5568", padding: 4 }}>☰</button>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#1a202c" }}>{pageTitle[page]}</div>
              <div style={{ fontSize: 11, color: "#a0aec0" }}>Attendance ≠ Performance Dashboard — Academic Year 2025/2026</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "#eafaf1", color: "#1e8449", border: "1px solid #82e0aa", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>● System Online</div>
            <div style={{ fontSize: 13, color: "#4a5568", fontWeight: 600 }}>{user?.full_name}</div>
            <div style={{ background: user?.role === 'admin' ? '#f39c12' : '#148f77', color: 'white', borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
              {user?.role === 'admin' ? '👑 Admin' : '👨‍🏫 Lecturer'}
            </div>
            {/* Minimize fullscreen */}
            <button
              onClick={handleMinimize}
              title="Exit Fullscreen / Minimize"
              style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fef9e7", color: "#e67e22", fontWeight: 900, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
              ─
            </button>
            {/* Maximize / Fullscreen */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Maximize / Fullscreen"}
              style={{ width: 32, height: 32, borderRadius: 8, border: "1.5px solid #e2e8f0", background: isFullscreen ? "#eafaf1" : "#eaf4fb", color: isFullscreen ? "#1e8449" : "#0a3d62", fontWeight: 900, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {isFullscreen ? "⊡" : "⊞"}
            </button>
            <button onClick={onLogout} style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "white", color: "#c0392b", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              Logout
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
          {page === "overview" && <Overview overview={overview} setPage={setPage} students={students} courses={isLecturer ? (user.courses || []) : courses} user={user} isAdmin={isAdmin} />}
          {page === "students" && <Students students={students} departments={departments} onRefresh={loadStudents} />}
          {page === "courses" && <Courses courses={courses} departments={departments} onRefresh={loadCourses} />}
          {page === "attendance" && <Attendance courses={isLecturer ? (user.courses || []) : courses} userId={isLecturer ? user.id : null} isLecturer={isLecturer} />}
          {page === "assignments" && <Assignments courses={isLecturer ? (user.courses || []) : courses} userId={isLecturer ? user.id : null} isLecturer={isLecturer} />}
          {page === "insights" && <Insights students={students} user={user} isAdmin={isAdmin} lecturerCourses={isLecturer ? (user.courses || []) : null} />}
          {page === "quadrant" && <QuadrantAnalysis user={user} isAdmin={isAdmin} courses={courses} />}
          {page === "enrollments" && isAdmin && <Enrollments students={students} courses={courses} />}
          {page === "lecturers" && isAdmin && <LecturersAdmin courses={courses} />}
          {page === "settings" && <Settings user={user} />}
          {page === "charts" && isAdmin && <Charts students={students} courses={courses} overview={overview} />}
          {page === "reports" && isAdmin && <Reports students={students} courses={courses} />}
          {page === "grades" && isAdmin && <AdminGrades courses={courses} />}
        </div>
      </div>
    </div>
  );
}
function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("admin");
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ staff_no: "", full_name: "", email: "", password: "", confirm_password: "", department_id: "1" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    axios.get(`${API}/departments`).then(r => setDepartments(r.data)).catch(() => {});
  }, []);

  const handleLogin = async () => {
    if (!form.email || !form.password) return setError("Email and password are required.");
    setLoading(true); setError("");
    try {
      const r = await axios.post(`${API}/auth/login`, { ...form, role: mode });
      if (r.data.success) onLogin(r.data);
      else setError(r.data.error || "Invalid credentials.");
    } catch (e) {
      setError(e.response?.data?.error || "Login failed. Check your credentials.");
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!regForm.staff_no || !regForm.full_name || !regForm.email || !regForm.password) return setError("All fields are required.");
    if (regForm.password !== regForm.confirm_password) return setError("Passwords do not match.");
    if (regForm.password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true); setError(""); setSuccess("");
    try {
      await axios.post(`${API}/auth/register-lecturer`, regForm);
      setSuccess("✅ Registration successful! You can now log in.");
      setTab("login");
      setForm({ email: regForm.email, password: "" });
      setRegForm({ staff_no: "", full_name: "", email: "", password: "", confirm_password: "", department_id: "1" });
    } catch (e) {
      const errMsg = e.response?.data?.error || "Registration failed.";
      setError(errMsg);
    }
    setLoading(false);
  };

  const handleForgot = async () => {
    if (!form.email || !form.password) return setError("Email and new password are required.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true); setError("");
    try {
      await axios.post(`${API}/auth/forgot-password`, { email: form.email, new_password: form.password });
      setSuccess("✅ Password reset successfully! You can now login.");
      setTab("login");
      setForm({ email: form.email, password: "" });
    } catch(e) {
      setError(e.response?.data?.error || "Reset failed. Email not found.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a3d62 0%, #1a5276 50%, #148f77 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Segoe UI, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 460, padding: 24 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 70, height: 70, borderRadius: 20, background: "#f39c12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: "white", margin: "0 auto 14px" }}>PU</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "white" }}>Pwani University</div>
          <div style={{ fontSize: 13, color: "#a9c8e8", marginTop: 4 }}>Attendance ≠ Performance Dashboard</div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16, justifyContent: "center" }}>
          {[
            { id: "admin", label: "👑 Admin", color: "#f39c12" },
            { id: "lecturer", label: "👨‍🏫 Lecturer", color: "#148f77" },
          ].map(m => (
            <button key={m.id} onClick={() => { setMode(m.id); setTab("login"); setError(""); setSuccess(""); setForm({ email: "", password: "" }); }}
              style={{ padding: "10px 28px", borderRadius: 10, border: `2px solid ${mode === m.id ? m.color : "rgba(255,255,255,0.3)"}`, background: mode === m.id ? m.color : "rgba(255,255,255,0.1)", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ background: "white", borderRadius: 20, padding: 32, boxShadow: "0 20px 60px #00000033" }}>
          {mode === "lecturer" && tab !== "forgot" && (
            <div style={{ display: "flex", marginBottom: 24, background: "#f0f4f8", borderRadius: 10, padding: 4 }}>
              {[{ id: "login", label: "Login" }, { id: "register", label: "Register" }].map(t => (
                <button key={t.id} onClick={() => { setTab(t.id); setError(""); setSuccess(""); }}
                  style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", background: tab === t.id ? "white" : "transparent", color: tab === t.id ? "#0a3d62" : "#718096", fontWeight: tab === t.id ? 700 : 500, fontSize: 13, cursor: "pointer", boxShadow: tab === t.id ? "0 2px 8px #0000001a" : "none" }}>
                  {t.label}
                </button>
              ))}
            </div>
          )}

          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1a202c" }}>
              {tab === "forgot" ? "Reset Password" : mode === "admin" ? "Admin Login" : tab === "login" ? "Lecturer Login" : "Lecturer Registration"}
            </div>
            <div style={{ fontSize: 12, color: "#a0aec0", marginTop: 4 }}>
              {tab === "forgot" ? "Enter your email and new password" : mode === "admin" ? "Sign in with your administrator credentials" : tab === "login" ? "Sign in to your lecturer account" : "Create a new lecturer account"}
            </div>
          </div>

          {error && <div style={{ background: "#fdf2f2", border: "1px solid #f1948a", borderRadius: 8, padding: "10px 14px", color: "#c0392b", fontSize: 13, marginBottom: 16, fontWeight: 600 }}>{error}</div>}
          {success && <div style={{ background: "#eafaf1", border: "1px solid #82e0aa", borderRadius: 8, padding: "10px 14px", color: "#1e8449", fontSize: 13, marginBottom: 16, fontWeight: 600 }}>{success}</div>}

          {tab === "login" && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>EMAIL ADDRESS</label>
                <input type="email" placeholder="Enter your email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>PASSWORD</label>
                <input type="password" placeholder="Enter your password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <button onClick={handleLogin} disabled={loading}
                style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: loading ? "#a0aec0" : mode === "admin" ? "#f39c12" : "#0a3d62", color: "white", fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Signing in..." : "Login →"}
              </button>
              <div style={{ textAlign: "center", marginTop: 14 }}>
                <button onClick={() => { setTab("forgot"); setError(""); setForm({ email: "", password: "" }); }}
                  style={{ background: "none", border: "none", color: "#0a3d62", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
                  Forgot Password?
                </button>
              </div>
            </div>
          )}

          {tab === "forgot" && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>EMAIL ADDRESS</label>
                <input type="email" placeholder="Enter your registered email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>NEW PASSWORD</label>
                <input type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <button onClick={handleForgot} disabled={loading}
                style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: loading ? "#a0aec0" : "#7d3c98", color: "white", fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Resetting..." : "Reset Password →"}
              </button>
              <div style={{ textAlign: "center", marginTop: 14 }}>
                <button onClick={() => { setTab("login"); setError(""); setForm({ email: "", password: "" }); }}
                  style={{ background: "none", border: "none", color: "#0a3d62", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
                  ← Back to Login
                </button>
              </div>
            </div>
          )}

          {tab === "register" && mode === "lecturer" && (
           <div>
            <div style={{ background: "#eaf4fb", border: "1px solid #85c1e9", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>
                ℹ️ Enter your <strong>Staff Number</strong> and <strong>Email</strong> as registered by the admin, then set your password.
              </div>
              {[
                { label: "STAFF NUMBER *", key: "staff_no", placeholder: "e.g. PU/STAFF/001", type: "text" },
                { label: "FULL NAME *", key: "full_name", placeholder: "e.g. Dr. John Mwangi", type: "text" },
                { label: "EMAIL ADDRESS *", key: "email", placeholder: "e.g. john@pu.ac.ke", type: "email" },
                { label: "PASSWORD *", key: "password", placeholder: "Min 6 characters", type: "password" },
                { label: "CONFIRM PASSWORD *", key: "confirm_password", placeholder: "Re-enter password", type: "password" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={regForm[f.key]} onChange={e => setRegForm({ ...regForm, [f.key]: e.target.value })}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }} />
                </div>
              ))}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>SCHOOL *</label>
                <select value={regForm.department_id} onChange={e => setRegForm({ ...regForm, department_id: e.target.value })}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }}>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <button onClick={handleRegister} disabled={loading}
                style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: loading ? "#a0aec0" : "#148f77", color: "white", fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Registering..." : "Register →"}
              </button>
            </div>
          )}
        </div>
        <div style={{ textAlign: "center", marginTop: 20, color: "#a9c8e8", fontSize: 12 }}>
          © 2025/2026 Pwani University — Attendance ≠ Performance Dashboard
        </div>
      </div>
    </div>
  );
}
function Overview({ overview, setPage, students, courses, user, isAdmin }) {
  const [lecturerStats, setLecturerStats] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseStudents, setCourseStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const uploadedSessionIdRef = useRef(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [assessments, setAssessments] = useState([]);
  const [scores, setScores] = useState({});
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [savingScores, setSavingScores] = useState(false);
  const [atRisk, setAtRisk] = useState({ attendance_risk: [], performance_risk: [] });
  const [insightTab, setInsightTab] = useState("attendance");
  const [statusMsg, setStatusMsg] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({ title: "", type: "cat", max_score: "30" });
  const [grades, setGrades] = useState(null);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [savedSessions, setSavedSessions] = useState([]);
  const [selectedWeekSession, setSelectedWeekSession] = useState(null);

  useEffect(() => {
    if (user?.id && !isAdmin) {
      axios.get(`${API}/lecturer/${user.id}/dashboard`)
        .then(r => setLecturerStats(r.data.courses || []))
        .catch(() => {});
      axios.get(`${API}/analytics/at-risk?lecturer_id=${user.id}`)
        .then(r => setAtRisk(r.data))
        .catch(() => {});
    }
  }, [user?.id]);

  const loadScoresFromBackend = async (students, assessments) => {
    try {
      const scoreMap = {};
      students.forEach(s => { scoreMap[s.id] = {}; });
      for (const ass of assessments) {
        const res = await axios.get(`${API}/assignments/${ass.id}/scores`);
        const submits = res.data || [];
        submits.forEach(sub => {
          if (scoreMap[sub.student_id] !== undefined) {
            scoreMap[sub.student_id][ass.id] = sub.score;
          }
        });
      }
      setScores(scoreMap);
    } catch (e) {
      console.error("Failed to load scores", e);
    }
  };

  const selectCourse = async (course) => {
    setSelectedCourse(course);
    setActiveTab("students");
    setLoadingStudents(true);
    setStatusMsg("");
    try {
      const [studRes, assRes] = await Promise.all([
        axios.get(`${API}/courses/${course.id}/students`),
        axios.get(`${API}/assignments?course_id=${course.id}`)
      ]);
      const studs = studRes.data || [];
      const ass = assRes.data || [];
      setCourseStudents(studs);
      setAssessments(ass);
      await loadScoresFromBackend(studs, ass);
      const initAtt = {};
      studs.forEach(s => { initAtt[s.id] = "present"; });
      setAttendanceMap(initAtt);
      // Load saved attendance sessions for this course
      try {
        const sessRes = await axios.get(`${API}/courses/${course.id}/attendance-sessions`);
        setSavedSessions(sessRes.data || []);
        setOcrResult(null);
        setStatusMsg("");
      } catch {}
    } catch { setCourseStudents([]); }
    setLoadingStudents(false);
  };
  const saveAttendance = async () => {
    if (!selectedCourse || courseStudents.length === 0) return;
    setSavingAttendance(true);
    try {
      const daysHeld = ocrResult?.days_held || 1;
      let sessionId = uploadedSessionIdRef.current;

      // Only create a NEW session if there was no upload (manual attendance)
      if (!sessionId) {
        const sessionRes = await axios.post(`${API}/attendance/sessions`, {
          course_id: selectedCourse.id,
          lecturer_id: user.id,
          session_date: attendanceDate,
          session_type: "lecture"
        });
        sessionId = sessionRes.data.id;
      }

      let records;
      if (ocrResult && Array.isArray(ocrResult.results) && ocrResult.results.length > 0) {
        records = ocrResult.results.map(r => {
          const dp = typeof r.days_present === 'number' ? r.days_present : (r.status === 'present' ? daysHeld : 0);
          return {
            student_id: r.student_id,
            status: dp > 0 ? 'present' : 'absent',
            days_present: dp,
            days_held: daysHeld
          };
        });
      } else {
        records = courseStudents.map(s => ({
          student_id: s.id,
          status: attendanceMap[s.id] || "absent",
          days_present: attendanceMap[s.id] === 'present' ? daysHeld : 0,
          days_held: daysHeld
        }));
      }

      await axios.put(`${API}/attendance/sessions/${sessionId}/records`, { records, days_held: daysHeld });

      setStatusMsg("✅ Attendance saved successfully!");
      uploadedSessionIdRef.current = null;
      setOcrResult(null);
      const [dashRes, sessRes, riskRes] = await Promise.all([
        axios.get(`${API}/lecturer/${user.id}/dashboard`),
        axios.get(`${API}/courses/${selectedCourse.id}/attendance-sessions`),
        axios.get(`${API}/analytics/at-risk?lecturer_id=${user.id}`)
      ]);
      setLecturerStats(dashRes.data.courses || []);
      setSavedSessions(sessRes.data || []);
      setAtRisk(riskRes.data);
    } catch (e) {
      setStatusMsg("❌ Failed: " + (e.response?.data?.error || e.message));
    }
    setSavingAttendance(false);
  };
  const createAssessment = async () => {
    if (!assessmentForm.title.trim()) { setStatusMsg("❌ Title is required."); return; }
    try {
      await axios.post(`${API}/assignments`, {
        course_id: selectedCourse.id,
        title: assessmentForm.title.trim(),
        type: assessmentForm.type,
        max_score: parseInt(assessmentForm.max_score) || 30
      });
      const assRes = await axios.get(`${API}/assignments?course_id=${selectedCourse.id}`);
      const newAss = assRes.data || [];
      setAssessments(newAss);
      await loadScoresFromBackend(courseStudents, newAss);
      setStatusMsg("✅ Assessment created! Enter scores for each student below.");
      setShowAssessmentForm(false);
      setAssessmentForm({ title: "", type: "cat", max_score: "30" });
    } catch (e) {
      setStatusMsg("❌ Failed: " + (e.response?.data?.error || e.message));
    }
  };

  const saveScores = async () => {
    if (!selectedCourse) return;
    setSavingScores(true);
    try {
      let count = 0;
      for (const [studentId, studentScores] of Object.entries(scores)) {
        for (const [assId, score] of Object.entries(studentScores)) {
          if (score !== null && score !== undefined && score !== "") {
            await axios.put(`${API}/assignments/${assId}/scores`, {
              scores: [{ student_id: Number(studentId), score: parseFloat(score) }]
            });
            count++;
          }
        }
      }
      if (count === 0) {
        setStatusMsg("⚠️ No scores to save. Enter scores in the input boxes first.");
      } else {
        await loadScoresFromBackend(courseStudents, assessments);
        setStatusMsg(`✅ ${count} score(s) saved! Now click 📊 Grades tab → Calculate Grades.`);
      }
    } catch (e) {
      setStatusMsg("❌ Failed: " + (e.response?.data?.error || e.message));
    }
    setSavingScores(false);
  };

  const loadGrades = async (course) => {
    if (!course?.id) { setStatusMsg("❌ No course selected."); return; }
    setGrades(null);
    setLoadingGrades(true);
    setStatusMsg("");
    try {
      const res = await axios.get(`${API}/courses/${course.id}/grades`);
      if (res.data && Array.isArray(res.data.students) && res.data.students.length > 0) {
        setGrades(res.data);
        const withData = res.data.students.filter(s => s.has_data).length;
        if (withData === 0) {
          setStatusMsg("⚠️ Grades calculated but no scores found. Enter scores in 📝 Assessments tab first.");
        }
      } else if (res.data && Array.isArray(res.data.students) && res.data.students.length === 0) {
        setStatusMsg("⚠️ No students enrolled in this course.");
      } else {
        setStatusMsg("❌ No grade data returned.");
      }
    } catch (e) {
      console.error("loadGrades error:", e);
      setStatusMsg("❌ Failed: " + (e.response?.data?.error || e.message));
    }
    setLoadingGrades(false);
  };

  const runOCR = async (filename) => {
    if (!selectedCourse || !filename) return;
    setOcrLoading(true); setOcrResult(null);
    try {
      const daysOverride = parseInt(manualDaysHeld) || 1;
      const res = await axios.post(`${API}/attendance/ocr`, {
        filename,
        course_id: selectedCourse.id,
        days_held: daysOverride
      });
      setOcrResult(res.data);
      const m = {};
      res.data.results.forEach(r => { m[r.student_id] = r.status; });
      setAttendanceMap(m);
      setStatusMsg(`✅ OCR complete! ${res.data.present_count} present, ${res.data.absent_count} absent detected. Review below and save.`);
    } catch (e) {
      setStatusMsg("❌ OCR failed: " + (e.response?.data?.error || e.message));
    }
    setOcrLoading(false);
  };
const [weekNum, setWeekNum] = useState("1");
  const [manualDaysHeld, setManualDaysHeld] = useState("5");

const handleUpload = async () => {
    if (!uploadFile || !selectedCourse) {
      return setStatusMsg("❌ Please select a file and course");
    }
    if (!weekNum || isNaN(weekNum) || Number(weekNum) < 1 || Number(weekNum) > 15) {
      return setStatusMsg("❌ Please enter a valid week number (1–15)");
    }

    setUploading(true);
    setStatusMsg("");
    uploadedSessionIdRef.current = null;

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("course_id", selectedCourse.id);
    formData.append("session_date", attendanceDate);
    formData.append("week_number", weekNum);

    try {
      const res = await axios.post(`${API}/attendance/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000
      });

      if (res.data.session_id) {
        uploadedSessionIdRef.current = res.data.session_id;
      }

      setStatusMsg(`✅ Week ${weekNum} uploaded! Running OCR...`);
      await runOCR(res.data.filename, 5);

    } catch (e) {
      console.error(e);
      const errMsg = e.response?.data?.error || e.message;
      if (e.response?.status === 409) {
        setStatusMsg(`⚠️ ${errMsg}`);
      } else if (e.code === 'ECONNABORTED' || e.message?.toLowerCase().includes('timeout') || e.message?.toLowerCase().includes('network')) {
        setStatusMsg("⚠️ Connection timed out — checking if session was saved...");
        try {
          const sessRes = await axios.get(`${API}/courses/${selectedCourse.id}/attendance-sessions`);
          const sessions = sessRes.data || [];
          const savedToday = sessions.find(s => s.session_date?.startsWith(attendanceDate));
          if (savedToday) {
            uploadedSessionIdRef.current = savedToday.id;
            setSavedSessions(sessions);
            setStatusMsg("✅ Session was saved successfully! Review the list below and click Save Weekly Attendance.");
          } else {
            setStatusMsg("❌ Upload failed — Network Error. Please try again.");
          }
        } catch {
          setStatusMsg("❌ Upload failed — Network Error. Please try again.");
        }
      } else {
        setStatusMsg("❌ " + errMsg);
      }
    }
    setUploading(false);
  };

  if (isAdmin) {
    const cards = [
      { label: "Total Students", value: overview?.total_students || 0, icon: "🎓", color: "#0a3d62", onClick: () => setPage("students") },
      { label: "Total Courses", value: overview?.total_courses || 0, icon: "📚", color: "#148f77", onClick: () => setPage("courses") },
      { label: "At Risk Students", value: overview?.at_risk_attendance || 0, icon: "⚠️", color: "#c0392b", onClick: () => setPage("insights") },
      { label: "Avg Attendance", value: `${overview?.avg_attendance || 0}%`, icon: "📊", color: "#d35400", onClick: () => setPage("attendance") },
      { label: "📊 Grades", value: "View →", icon: "🎓", color: "#7d3c98", onClick: () => setPage("grades") },
    ];
    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#1a202c" }}>Welcome to Attendance ≠ Performance Dashboard 👋</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 24 }}>
          {cards.map((c, i) => <StatCard key={i} label={c.label} value={c.value} icon={c.icon} color={c.color} onClick={c.onClick} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 2px 8px #0000000d" }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>📌 Academic Policy</div>
            <div style={{ background: "#fff8e1", border: "1px solid #f9ca5a", borderRadius: 10, padding: 14, fontSize: 13, marginBottom: 10 }}>
              <strong>⚠️ Attendance Alert:</strong> Low attendance triggers a flag — but always <strong>verify against performance</strong> before intervening. A student may be absent yet performing well.
            </div>
            <div style={{ background: "#eaf4fb", border: "1px solid #85c1e9", borderRadius: 10, padding: 14, fontSize: 13 }}>
              <strong>Grade:</strong> <strong>30%</strong> CATs/Assignments + <strong>70%</strong> End Semester Exam
            </div>
          </div>
          <div style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 2px 8px #0000000d" }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>📊 Quick Summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { label: "Active Students", value: students.length, color: "#0a3d62" },
                { label: "Courses", value: courses.length, color: "#148f77" },
                { label: "At Risk", value: overview?.at_risk_attendance || 0, color: "#c0392b" },
              ].map((s, i) => (
                <div key={i} style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "#718096", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===================== LECTURER DASHBOARD =====================
  const totalStudents = lecturerStats.reduce((sum, c) => sum + (c.student_count || 0), 0);
  const totalSessions = lecturerStats.reduce((sum, c) => sum + (c.total_sessions || 0), 0);
  const combinedRisk = new Set([
    ...atRisk.attendance_risk.map(s => String(s.student_id)),
    ...atRisk.performance_risk.map(s => String(s.student_id))
  ]).size;

  const tabStyle = (id) => ({
    padding: "9px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
    background: activeTab === id ? "#0a3d62" : "#f0f4f8",
    color: activeTab === id ? "white" : "#4a5568"
  });

  return (
    <div>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0a3d62, #148f77)", borderRadius: 16, padding: "24px 32px", color: "white", marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>Welcome back, {user?.full_name?.split(" ")[0]}! 👋</div>
        <div style={{ fontSize: 13, marginTop: 4, opacity: 0.85 }}>Staff No: {user?.staff_no} &nbsp;|&nbsp; Academic Year 2025/2026</div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "My Units", value: lecturerStats.length, icon: "📚", color: "#148f77", onClick: null },
          { label: "Total Students", value: totalStudents, icon: "🎓", color: "#0a3d62", onClick: null },
          { label: "Sessions Taken", value: totalSessions, icon: "📋", color: "#7d3c98", onClick: () => setPage("attendance") },
          { label: "At Risk Students", value: combinedRisk, icon: "⚠️", color: "#c0392b", onClick: () => setPage("insights") },
        ].map((s, i) => (
          <div key={i} onClick={s.onClick} style={{ background: "white", padding: "18px 20px", borderRadius: 14, boxShadow: "0 2px 8px #0000000d", borderLeft: `4px solid ${s.color}`, cursor: s.onClick ? "pointer" : "default" }}>
            <div style={{ fontSize: 26, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#718096" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Course Selector with Attendance Summary */}
      <div style={{ background: "white", borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: "0 2px 8px #0000000d" }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12, color: "#1a202c" }}>📚 Select a Course to Manage</div>
        {lecturerStats.length === 0 ? (
          <div style={{ color: "#a0aec0", fontSize: 13 }}>No courses assigned yet. Contact admin.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {lecturerStats.map((c, i) => {
              const attColor = c.avg_attendance >= 75 ? "#1e8449" : c.avg_attendance >= 50 ? "#e67e22" : c.avg_attendance > 0 ? "#c0392b" : "#a0aec0";
              const attBg = c.avg_attendance >= 75 ? "#eafaf1" : c.avg_attendance >= 50 ? "#fef9e7" : c.avg_attendance > 0 ? "#fdf2f2" : "#f8fafc";
              return (
                <button key={i} onClick={() => selectCourse(c)}
                  style={{ padding: "14px 16px", borderRadius: 12, border: `2px solid ${selectedCourse?.id === c.id ? "#0a3d62" : "#e2e8f0"}`, background: selectedCourse?.id === c.id ? "#0a3d62" : "white", color: selectedCourse?.id === c.id ? "white" : "#374151", fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>{c.code}</div>
                  <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.85, marginBottom: 10 }}>{c.name.length > 30 ? c.name.substring(0, 30) + "…" : c.name}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ background: selectedCourse?.id === c.id ? "rgba(255,255,255,0.2)" : "#f0f4f8", color: selectedCourse?.id === c.id ? "white" : "#718096", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
                      👥 {c.student_count || 0} students
                    </span>
                    <span style={{ background: selectedCourse?.id === c.id ? "rgba(255,255,255,0.2)" : "#f0f4f8", color: selectedCourse?.id === c.id ? "white" : "#718096", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
                      📋 {c.total_sessions || 0} sessions
                    </span>
                    <span style={{ background: selectedCourse?.id === c.id ? "rgba(255,255,255,0.2)" : attBg, color: selectedCourse?.id === c.id ? "white" : attColor, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700, border: selectedCourse?.id === c.id ? "none" : `1px solid ${attColor}33` }}>
                      📊 {c.avg_attendance > 0 ? `${c.avg_attendance}% avg att.` : "No data yet"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Course Detail Panel */}
      {selectedCourse && (
        <div style={{ background: "white", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px #0000000d" }}>
          {/* Course Header */}
          <div style={{ background: "linear-gradient(135deg, #0a3d62, #1a5276)", padding: "16px 20px", color: "white" }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{selectedCourse.code} — {selectedCourse.name}</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
              {selectedCourse.program || "No Programme"} &nbsp;|&nbsp; 
              Year {selectedCourse.year_of_study || "—"} &nbsp;|&nbsp; 
              Semester {selectedCourse.semester || "—"} &nbsp;|&nbsp; 
              {courseStudents.length} students enrolled &nbsp;|&nbsp;
              {selectedCourse.total_sessions || 0} sessions held
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            {[
              { id: "students", label: "👥 Students" },
              { id: "attendance", label: "📋 Attendance" },
              { id: "assessments", label: "📝 Assessments" },
              { id: "insights", label: "💡 Insights" },
              { id: "grades", label: "📊 Grades" },
            ].map(t => (
              <button key={t.id} onClick={() => {
                setActiveTab(t.id);
                // Auto-load grades when switching to grades tab
                if (t.id === "grades" && selectedCourse && !grades) {
                  loadGrades(selectedCourse);
                }
                // Always reload sessions when switching to attendance tab
                if (t.id === "attendance" && selectedCourse) {
                  setOcrResult(null);
                  axios.get(`${API}/courses/${selectedCourse.id}/attendance-sessions`)
                    .then(r => setSavedSessions(r.data || [])).catch(() => {});
                }
              }} style={tabStyle(t.id)}>{t.label}</button>
            ))}
          </div>

          {statusMsg && (
            <div style={{ margin: "12px 16px", padding: "10px 14px", borderRadius: 8, 
              background: statusMsg.startsWith("✅") ? "#eafaf1" : statusMsg.startsWith("⚠️") ? "#fff8e1" : "#fdf2f2", 
              color: statusMsg.startsWith("✅") ? "#1e8449" : statusMsg.startsWith("⚠️") ? "#856404" : "#c0392b", 
              fontWeight: 600, fontSize: 13 }}>
              {statusMsg}
            </div>
          )}

          {/* STUDENTS TAB */}
          {activeTab === "students" && (
            <div>
              {loadingStudents ? (
                <div style={{ padding: 40, textAlign: "center", color: "#a0aec0" }}>Loading students...</div>
              ) : courseStudents.length === 0 ? (
                <div style={{ padding: 60, textAlign: "center", color: "#a0aec0" }}>No students enrolled in this course yet.</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["#", "Reg No", "Full Name", "Programme", "Year", "Status"].map(h => (
                        <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#718096", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {courseStudents.map((s, i) => (
                      <tr key={s.id} style={{ borderTop: "1px solid #f0f4f8", background: i % 2 === 0 ? "white" : "#fafbff" }}>
                        <td style={{ padding: "11px 16px", fontSize: 12, color: "#a0aec0" }}>{i + 1}</td>
                        <td style={{ padding: "11px 16px", fontFamily: "monospace", fontWeight: 700, color: "#0a3d62" }}>{s.reg_no}</td>
                        <td style={{ padding: "11px 16px", fontWeight: 600 }}>{s.full_name}</td>
                        <td style={{ padding: "11px 16px", fontSize: 12, color: "#718096" }}>{s.program || "—"}</td>
                        <td style={{ padding: "11px 16px", fontSize: 13 }}>Year {s.year_of_study}</td>
                        <td style={{ padding: "11px 16px" }}>
                          <span style={{ background: "#eafaf1", color: "#1e8449", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{s.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ATTENDANCE TAB */}
          {activeTab === "attendance" && (
            <div style={{ padding: 20 }}>
              {/* Session Date */}
              <div style={{ marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>SESSION DATE</label>
                  <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)}
                    style={{ padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14 }} />
                </div>
                <div style={{ background: "#eaf4fb", border: "1px solid #85c1e9", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#0a3d62", fontWeight: 600, maxWidth: 340 }}>
                  💡 <strong>Weekly Register:</strong> Upload the signed sheet after each week. OCR detects days held and marks attendance. Use the <strong>Monday</strong> date of that week. Then verify any flags against student performance before acting.
                </div>
              </div>
              {/* Print Attendance Sheet */}
              <div style={{ background: "linear-gradient(135deg,#eafaf1,#f0fff4)", border: "2px solid #82e0aa", borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#1e8449", marginBottom: 4 }}>🖨️ Print Attendance Sheet</div>
                  <div style={{ fontSize: 12, color: "#718096" }}>Download a PDF with all enrolled students pre-printed. Print and bring to class for students to sign each day.</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#1e8449" }}>WEEK NO.</label>
                    <input
                      type="number" min="1" max="15"
                      defaultValue="1"
                      id={`weekInput_overview_${selectedCourse?.id}`}
                      style={{ width: 60, padding: "6px 8px", borderRadius: 6, border: "1.5px solid #82e0aa", fontSize: 14, fontWeight: 700, textAlign: "center" }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      const week = document.getElementById(`weekInput_overview_${selectedCourse?.id}`)?.value || 1;
                      window.open(`http://127.0.0.1:5000/api/courses/${selectedCourse.id}/attendance-sheet?week=${week}`, '_blank');
                    }}
                    style={{ padding: "10px 22px", borderRadius: 8, border: "none", background: "#1e8449", color: "white", fontWeight: 800, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
                    ⬇️ Download PDF Sheet
                  </button>
                </div>
              </div>

              {/* OCR Upload — PRIMARY */}
              <div style={{ background: "linear-gradient(135deg,#eaf4fb,#f0f9ff)", border: "2px solid #85c1e9", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4, color: "#0a3d62" }}>
                  🤖 Upload Scanned Register — Auto-detect Attendance
                </div>
                <div style={{ fontSize: 13, color: "#718096", marginBottom: 14 }}>
                  Upload a photo or scan of the signed attendance register. OCR will automatically mark students present or absent.
                </div>
                {/* Week number input */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#0a3d62", whiteSpace: "nowrap" }}>WEEK NUMBER (1–15):</label>
                  <input
                    type="number" min="1" max="15"
                    value={weekNum}
                    onChange={e => setWeekNum(e.target.value)}
                    style={{ width: 70, padding: "7px 10px", borderRadius: 8, border: "1.5px solid #85c1e9", fontSize: 14, fontWeight: 700, textAlign: "center" }}
                  />
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#0a3d62", whiteSpace: "nowrap", marginLeft: 10 }}>DAYS HELD THIS WEEK:</label>
                  <input
                    type="number" min="1" max="5"
                    value={manualDaysHeld}
                    onChange={e => setManualDaysHeld(e.target.value)}
                    style={{ width: 60, padding: "7px 10px", borderRadius: 8, border: "1.5px solid #85c1e9", fontSize: 14, fontWeight: 700, textAlign: "center" }}
                  />
                  <span style={{ fontSize: 12, color: "#718096" }}>← How many lectures this week?</span>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <input type="file" accept="image/*,.pdf,.tiff"
                    onChange={e => setUploadFile(e.target.files[0])}
                    style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1.5px solid #85c1e9", fontSize: 13, background: "white" }} />
                  <button onClick={handleUpload}
                    disabled={uploading || ocrLoading || !uploadFile}
                    style={{ padding: "11px 24px", background: (uploading || ocrLoading || !uploadFile) ? "#a0aec0" : "#0a3d62", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }}>
                    {uploading ? "⬆ Uploading..." : ocrLoading ? "🔍 Reading..." : "⬆ Upload & Read"}
                  </button>
                </div>
                <div style={{ fontSize: 12, color: "#c0392b", marginTop: 10, fontWeight: 600 }}>
                  ✍️ Signature = Present &nbsp;&nbsp; ✗ or blank = Absent
                </div>
              </div>

              {/* OCR loading */}
              {ocrLoading && (
                <div style={{ background: "#f0f4f8", borderRadius: 8, padding: "14px 16px", marginBottom: 14, fontSize: 13, color: "#718096", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🔍</span> Reading attendance register... please wait.
                </div>
              )}

              {/* OCR result banner */}
              {ocrResult && (
                <div style={{ background: "#eaf4fb", border: "1px solid #85c1e9", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#0a3d62", marginBottom: 10 }}>🤖 OCR Result</div>
                  
                  {/* Course verification */}
                  <div style={{ marginBottom: 10, padding: "8px 12px", borderRadius: 8, background: ocrResult.header_verified ? "#eafaf1" : "#fff8e1", border: `1px solid ${ocrResult.header_verified ? "#82e0aa" : "#f9ca5a"}` }}>
                    {ocrResult.header_verified 
                      ? <span style={{ color: "#1e8449", fontWeight: 700, fontSize: 13 }}>✅ Course verified: <strong>{ocrResult.course_code} — {ocrResult.course_name}</strong></span>
                      : <span style={{ color: "#718096", fontWeight: 600, fontSize: 13 }}>ℹ️ Register processed for <strong>{ocrResult.course_code}</strong> — verify students below before saving.</span>
                    }
                    {ocrResult.week_number && <span style={{ marginLeft: 14, fontSize: 13, color: "#718096" }}>📅 Week <strong>{ocrResult.week_number}</strong></span>}
                  </div>

                  {/* Counts */}
                  <div style={{ display: "flex", gap: 20, fontSize: 14, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>✅ <strong style={{ color: "#1e8449" }}>{ocrResult.present_count} Present</strong></span>
                    <span>❌ <strong style={{ color: "#c0392b" }}>{ocrResult.absent_count} Absent</strong></span>
                    <span>👥 <strong>{ocrResult.total} Enrolled</strong></span>
                    <span style={{ background: "#eaf4fb", color: "#0a3d62", borderRadius: 20, padding: "2px 12px", fontWeight: 700, fontSize: 13 }}>
                      📅 {ocrResult.days_held || 1} lecture day{(ocrResult.days_held || 1) !== 1 ? "s" : ""} detected this week
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#718096" }}>
                    OCR detected <strong>{ocrResult.days_held || 1} day(s)</strong> held this week. Each student's attendance shows days attended out of days held. Adjust any incorrect readings then save.
                  </div>
                </div>
              )}

              <div style={{ background: "#fff8e1", border: "1px solid #f9ca5a", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
                ⚠️ <strong>Attendance Alert:</strong> Low attendance flags a student for review — but always check their performance first. A student may miss lectures yet perform well. Use the <strong>Att ≠ Perf</strong> tab for full analysis.
              </div>

              {courseStudents.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#a0aec0" }}>No students enrolled yet.</div>
              ) : (
                <>
                  <div style={{ marginBottom: 12, padding: "10px 14px", background: "#ecfdf5", borderRadius: 8, border: "1px solid #10b981", fontSize: 13 }}>
                    👥 <strong>{courseStudents.length} enrolled</strong>
                    {ocrResult && <span> &nbsp;|&nbsp; Present this week: <strong style={{ color: "#1e8449" }}>{ocrResult.present_count}</strong> &nbsp;|&nbsp; Absent: <strong style={{ color: "#c0392b" }}>{ocrResult.absent_count}</strong></span>}
                  </div>
                  {ocrResult ? (
                    <>
                      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
                        <thead>
                          <tr style={{ background: "#f8fafc" }}>
                            {["#", "Reg No", "Student Name", "Days Present This Week", "Status"].map(h => (
                              <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#718096", textTransform: "uppercase" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {ocrResult.results.map((r, i) => (
                            <tr key={r.student_id} style={{ borderTop: "1px solid #f0f4f8", background: r.status === "absent" ? "#fff5f5" : "white" }}>
                              <td style={{ padding: "11px 16px", fontSize: 12, color: "#a0aec0" }}>{i + 1}</td>
                              <td style={{ padding: "11px 16px", fontFamily: "monospace", fontWeight: 700, color: "#0a3d62", fontSize: 13 }}>{r.reg_no}</td>
                              <td style={{ padding: "11px 16px", fontWeight: 600 }}>{r.full_name}</td>
                              <td style={{ padding: "11px 16px" }}>
                                {(() => {
                                  const daysHeld = ocrResult?.days_held || parseInt(manualDaysHeld) || 1;
                                  const daysPresent = r.days_present ?? (r.status === "present" ? daysHeld : 0);
                                  return (
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                      <div style={{ display: "flex", gap: 4 }}>
                                        {Array.from({ length: daysHeld }).map((_, di) => {
                                          const attended = di < daysPresent;
                                          return (
                                            <div key={di}
                                              title={`Day ${di + 1} — click to toggle`}
                                              onClick={() => {
                                                const newDays = attended ? di : di + 1;
                                                const updated = ocrResult.results.map(s =>
                                                  s.student_id === r.student_id
                                                    ? { ...s, days_present: newDays, status: newDays > 0 ? 'present' : 'absent' }
                                                    : s
                                                );
                                                setOcrResult({ ...ocrResult,
                                                  results: updated,
                                                  present_count: updated.filter(s => s.status === 'present').length,
                                                  absent_count: updated.filter(s => s.status === 'absent').length
                                                });
                                              }}
                                              style={{ width: 28, height: 28, borderRadius: 6, cursor: "pointer", border: `2px solid ${attended ? "#1e8449" : "#e2e8f0"}`, background: attended ? "#1e8449" : "#f8fafc", transition: "all 0.15s", userSelect: "none" }} />
                                          );
                                        })}
                                      </div>
                                      <span style={{ fontSize: 12, fontWeight: 700, color: daysPresent > 0 ? "#1e8449" : "#c0392b" }}>
                                        {daysPresent}/{daysHeld} days
                                      </span>
                                    </div>
                                  );
                                })()}
                              </td>
                              <td style={{ padding: "11px 16px" }}>
                                {(() => {
                                  const daysHeld = ocrResult?.days_held || 1;
                                  const daysPresent = r.days_present ?? (r.status === "present" ? daysHeld : 0);
                                  const pct = daysHeld > 0 ? Math.round((daysPresent / daysHeld) * 100) : 0;
                                  const color = pct >= 75 ? "#1e8449" : pct >= 50 ? "#e67e22" : "#c0392b";
                                  const bg = pct >= 75 ? "#eafaf1" : pct >= 50 ? "#fef9e7" : "#fdf2f2";
                                  return (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                      <span style={{ background: bg, color, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700, display: "inline-block" }}>
                                        {daysPresent === 0 ? "❌ Absent" : pct === 100 ? "✅ Full" : `⚠️ Partial (${pct}%)`}
                                      </span>
                                    </div>
                                  );
                                })()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button onClick={saveAttendance} disabled={savingAttendance}
                        style={{ width: "100%", padding: "13px 0", borderRadius: 10, border: "none", background: savingAttendance ? "#a0aec0" : "#0a3d62", color: "white", fontWeight: 800, fontSize: 15, cursor: savingAttendance ? "not-allowed" : "pointer" }}>
                        {savingAttendance ? "Saving..." : "💾 Save Weekly Attendance"}
                      </button>
                    </>
                  ) : (
                    <div>
                      {/* Previous sessions history */}
                      {savedSessions.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "#1a202c" }}>
                              📅 Previous Attendance Sessions ({savedSessions.length})
                            </div>
                            <button
                              onClick={async () => {
                                if (!window.confirm(`⚠️ DELETE ALL ${savedSessions.length} attendance session(s) for ${selectedCourse.code}?\n\nThis cannot be undone!`)) return;
                                try {
                                  for (const sess of savedSessions) {
                                    await axios.delete(`${API}/attendance/sessions/${sess.id}`);
                                  }
                                  setSavedSessions([]);
                                  setSelectedWeekSession(null);
                                  setStatusMsg("✅ All attendance sessions deleted. You can now upload fresh registers.");
                                  axios.get(`${API}/lecturer/${user.id}/dashboard`).then(r => setLecturerStats(r.data.courses || []));
                                  axios.get(`${API}/analytics/at-risk?lecturer_id=${user.id}`).then(r => setAtRisk(r.data)).catch(() => {});
                                } catch (e) {
                                  setStatusMsg("❌ Reset failed: " + (e.response?.data?.error || e.message));
                                }
                              }}
                              style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid #f1948a", background: "#fdf2f2", color: "#c0392b", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                              🔄 Reset All Sessions
                            </button>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {savedSessions.map((sess, i) => (
                              <div key={sess.id}
                                style={{ background: selectedWeekSession?.id === sess.id ? "#eaf4fb" : "#f8fafc", border: `1px solid ${selectedWeekSession?.id === sess.id ? "#85c1e9" : "#e2e8f0"}`, borderRadius: 10, padding: "12px 16px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <div
                                    onClick={() => setSelectedWeekSession(selectedWeekSession?.id === sess.id ? null : sess)}
                                    style={{ cursor: "pointer", flex: 1 }}>
                                    <span style={{ fontWeight: 700, color: "#0a3d62" }}>
                                      📅 {new Date(sess.session_date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                    <span style={{ marginLeft: 12, fontSize: 12, color: "#718096" }}>{sess.session_type}</span>
                                  </div>
                                  <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13 }}>
                                    <span style={{ color: "#1e8449", fontWeight: 700 }}>✅ {sess.present_count} present</span>
                                    <span style={{ color: "#c0392b", fontWeight: 700 }}>❌ {sess.absent_count} absent</span>
                                    <span style={{ color: "#718096" }}>👥 {sess.total_records} total</span>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        const dateStr = new Date(sess.session_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                                        if (!window.confirm(`Delete attendance session for:\n${dateStr}?\n\nThis allows you to re-upload a corrected register for this week.`)) return;
                                        try {
                                          await axios.delete(`${API}/attendance/sessions/${sess.id}`);
                                          setSavedSessions(prev => prev.filter(s => s.id !== sess.id));
                                          if (selectedWeekSession?.id === sess.id) setSelectedWeekSession(null);
                                          setStatusMsg("✅ Session deleted. You can now upload a new register for this week.");
                                          axios.get(`${API}/lecturer/${user.id}/dashboard`).then(r => setLecturerStats(r.data.courses || []));
                                          axios.get(`${API}/analytics/at-risk?lecturer_id=${user.id}`).then(r => setAtRisk(r.data)).catch(() => {});
                                        } catch (e) {
                                          setStatusMsg("❌ Delete failed: " + (e.response?.data?.error || e.message));
                                        }
                                      }}
                                      style={{ padding: "4px 10px", borderRadius: 6, border: "1.5px solid #f1948a", background: "#fdf2f2", color: "#c0392b", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                                      🗑 Delete
                                    </button>
                                    <span
                                      onClick={() => setSelectedWeekSession(selectedWeekSession?.id === sess.id ? null : sess)}
                                      style={{ color: "#0a3d62", fontWeight: 600, cursor: "pointer" }}>
                                      {selectedWeekSession?.id === sess.id ? "▲ Hide" : "▼ View"}
                                    </span>
                                  </div>
                                </div>

                                {selectedWeekSession?.id === sess.id && (
                                  <div style={{ marginTop: 12, borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                      <thead>
                                        <tr style={{ background: "#f0f4f8" }}>
                                          {["#", "Reg No", "Student Name", "Status"].map(h => (
                                            <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#718096" }}>{h}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {sess.records.map((r, ri) => {
                                          const daysHeld = sess.days_held || 1;
                                          const daysPresent = r.days_present ?? (r.status === "present" ? daysHeld : 0);
                                          const color = daysPresent === daysHeld ? "#1e8449" : daysPresent > 0 ? "#e67e22" : "#c0392b";
                                          return (
                                            <tr key={r.student_id} style={{ borderTop: "1px solid #f0f4f8", background: daysPresent === 0 ? "#fff5f5" : "white" }}>
                                              <td style={{ padding: "8px 12px", fontSize: 12, color: "#a0aec0" }}>{ri + 1}</td>
                                              <td style={{ padding: "8px 12px", fontFamily: "monospace", fontWeight: 700, color: "#0a3d62", fontSize: 12 }}>{r.reg_no}</td>
                                              <td style={{ padding: "8px 12px", fontWeight: 600, fontSize: 13 }}>{r.full_name}</td>
                                              <td style={{ padding: "8px 12px" }}>
                                                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                                  {Array.from({ length: daysHeld }).map((_, di) => (
                                                    <div key={di} style={{ width: 40, height: 28, borderRadius: 4, border: `1px solid ${di < daysPresent ? "#1e8449" : "#e2e8f0"}`, background: di < daysPresent ? "#eafaf1" : "white", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 3 }}>
                                                      <div style={{ width: 30, height: 1, background: di < daysPresent ? "#1e8449" : "#cbd5e0" }} />
                                                    </div>
                                                  ))}
                                                  <span style={{ fontSize: 11, color, fontWeight: 700, marginLeft: 6 }}>
                                                    {daysPresent}/{daysHeld}
                                                  </span>
                                                </div>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ padding: 32, textAlign: "center", color: "#a0aec0", background: "#f8fafc", borderRadius: 10 }}>
                        <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
                        <div style={{ fontWeight: 700, color: "#4a5568", marginBottom: 6 }}>Upload a new register above</div>
                        <div style={{ fontSize: 13 }}>Use the OCR upload above to record this week's attendance.</div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ASSESSMENTS TAB */}
          {activeTab === "assessments" && (
            <div style={{ padding: 20 }}>
              {/* Course reminder banner */}
              <div style={{ background: "#eaf4fb", border: "1px solid #85c1e9", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontWeight: 800, color: "#0a3d62", fontSize: 14 }}>📚 {selectedCourse.code} — {selectedCourse.name}</span>
                  <span style={{ fontSize: 12, color: "#718096", marginLeft: 12 }}>CATs + Assignments = <strong>30 marks</strong> &nbsp;|&nbsp; Exam = <strong>70 marks</strong> &nbsp;|&nbsp; Total = <strong>100 marks</strong></span>
                </div>
                <div style={{ fontSize: 12, color: "#718096" }}>
                  Wrong course? <span style={{ color: "#0a3d62", fontWeight: 700, cursor: "pointer" }} onClick={() => { setSelectedCourse(null); setActiveTab("overview"); }}>← Go back</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: "#718096" }}>Enter scores below. CATs/Assignments total out of <strong>30</strong>, Exam out of <strong>70</strong>.</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setShowAssessmentForm(!showAssessmentForm); setStatusMsg(""); }}
                    style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#148f77", color: "white", fontWeight: 700, cursor: "pointer" }}>
                    {showAssessmentForm ? "✕ Cancel" : "+ New Assessment"}
                  </button>
                  <button onClick={saveScores} disabled={savingScores}
                    style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: savingScores ? "#a0aec0" : "#0a3d62", color: "white", fontWeight: 700, cursor: "pointer" }}>
                    {savingScores ? "Saving..." : "💾 Save Scores"}
                  </button>
                </div>
              </div>

              {showAssessmentForm && (
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>➕ New Assessment</div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#718096", display: "block", marginBottom: 4 }}>TITLE *</label>
                      <input placeholder="e.g. CAT 1, Assignment 1, End Semester Exam"
                        value={assessmentForm.title}
                        onChange={e => setAssessmentForm({...assessmentForm, title: e.target.value})}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#718096", display: "block", marginBottom: 4 }}>TYPE</label>
                      <select value={assessmentForm.type} onChange={e => setAssessmentForm({...assessmentForm, type: e.target.value})}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13 }}>
                        <option value="cat">CAT</option>
                        <option value="assignment">Assignment</option>
                        <option value="exam">Exam</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#718096", display: "block", marginBottom: 4 }}>MAX SCORE</label>
                      <input type="number" min="1" max="100" value={assessmentForm.max_score}
                        onChange={e => setAssessmentForm({...assessmentForm, max_score: e.target.value})}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }} />
                    </div>
                    <button onClick={createAssessment}
                      style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#0a3d62", color: "white", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                      Save
                    </button>
                  </div>
                </div>
              )}

              {assessments.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#a0aec0", background: "#f8fafc", borderRadius: 10 }}>
                  No assessments yet. Click <strong>+ New Assessment</strong> to add CAT, Assignment or Exam.
                </div>
              ) : courseStudents.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#a0aec0" }}>No students enrolled yet.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        <th style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#718096" }}>REG NO</th>
                        <th style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#718096" }}>STUDENT NAME</th>
                        {assessments.map(a => (
                          <th key={a.id} style={{ padding: "11px 12px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#718096", minWidth: 130 }}>
                            <div>{a.title}</div>
                            <div style={{ fontSize: 10, color: "#a0aec0", fontWeight: 600 }}>{a.type?.toUpperCase()} / {a.max_score}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {courseStudents.map((s, i) => (
                        <tr key={s.id} style={{ borderTop: "1px solid #f0f4f8", background: i % 2 === 0 ? "white" : "#fafbff" }}>
                          <td style={{ padding: "11px 16px", fontFamily: "monospace", fontWeight: 700, color: "#0a3d62", fontSize: 13 }}>{s.reg_no}</td>
                          <td style={{ padding: "11px 16px", fontWeight: 600 }}>{s.full_name}</td>
                          {assessments.map(a => (
                            <td key={a.id} style={{ padding: "8px 12px", textAlign: "center" }}>
                              <input type="number" min="0" max={a.max_score}
                                value={scores[s.id]?.[a.id] ?? ""}
                                onChange={e => setScores(prev => ({ ...prev, [s.id]: { ...prev[s.id], [a.id]: e.target.value } }))}
                                style={{ width: 80, padding: "7px", textAlign: "center", border: "1.5px solid #e2e8f0", borderRadius: 6, fontSize: 14 }}
                                placeholder="—" />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* GRADES TAB */}
          {activeTab === "grades" && (
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: "#718096" }}>Final = <strong>30%</strong> CAT/Assignments + <strong>70%</strong> Exam</div>
                <button onClick={() => loadGrades(selectedCourse)} disabled={loadingGrades}
                  style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: loadingGrades ? "#a0aec0" : "#0a3d62", color: "white", fontWeight: 700, cursor: "pointer" }}>
                  {loadingGrades ? "Calculating..." : "🔄 Calculate Grades"}
                </button>
              </div>
              {grades ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 16 }}>
                    {[
                      { label: "Total", value: grades.summary.total_students, color: "#0a3d62" },
                      { label: "✅ Passing", value: grades.summary.passing, color: "#1e8449" },
                      { label: "⚠️ At Risk", value: grades.summary.at_risk, color: "#e67e22" },
                      { label: "🚨 Failing", value: grades.summary.failing, color: "#c0392b" },
                      { label: "Avg Score", value: `${grades.summary.avg_final}%`, color: "#7d3c98" },
                    ].map((c, i) => (
                      <div key={i} style={{ background: c.color + "11", border: `1px solid ${c.color}33`, borderRadius: 10, padding: "12px", textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: c.color }}>{c.value}</div>
                        <div style={{ fontSize: 11, color: "#718096" }}>{c.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          {["Reg No", "Student", "CATs/Assignments (/30)", "Exam (/70)", "Final (/100)", "Grade", "Attend.", "Status"].map(h => (
                            <th key={h} style={{ padding: "10px 12px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#718096", textTransform: "uppercase" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {grades.students.map((s) => (
                          <tr key={s.student_id} style={{ borderTop: "1px solid #f0f4f8", background: s.status === "failing" ? "#fff5f5" : s.status === "at_risk" ? "#fffbeb" : "white" }}>
                            <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#0a3d62" }}>{s.reg_no}</td>
                            <td style={{ padding: "10px 12px", fontWeight: 600, fontSize: 13 }}>{s.full_name}</td>
                            <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, color: "#7d3c98" }}>{s.has_data ? `${s.cat_score}/30` : "—"}</td>
                            <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, color: "#1a6b8a" }}>{s.has_data ? `${s.exam_score}/70` : "—"}</td>
                            <td style={{ padding: "10px 12px", textAlign: "center" }}>
                              <span style={{ fontWeight: 900, fontSize: 15, color: s.final_score >= 50 ? "#1e8449" : s.final_score >= 40 ? "#e67e22" : "#c0392b" }}>
                                {s.has_data ? `${s.final_score}%` : "—"}
                              </span>
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "center" }}>
                              <span style={{ background: s.grade === "A" ? "#eafaf1" : s.grade === "F" ? "#fdf2f2" : "#fef9e7", color: s.grade === "A" ? "#1e8449" : s.grade === "F" ? "#c0392b" : "#e67e22", borderRadius: 6, padding: "2px 10px", fontWeight: 900 }}>
                                {s.has_data ? s.grade : "—"}
                              </span>
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "center" }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: s.attendance_pct < 75 ? "#c0392b" : "#1e8449" }}>
                                {s.total_sessions > 0 ? `${s.attendance_pct}%` : "—"}
                              </div>
                              {s.attendance_pct < 75 && s.total_sessions > 0 && <div style={{ fontSize: 10, color: "#c0392b" }}>⚠️ Verify vs perf</div>}
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "center" }}>
                              <span style={{ background: !s.has_data ? "#f0f4f8" : s.status === "pass" ? "#eafaf1" : s.status === "at_risk" ? "#fef9e7" : "#fdf2f2", color: !s.has_data ? "#a0aec0" : s.status === "pass" ? "#1e8449" : s.status === "at_risk" ? "#e67e22" : "#c0392b", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                                {!s.has_data ? "No data" : s.status === "pass" ? "✅ Pass" : s.status === "at_risk" ? "⚠️ At Risk" : "🚨 Failing"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div style={{ padding: 60, textAlign: "center", color: "#a0aec0", background: "#f8fafc", borderRadius: 10 }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
                  <div style={{ fontWeight: 700, marginBottom: 8, color: "#4a5568" }}>No grades calculated yet</div>
                  <div style={{ fontSize: 13, marginBottom: 16 }}>Steps: Go to <strong>📝 Assessments</strong> tab → create assessments → enter scores → Save Scores → come back here and click Calculate.</div>
                  <button onClick={() => loadGrades(selectedCourse)} disabled={loadingGrades}
                    style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#0a3d62", color: "white", fontWeight: 700, cursor: "pointer" }}>
                    🔄 Calculate Grades Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* INSIGHTS TAB */}
          {activeTab === "insights" && (
            <div style={{ padding: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ background: "#fdf2f2", borderRadius: 12, padding: "14px 18px", border: "1px solid #f1948a33", display: "flex", gap: 14, alignItems: "center" }}>
                  <span style={{ fontSize: 28 }}>🚨</span>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#c0392b" }}>{atRisk.attendance_risk.filter(s => courseStudents.some(cs => cs.reg_no === s.reg_no)).length}</div>
                    <div style={{ fontSize: 12, color: "#718096" }}>Attendance Risk in this course</div>
                  </div>
                </div>
                <div style={{ background: "#fef9e7", borderRadius: 12, padding: "14px 18px", border: "1px solid #f8c47133", display: "flex", gap: 14, alignItems: "center" }}>
                  <span style={{ fontSize: 28 }}>📉</span>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#e67e22" }}>{atRisk.performance_risk.filter(s => courseStudents.some(cs => cs.reg_no === s.reg_no)).length}</div>
                    <div style={{ fontSize: 12, color: "#718096" }}>Performance Risk in this course</div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <button onClick={() => setInsightTab("attendance")} style={{ padding: "8px 18px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", background: insightTab === "attendance" ? "#c0392b" : "#f0f4f8", color: insightTab === "attendance" ? "white" : "#4a5568" }}>🚨 Attendance Risk</button>
                <button onClick={() => setInsightTab("performance")} style={{ padding: "8px 18px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", background: insightTab === "performance" ? "#e67e22" : "#f0f4f8", color: insightTab === "performance" ? "white" : "#4a5568" }}>📉 Performance Risk</button>
              </div>

              {insightTab === "attendance" && (
                <div style={{ background: "white", borderRadius: 12, overflow: "hidden", border: "1px solid #f0f4f8" }}>
                  <div style={{ padding: "12px 16px", background: "#fdf2f2", borderBottom: "1px solid #f1948a" }}>
                    <div style={{ fontWeight: 800, color: "#c0392b", fontSize: 14 }}>⚠️ Attendance Alert — Verify Against Performance</div>
                    <div style={{ fontSize: 12, color: "#856404", marginTop: 3 }}>Low attendance triggers a flag — but check performance before acting. Use the <strong>Att ≠ Perf</strong> tab for full context.</div>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {["Reg No", "Student", "Course", "Attended", "Total", "Attendance %", "Risk"].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#718096", textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {atRisk.attendance_risk.length === 0 ? (
                        <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#a0aec0" }}>🎉 No attendance risk students in your courses!</td></tr>
                      ) : atRisk.attendance_risk.map((s, i) => (
                        <tr key={i} style={{ borderTop: "1px solid #f0f4f8" }}>
                          <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 700, color: "#0a3d62", fontSize: 12 }}>{s.reg_no}</td>
                          <td style={{ padding: "10px 14px", fontWeight: 600, fontSize: 13 }}>{s.full_name}</td>
                          <td style={{ padding: "10px 14px", fontSize: 12 }}><span style={{ background: "#eaf4fb", color: "#1a6b8a", borderRadius: 6, padding: "2px 8px", fontWeight: 700 }}>{s.course_code}</span></td>
                          <td style={{ padding: "10px 14px", fontWeight: 700, fontSize: 13 }}>{s.sessions_attended}</td>
                          <td style={{ padding: "10px 14px", fontSize: 13 }}>{s.total_sessions}</td>
                          <td style={{ padding: "10px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 60, height: 5, background: "#f0f4f8", borderRadius: 3 }}>
                                <div style={{ width: `${s.attendance_percentage}%`, height: "100%", background: s.attendance_percentage < 50 ? "#c0392b" : "#e67e22", borderRadius: 3 }} />
                              </div>
                              <span style={{ fontWeight: 800, color: s.attendance_percentage < 50 ? "#c0392b" : "#e67e22", fontSize: 13 }}>{s.attendance_percentage}%</span>
                            </div>
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ background: s.attendance_percentage < 50 ? "#fdf2f2" : "#fef9e7", color: s.attendance_percentage < 50 ? "#c0392b" : "#e67e22", border: `1px solid ${s.attendance_percentage < 50 ? "#f1948a" : "#f8c471"}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                              {s.attendance_percentage < 50 ? "🚨 Critical" : "⚠️ At Risk"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {insightTab === "performance" && (
                <div style={{ background: "white", borderRadius: 12, overflow: "hidden", border: "1px solid #f0f4f8" }}>
                  <div style={{ padding: "12px 16px", background: "#fef9e7", borderBottom: "1px solid #f8c471", fontWeight: 700, color: "#e67e22", fontSize: 14 }}>
                    📉 Students Below 50% Performance
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {["Reg No", "Student", "Course", "CAT Avg", "Exam", "Final", "Status"].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#718096", textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {atRisk.performance_risk.length === 0 ? (
                        <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#a0aec0" }}>🎉 No performance risk students in your courses!</td></tr>
                      ) : atRisk.performance_risk.map((s, i) => (
                        <tr key={i} style={{ borderTop: "1px solid #f0f4f8" }}>
                          <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 700, color: "#0a3d62", fontSize: 12 }}>{s.reg_no}</td>
                          <td style={{ padding: "10px 14px", fontWeight: 600, fontSize: 13 }}>{s.full_name}</td>
                          <td style={{ padding: "10px 14px", fontSize: 12 }}><span style={{ background: "#eaf4fb", color: "#1a6b8a", borderRadius: 6, padding: "2px 8px", fontWeight: 700 }}>{s.course_code}</span></td>
                          <td style={{ padding: "10px 14px", fontWeight: 800, color: (s.cat_average || 0) < 40 ? "#c0392b" : "#e67e22" }}>{s.cat_average || "—"}</td>
                          <td style={{ padding: "10px 14px", fontWeight: 800, color: (s.exam_score || 0) < 40 ? "#c0392b" : "#e67e22" }}>{s.exam_score || "—"}</td>
                          <td style={{ padding: "10px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 60, height: 5, background: "#f0f4f8", borderRadius: 3 }}>
                                <div style={{ width: `${s.final_score}%`, height: "100%", background: s.final_score < 40 ? "#c0392b" : "#e67e22", borderRadius: 3 }} />
                              </div>
                              <span style={{ fontWeight: 800, color: s.final_score < 40 ? "#c0392b" : "#e67e22", fontSize: 13 }}>{s.final_score}%</span>
                            </div>
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ background: s.performance_status === "failing" ? "#fdf2f2" : "#fef9e7", color: s.performance_status === "failing" ? "#c0392b" : "#e67e22", border: `1px solid ${s.performance_status === "failing" ? "#f1948a" : "#f8c471"}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                              {s.performance_status === "failing" ? "🚨 Failing" : "⚠️ At Risk"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const quickActionStyle = {
  padding: "22px 24px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  fontSize: 16,
  fontWeight: 600,
  textAlign: "left",
  cursor: "pointer"
};
function AdminGrades({ courses }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [grades, setGrades] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadGrades = async (course) => {
    setSelectedCourse(course);
    setGrades(null);
    setSearch("");
    setLoading(true);
    try {
      const res = await axios.get(`${API}/courses/${course.id}/grades`);
      console.log("Grades response:", res.data);
      if (res.data && Array.isArray(res.data.students)) {
        setGrades(res.data);
      } else {
        console.error("Unexpected grades format:", res.data);
        alert("Unexpected data format from server.");
      }
    } catch (e) {
      console.error("Grades error:", e);
      alert("Failed to load grades: " + (e.response?.data?.error || e.message));
    }
    setLoading(false);
  };

  const exportGradesCSV = () => {
    if (!grades) return;
    const rows = [
      "Reg No,Student Name,Course,CAT Average,CAT 30%,Exam Score,Exam 70%,Final Score,Grade,Attendance %,Status",
      ...grades.students.map(s =>
        `"${s.reg_no}","${s.full_name}","${selectedCourse.code}","${s.cat_average}%","${s.cat_component}","${s.exam_score}%","${s.exam_component}","${s.final_score}%","${s.grade}","${s.attendance_pct}%","${s.status}"`
      )
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `grades_${selectedCourse.code}.csv`; a.click();
  };

  const filtered = (grades?.students || []).filter(s =>
    (s.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.reg_no || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Course Selector */}
      <div style={{ background: "white", borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: "0 2px 8px #0000000d" }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>📚 Select Course to View Grades</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {courses.map(c => (
            <button key={c.id} onClick={() => loadGrades(c)}
              style={{ padding: "9px 16px", borderRadius: 30, border: `2px solid ${selectedCourse?.id === c.id ? "#0a3d62" : "#e2e8f0"}`, background: selectedCourse?.id === c.id ? "#0a3d62" : "white", color: selectedCourse?.id === c.id ? "white" : "#374151", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {c.code}
              <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.8 }}>({c.enrolled_count || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {loading && <div style={{ padding: 60, textAlign: "center", color: "#a0aec0" }}>Calculating grades...</div>}

      {grades && selectedCourse && (
        <>
          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Total", value: grades.summary.total_students, color: "#0a3d62" },
              { label: "✅ Passing", value: grades.summary.passing, color: "#1e8449" },
              { label: "⚠️ At Risk", value: grades.summary.at_risk, color: "#e67e22" },
              { label: "🚨 Failing", value: grades.summary.failing, color: "#c0392b" },
              { label: "No Data", value: grades.summary.no_data, color: "#a0aec0" },
              { label: "Avg Score", value: `${grades.summary.avg_final}%`, color: "#7d3c98" },
            ].map((c, i) => (
              <div key={i} style={{ background: c.color + "11", border: `1px solid ${c.color}33`, borderRadius: 10, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: c.color }}>{c.value}</div>
                <div style={{ fontSize: 10, color: "#718096" }}>{c.label}</div>
              </div>
            ))}
          </div>

          {/* Search + Export */}
          <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "center" }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Search student..." 
              style={{ flex: 1, padding: "9px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13 }} />
            <button onClick={exportGradesCSV}
              style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#148f77", color: "white", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
              ⬇️ Export CSV
            </button>
          </div>

          {/* Grades Table */}
          <div style={{ background: "white", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px #0000000d" }}>
            <div style={{ background: "linear-gradient(135deg,#0a3d62,#1a5276)", padding: "14px 20px", color: "white" }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{selectedCourse.code} — {selectedCourse.name}</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{selectedCourse.program || "—"} | Year {selectedCourse.year_of_study} | Sem {selectedCourse.semester}</div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["#","Reg No","Student","CATs/Assignments (/30)","Exam (/70)","Final (/100)","Grade","Attend.","Status"].map(h => (
                      <th key={h} style={{ padding: "10px 10px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#718096", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr key={s.student_id} style={{ borderTop: "1px solid #f0f4f8", background: s.status === "failing" ? "#fff5f5" : s.status === "at_risk" ? "#fffbeb" : "white" }}>
                      <td style={{ padding: "9px 10px", textAlign: "center", fontSize: 12, color: "#a0aec0" }}>{i + 1}</td>
                      <td style={{ padding: "9px 10px", fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "#0a3d62" }}>{s.reg_no}</td>
                      <td style={{ padding: "9px 10px", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>{s.full_name}</td>
                      <td style={{ padding: "9px 10px", textAlign: "center", fontWeight: 700, color: "#7d3c98" }}>{s.has_data ? `${s.cat_score}/30` : "—"}</td>
                      <td style={{ padding: "9px 10px", textAlign: "center", fontWeight: 700, color: "#1a6b8a" }}>{s.has_data ? `${s.exam_score}/70` : "—"}</td>
                      <td style={{ padding: "9px 10px", textAlign: "center" }}>
                        <span style={{ fontWeight: 900, fontSize: 14, color: s.final_score >= 50 ? "#1e8449" : s.final_score >= 40 ? "#e67e22" : "#c0392b" }}>
                          {s.has_data ? `${s.final_score}%` : "—"}
                        </span>
                      </td>
                      <td style={{ padding: "9px 10px", textAlign: "center" }}>
                        <span style={{ 
                          background: !s.has_data ? "#f0f4f8" : s.grade === "A" ? "#eafaf1" : s.grade === "B" ? "#eaf4fb" : s.grade === "C" ? "#fef9e7" : s.grade === "D" ? "#fff3e0" : "#fdf2f2",
                          color: !s.has_data ? "#a0aec0" : s.grade === "A" ? "#1e8449" : s.grade === "B" ? "#1a6b8a" : s.grade === "C" ? "#e67e22" : s.grade === "D" ? "#d35400" : "#c0392b",
                          borderRadius: 6, padding: "2px 8px", fontWeight: 900, fontSize: 12 }}>
                          {s.has_data ? s.grade : "—"}
                        </span>
                      </td>
                      <td style={{ padding: "9px 10px", textAlign: "center" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: s.attendance_pct < 75 ? "#c0392b" : "#1e8449" }}>
                          {s.total_sessions > 0 ? `${s.attendance_pct}%` : "—"}
                        </div>
                        {s.attendance_pct < 75 && s.total_sessions > 0 && <div style={{ fontSize: 9, color: "#c0392b" }}>⚠️ Check perf</div>}
                      </td>
                      <td style={{ padding: "9px 10px", textAlign: "center" }}>
                        <span style={{ background: !s.has_data ? "#f0f4f8" : s.status === "pass" ? "#eafaf1" : s.status === "at_risk" ? "#fef9e7" : "#fdf2f2", color: !s.has_data ? "#a0aec0" : s.status === "pass" ? "#1e8449" : s.status === "at_risk" ? "#e67e22" : "#c0392b", borderRadius: 20, padding: "3px 8px", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>
                          {!s.has_data ? "No data" : s.status === "pass" ? "✅ Pass" : s.status === "at_risk" ? "⚠️ Risk" : "🚨 Fail"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={11} style={{ padding: 40, textAlign: "center", color: "#a0aec0" }}>No students found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!selectedCourse && !loading && (
        <div style={{ padding: 80, textAlign: "center", color: "#a0aec0", background: "white", borderRadius: 14 }}>
          Select a course above to view grades
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color, onClick }) {
  return (
    <div 
      onClick={onClick} 
      style={{ 
        background: "white", 
        padding: 24, 
        borderRadius: 16, 
        boxShadow: "0 4px 15px rgba(0,0,0,0.08)", 
        cursor: onClick ? "pointer" : "default" 
      }}
    >
      <div style={{ fontSize: 42, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 15, fontWeight: 600 }}>{label}</div>
    </div>
  );
}
function Students({ students, departments, onRefresh }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [filterDept, setFilterDept] = useState("");
  
  const [form, setForm] = useState({ 
    reg_no: "", 
    full_name: "", 
    email: "", 
    phone: "", 
    department_id: "1", 
    year_of_study: "1", 
    semester: "1", 
    program: "" 
  });

  const filtered = students.filter(s =>
    (s.full_name?.toLowerCase().includes(search.toLowerCase()) || 
     s.reg_no?.toLowerCase().includes(search.toLowerCase())) &&
    (filterDept === "" || s.department_id == filterDept)
  );

 const handleAdd = () => {
  if (!form.reg_no || !form.full_name) {
    return alert("Reg No and Full Name are required.");
  }

  console.log("Sending this data:", form);

  axios.post(`${API}/students`, form)
    .then((res) => { 
      alert("✅ Student added successfully!");
      setShowAdd(false); 
      setForm({ reg_no: "", full_name: "", email: "", phone: "", department_id: "", year_of_study: "1", semester: "1", program: "" }); 
      onRefresh(); 
    })
    .catch(e => {
      console.error("Full Error Object:", e);
      const msg = e.response?.data?.error || e.message || "Unknown error";
      alert("❌ Error: " + msg);
    });
};

  const handleDelete = (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    axios.delete(`${API}/students/${id}`)
      .then(() => onRefresh())
      .catch(() => alert("Could not delete student."));
  };

  // Dynamic programs based on selected school
  const selectedSchool = departments.find(d => String(d.id) === form.department_id);
  const availablePrograms = selectedSchool ? PWANI_PROGRAMS_BY_SCHOOL[selectedSchool.name] || [] : [];

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by name or reg no..." 
          style={{ flex: 1, minWidth: 250, padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0" }} />
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", minWidth: 200 }}>
          <option value="">All Schools</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button onClick={() => setShowAdd(!showAdd)}
          style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#0a3d62", color: "white", fontWeight: 700, cursor: "pointer" }}>
          + Add Student
        </button>
      </div>

      {showAdd && (
        <div style={{ background: "white", borderRadius: 14, padding: 24, marginBottom: 20, boxShadow: "0 4px 16px #0000001a" }}>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}>➕ Add New Student</div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>REG NO *</label>
              <input placeholder="e.g. S/CS/009/2025" value={form.reg_no} onChange={e => setForm({ ...form, reg_no: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>FULL NAME *</label>
              <input placeholder="e.g. Alice Muthoni Kamau" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0" }} />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>SCHOOL</label>
              <select value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0" }}>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>PROGRAMME</label>
              <select value={form.program} onChange={e => setForm({ ...form, program: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0" }}>
                <option value="">Select Programme</option>
                {availablePrograms.map((p, i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>YEAR OF STUDY</label>
              <select value={form.year_of_study} onChange={e => setForm({ ...form, year_of_study: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0" }}>
                {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>SEMESTER</label>
              <select value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0" }}>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <button onClick={handleAdd} style={{ padding: "12px 32px", borderRadius: 8, border: "none", background: "#0a3d62", color: "white", fontWeight: 700, marginRight: 12 }}>
              Save Student
            </button>
            <button onClick={() => setShowAdd(false)} style={{ padding: "12px 32px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "white" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "white", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px #0000000d" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f0f4f8" }}>
              {["Reg No", "Full Name", "School", "Programme", "Year", "Status", "Action"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#718096" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} style={{ borderTop: "1px solid #eee" }}>
                <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: 700 }}>{s.reg_no}</td>
                <td style={{ padding: "12px 16px", fontWeight: 600 }}>{s.full_name}</td>
                <td style={{ padding: "12px 16px" }}>{s.department_name}</td>
                <td style={{ padding: "12px 16px", fontWeight: 500, color: "#0a3d62" }}>
                  {s.program && s.program.trim() !== "" ? s.program : "—"}
                </td>
                <td style={{ padding: "12px 16px" }}>Year {s.year_of_study}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ background: "#eafaf1", color: "#1e8449", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                    {s.status}
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <button onClick={() => handleDelete(s.id, s.full_name)}
                    style={{ padding: "5px 14px", borderRadius: 6, border: "1.5px solid #f1948a", background: "#fdf2f2", color: "#c0392b", fontSize: 12, fontWeight: 700 }}>
                    🗑 Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function Courses({ courses, departments, onRefresh }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ 
    code: "", 
    name: "", 
    department_id: "1", 
    program: "", 
    year_of_study: "1", 
    semester: "1", 
    credits: "3" 
  });
  const handleDelete = (id, code) => {
    if (!window.confirm(`Delete course ${code}? This cannot be undone.`)) return;
    axios.delete(`${API}/courses/${id}`)
      .then(() => { alert("✅ Course deleted!"); onRefresh(); })
      .catch(() => alert("Could not delete course — it may have existing records."));
  };

  const handleAdd = () => {
    if (!form.code || !form.name) return alert("Code and Name are required.");
    
    axios.post(`${API}/courses`, form)
      .then(() => { 
        alert("✅ Course created successfully!"); 
        setShowAdd(false); 
        setForm({ code: "", name: "", department_id: "1", program: "", year_of_study: "1", semester: "1", credits: "3" }); 
        onRefresh(); 
      })
      .catch(e => alert("Error: " + (e.response?.data?.error || e.message)));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button onClick={() => setShowAdd(!showAdd)}
          style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#0a3d62", color: "white", fontWeight: 700 }}>
          + Add Course
        </button>
      </div>

      {showAdd && (
        <div style={{ background: "white", borderRadius: 14, padding: 24, marginBottom: 20, boxShadow: "0 4px 16px #0000001a" }}>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 20 }}>➕ Add New Course</div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>COURSE CODE *</label>
              <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>COURSE NAME *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>SCHOOL</label>
              <select value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value, program: "" })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0" }}>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            {/* Program Dropdown */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>PROGRAMME</label>
              <select value={form.program} onChange={e => setForm({ ...form, program: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0" }}>
                <option value="">Select Programme</option>
                {(() => {
                  const selectedSchool = departments.find(d => String(d.id) === String(form.department_id));
                  const schoolName = selectedSchool ? selectedSchool.name : "";
                  const programs = PWANI_PROGRAMS_BY_SCHOOL[schoolName] || [];
                  return programs.map((p, i) => <option key={i} value={p}>{p}</option>);
                })()}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>YEAR</label>
              <select value={form.year_of_study} onChange={e => setForm({ ...form, year_of_study: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0" }}>
                {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>SEMESTER</label>
              <select value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0" }}>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>CREDITS</label>
              <input type="number" value={form.credits} onChange={e => setForm({ ...form, credits: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0" }} />
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <button onClick={handleAdd} style={{ padding: "12px 32px", borderRadius: 8, border: "none", background: "#0a3d62", color: "white", fontWeight: 700, marginRight: 12 }}>
              Save Course
            </button>
            <button onClick={() => setShowAdd(false)} style={{ padding: "12px 32px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "white" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table - Add Program Column */}
      <div style={{ background: "white", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px #0000000d" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f0f4f8" }}>
              {["Code", "Course Name", "School", "Programme", "Year", "Sem", "Credits", "Enrolled", "Sessions", "Action"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#718096" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.map((c, i) => (
              <tr key={c.id} style={{ borderTop: "1px solid #f0f4f8", background: i % 2 === 0 ? "white" : "#fafbff" }}>
                <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: 800 }}>{c.code}</td>
                <td style={{ padding: "12px 16px", fontWeight: 600 }}>{c.name}</td>
                <td style={{ padding: "12px 16px" }}>{c.department_name}</td>
                <td style={{ padding: "12px 16px", color: "#0a3d62" }}>{c.program || "—"}</td>
                <td style={{ padding: "12px 16px" }}>Yr {c.year_of_study}</td>
                <td style={{ padding: "12px 16px" }}>S{c.semester}</td>
                <td style={{ padding: "12px 16px" }}>{c.credits}</td>
                <td style={{ padding: "12px 16px", fontWeight: 700 }}>{c.enrolled_count}</td>
                <td style={{ padding: "12px 16px" }}>{c.total_sessions}</td>
                <td style={{ padding: "12px 16px" }}>
                  <button onClick={() => handleDelete(c.id, c.code)} style={{ padding: "5px 14px", borderRadius: 6, border: "1.5px solid #f1948a", background: "#fdf2f2", color: "#c0392b", fontSize: 12, fontWeight: 700 }}>
                    🗑 Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function Attendance({ courses: initialCourses = [], students = [], userId, isLecturer }) {
  const [courses, setCourses] = useState(initialCourses);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isLecturer && userId) {
      axios.get(`${API}/lecturer/${userId}/dashboard`)
        .then(r => setCourses(r.data.courses || []))
        .catch(() => {});
    }
  }, [userId, isLecturer]);
  const [attMap, setAttMap] = useState({});
  const [selectedUnit, setSelectedUnit] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [uploadFile, setUploadFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [currentStudents, setCurrentStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const uploadedSessionIdRef = useRef(null);

  const getUnitName = (unit) => {
    if (!unit) return "Unknown Unit";
    if (typeof unit === "string") return unit;
    return unit.code ? `${unit.code} - ${unit.name || ''}` : (unit.name || "Untitled");
  };

  const getUnitId = (unit) => {
    if (!unit || typeof unit === "string") return null;
    return unit.id;
  };

  const loadStudentsForCourse = async (unit) => {
    const courseId = getUnitId(unit);
    if (!courseId) { setCurrentStudents([]); return; }
    setLoadingStudents(true);
    try {
      const res = await axios.get(`${API}/courses/${courseId}/students`);
      const studs = res.data || [];
      setCurrentStudents(studs);
      const m = {};
      studs.forEach(s => { m[s.id] = "present"; });
      setAttMap(m);
    } catch (err) {
      setCurrentStudents([]);
    }
    setLoadingStudents(false);
  };

  useEffect(() => {
    if (selectedUnit) loadStudentsForCourse(selectedUnit);
    else setCurrentStudents([]);
  }, [selectedUnit]);

  useEffect(() => {
    if (uploadFile) {
      const url = URL.createObjectURL(uploadFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [uploadFile]);

  const runOCR = async (filename, daysOverride) => {
    const courseId = getUnitId(selectedUnit);
    if (!courseId || !filename) return;
    setOcrLoading(true); setOcrResult(null);
    try {
      const res = await axios.post(`${API}/attendance/ocr`, { filename, course_id: courseId, days_held: daysOverride || 1 });
      setOcrResult(res.data);
      const m = {};
      res.data.results.forEach(r => { m[r.student_id] = r.status; });
      setAttMap(m);
      setStatusMsg(`✅ OCR complete! ${res.data.present_count} present, ${res.data.absent_count} absent detected. Review below and save.`);
    } catch (e) {
      setStatusMsg("❌ OCR failed: " + (e.response?.data?.error || e.message));
    }
    setOcrLoading(false);
  };

  const handleFileUpload = async () => {
    if (!uploadFile || !selectedUnit) return alert("Please select a course and file first.");
    setUploading(true);
    setStatusMsg("");
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("course_id", getUnitId(selectedUnit));
    formData.append("session_date", attendanceDate);
    try {
      const res = await axios.post(`${API}/attendance/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000
      });
      uploadedSessionIdRef.current = res.data.session_id || null;
      setStatusMsg("✅ Register uploaded! Running OCR...");
      setUploadFile(null);
      await runOCR(res.data.filename, 5);
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      if (err.code === 'ECONNABORTED' || errMsg?.toLowerCase().includes('timeout') || errMsg?.toLowerCase().includes('network')) {
        setStatusMsg("⚠️ Connection timed out but session may have saved. Check Previous Sessions below.");
      } else {
        setStatusMsg("❌ Upload failed: " + errMsg);
      }
    }
    setUploading(false);
  };

  const saveManualAttendance = async () => {
    if (!selectedUnit) {
      return alert("Please select a course first.");
    }
    setSaving(true);
    setStatusMsg("");
    try {
      const courseId = getUnitId(selectedUnit);
      let sessionId = uploadedSessionIdRef.current;

      // Find or create session
      if (!sessionId) {
        const sessRes = await axios.get(`${API}/courses/${courseId}/attendance-sessions`);
        const sessions = sessRes.data || [];
        const existingSession = sessions.find(s => s.session_date?.startsWith(attendanceDate));
        if (existingSession) {
          sessionId = existingSession.id;
        } else {
          const sessionRes = await axios.post(`${API}/attendance/sessions`, {
            course_id: courseId,
            session_date: attendanceDate,
            session_type: "lecture"
          });
          sessionId = sessionRes.data.id;
        }
      }

      const daysHeld = ocrResult?.days_held || 5;

      // CRITICAL: read the CURRENT ocrResult state at save time
      // ocrResult.results has been updated by the lecturer's checkbox clicks
      let records;
      if (ocrResult && Array.isArray(ocrResult.results) && ocrResult.results.length > 0) {
        records = ocrResult.results.map(r => {
          // Recalculate status from days_present — this is the source of truth
          const dp = typeof r.days_present === 'number' ? r.days_present : (r.status === 'present' ? daysHeld : 0);
          return {
            student_id: r.student_id,
            status: dp > 0 ? 'present' : 'absent',
            days_present: dp,
            days_held: daysHeld
          };
        });
      } else {
        // No OCR — use manual attMap
        records = currentStudents.map(s => ({
          student_id: s.id,
          status: attMap[s.id] || "absent",
          days_present: attMap[s.id] === "present" ? daysHeld : 0,
          days_held: daysHeld
        }));
      }

      if (!records || records.length === 0) {
        setStatusMsg("❌ No student records to save.");
        setSaving(false);
        return;
      }

      console.log("Saving records:", records);

      const response = await axios.put(
        `${API}/attendance/sessions/${sessionId}/records`,
        { records, days_held: daysHeld }
      );

      console.log("Save response:", response.data);

      uploadedSessionIdRef.current = null;
      setOcrResult(null);
      setStatusMsg("✅ Attendance saved! " +
        records.filter(r => r.status === 'present').length + " present, " +
        records.filter(r => r.status === 'absent').length + " absent.");

    } catch (err) {
      console.error("Save error:", err);
      setStatusMsg("❌ Failed to save: " + (err.response?.data?.error || err.message));
    }
    setSaving(false);
  };

  const presentCount = Object.values(attMap).filter(v => v === "present").length;
  const absentCount = Object.values(attMap).filter(v => v === "absent").length;
  const lateCount = Object.values(attMap).filter(v => v === "late").length;

  return (
    <div style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 4px 15px rgba(0,0,0,0.08)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>📋 Take Attendance</h2>
        <div style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>{attendanceDate}</div>
      </div>

      {/* Course + Date */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, marginBottom: 20, alignItems: "end" }}>
        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 700, fontSize: 12, color: "#718096" }}>SELECT COURSE / UNIT</label>
          <select
            value={selectedUnit ? JSON.stringify(selectedUnit) : ""}
            onChange={(e) => {
              try { setSelectedUnit(JSON.parse(e.target.value)); }
              catch { setSelectedUnit(e.target.value); }
            }}
            style={{ padding: "12px 16px", fontSize: 14, borderRadius: 8, border: "1.5px solid #e2e8f0", width: "100%" }}
          >
            <option value="">— Select a course —</option>
            {courses.map((unit, i) => (
              <option key={i} value={JSON.stringify(unit)}>{getUnitName(unit)}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 700, fontSize: 12, color: "#718096" }}>SESSION DATE</label>
          <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)}
            style={{ padding: "12px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14 }} />
        </div>
      </div>

      {/* OCR Upload — PRIMARY METHOD */}
      <div style={{ background: "linear-gradient(135deg,#eaf4fb,#f0f9ff)", border: "2px solid #85c1e9", borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4, color: "#0a3d62" }}>
          🤖 Upload Scanned Register — Auto-detect Attendance
        </div>
        <div style={{ fontSize: 13, color: "#718096", marginBottom: 14 }}>
          Upload a photo or scan of the signed attendance register. OCR will automatically mark students present or absent based on their signatures.
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input type="file" accept="image/*,.pdf,.tiff"
            onChange={(e) => setUploadFile(e.target.files[0])}
            style={{ flex: 1, padding: "9px", borderRadius: 8, border: "1.5px solid #85c1e9", fontSize: 13, background: "white" }} />
          <button onClick={handleFileUpload}
            disabled={uploading || ocrLoading || !uploadFile || !selectedUnit}
            style={{ padding: "11px 24px", background: (uploading || ocrLoading || !uploadFile || !selectedUnit) ? "#a0aec0" : "#0a3d62", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }}>
            {uploading ? "⬆ Uploading..." : ocrLoading ? "🔍 Reading..." : "⬆ Upload & Read"}
          </button>
        </div>
        <div style={{ fontSize: 12, color: "#c0392b", marginTop: 10, fontWeight: 600 }}>
          ✍️ Signature on register = Present &nbsp;&nbsp; ✗ or blank = Absent
        </div>

        {previewUrl && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>📄 Register Preview:</div>
            <img src={previewUrl} alt="register preview"
              style={{ maxWidth: "100%", maxHeight: 300, border: "1px solid #85c1e9", borderRadius: 8 }} />
          </div>
        )}
      </div>
{/* Print Attendance Sheet */}
      {selectedUnit && (
        <div style={{ background: "linear-gradient(135deg,#eafaf1,#f0fff4)", border: "2px solid #82e0aa", borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#1e8449", marginBottom: 4 }}>🖨️ Print Attendance Sheet</div>
            <div style={{ fontSize: 12, color: "#718096" }}>Download PDF with all enrolled students pre-printed. Print and bring to class.</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#1e8449" }}>WEEK NO.</label>
              <input
                type="number" min="1" max="15"
                defaultValue="1"
                id={`weekInput_sidebar_${getUnitId(selectedUnit)}`}
                style={{ width: 60, padding: "6px 8px", borderRadius: 6, border: "1.5px solid #82e0aa", fontSize: 14, fontWeight: 700, textAlign: "center" }}
              />
            </div>
            <button
              onClick={() => {
                const courseId = getUnitId(selectedUnit);
                const week = document.getElementById(`weekInput_sidebar_${courseId}`)?.value || 1;
                window.open(`http://127.0.0.1:5000/api/courses/${courseId}/attendance-sheet?week=${week}`, '_blank');
              }}
              style={{ padding: "10px 22px", borderRadius: 8, border: "none", background: "#1e8449", color: "white", fontWeight: 800, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
              ⬇️ Download PDF Sheet
            </button>
          </div>
        </div>
      )}
      {/* Status Messages */}
      {statusMsg && (
        <div style={{ padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontWeight: 600, fontSize: 13,
          background: statusMsg.startsWith("✅") ? "#eafaf1" : "#fdf2f2",
          color: statusMsg.startsWith("✅") ? "#1e8449" : "#c0392b",
          border: `1px solid ${statusMsg.startsWith("✅") ? "#82e0aa" : "#f1948a"}` }}>
          {statusMsg}
        </div>
      )}

      {ocrLoading && (
        <div style={{ background: "#f0f4f8", borderRadius: 8, padding: "14px 16px", marginBottom: 16, fontSize: 13, color: "#718096", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🔍</span> Reading attendance register... please wait.
        </div>
      )}

      {ocrResult && (
        <div style={{ background: "#eaf4fb", border: "1px solid #85c1e9", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#0a3d62", marginBottom: 8 }}>🤖 OCR Result</div>
          <div style={{ display: "flex", gap: 20, fontSize: 14 }}>
            <span>✅ <strong style={{ color: "#1e8449" }}>{ocrResult.present_count} Present</strong></span>
            <span>❌ <strong style={{ color: "#c0392b" }}>{ocrResult.absent_count} Absent</strong></span>
            <span>👥 <strong>{ocrResult.total} Total</strong></span>
          </div>
          <div style={{ fontSize: 12, color: "#718096", marginTop: 6 }}>
            Review the list below — adjust any incorrect readings — then click Save.
          </div>
        </div>
      )}

      {/* Students enrolled count */}
      {selectedUnit && (
        <div style={{ marginBottom: 14, padding: "12px 16px", background: "#ecfdf5", borderRadius: 10, border: "1px solid #10b981", fontSize: 14 }}>
          <strong>👥 Enrolled:</strong> {currentStudents.length} students in {getUnitName(selectedUnit)}
          {currentStudents.length > 0 && (
            <span style={{ marginLeft: 16, fontSize: 13, color: "#718096" }}>
              Present: <strong style={{ color: "#1e8449" }}>{presentCount}</strong> &nbsp;|&nbsp;
              Absent: <strong style={{ color: "#c0392b" }}>{absentCount}</strong> &nbsp;|&nbsp;
              Late: <strong style={{ color: "#e67e22" }}>{lateCount}</strong>
            </span>
          )}
        </div>
      )}

      {/* Policy reminder */}
      <div style={{ background: "#fff8e1", border: "1px solid #f9ca5a", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
        ⚠️ <strong>Attendance Alert:</strong> Low attendance flags a student for review — but always cross-check with their performance. Absence alone does not mean failure.
      </div>

      {/* Student List */}
      {loadingStudents ? (
        <div style={{ padding: 40, textAlign: "center", color: "#a0aec0" }}>Loading students...</div>
      ) : currentStudents.length > 0 ? (
        <>
          {ocrResult ? (
            <>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    {["#", "Reg No", "Student Name", "Days Present This Week", "Status"].map(h => (
                      <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#718096", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ocrResult.results.map((r, i) => (
                    <tr key={r.student_id} style={{ borderBottom: "1px solid #f1f5f9", background: r.status === "absent" ? "#fff5f5" : "white" }}>
                      <td style={{ padding: "11px 14px", fontSize: 12, color: "#a0aec0" }}>{i + 1}</td>
                      <td style={{ padding: "11px 14px", fontFamily: "monospace", fontWeight: 700, color: "#0a3d62", fontSize: 13 }}>{r.reg_no}</td>
                      <td style={{ padding: "11px 14px", fontWeight: 600 }}>{r.full_name}</td>
                      <td style={{ padding: "11px 14px" }}>
                        {(() => {
                          const daysHeld = ocrResult?.days_held || 1;
                          const daysPresent = r.days_present ?? (r.status === "present" ? daysHeld : 0);
                          const LABELS = ["M","T","W","T","F"];
                          return (
                            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                              {Array.from({ length: daysHeld }).map((_, di) => {
                                const attended = di < daysPresent;
                                return (
                                  <div key={di}
                                    title={`Day ${di + 1} — click to toggle`}
                                    onClick={() => {
                                      const newDays = attended ? di : di + 1;
                                      const updated = ocrResult.results.map(s =>
                                        s.student_id === r.student_id
                                          ? { ...s, days_present: newDays, status: newDays > 0 ? 'present' : 'absent' }
                                          : s
                                      );
                                      setOcrResult({ ...ocrResult,
                                        results: updated,
                                        present_count: updated.filter(s => s.status === 'present').length,
                                        absent_count: updated.filter(s => s.status === 'absent').length
                                      });
                                    }}
                                    style={{ width: 28, height: 28, borderRadius: 6, cursor: "pointer", border: `2px solid ${attended ? "#1e8449" : "#e2e8f0"}`, background: attended ? "#1e8449" : "#f8fafc", transition: "all 0.15s", userSelect: "none" }}>
                                  </div>
                                );
                              })}
                              <span style={{ fontSize: 12, fontWeight: 700, color: daysPresent > 0 ? "#1e8449" : "#c0392b", marginLeft: 4 }}>
                                {daysPresent}/{daysHeld}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        {(() => {
                          const daysHeld = ocrResult?.days_held || 1;
                          const daysPresent = r.days_present ?? (r.status === "present" ? daysHeld : 0);
                          const pct = daysHeld > 0 ? Math.round((daysPresent / daysHeld) * 100) : 0;
                          const color = pct === 100 ? "#1e8449" : pct > 0 ? "#e67e22" : "#c0392b";
                          const bg = pct === 100 ? "#eafaf1" : pct > 0 ? "#fef9e7" : "#fdf2f2";
                          return (
                            <span style={{ background: bg, color, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 }}>
                              {daysPresent === 0 ? "❌ Absent" : pct === 100 ? "✅ Full" : `⚠️ ${daysPresent}/${daysHeld} days`}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={saveManualAttendance} disabled={saving}
                style={{ width: "100%", padding: "14px 0", background: saving ? "#94a3b8" : "#0a3d62", color: "white", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Saving..." : "💾 Save Weekly Attendance"}
              </button>
            </>
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: "#a0aec0", background: "#f8fafc", borderRadius: 10 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
              <div style={{ fontWeight: 700, color: "#4a5568", marginBottom: 6 }}>{currentStudents.length} students enrolled</div>
              <div style={{ fontSize: 13 }}>Upload the signed weekly register above to view and save attendance.</div>
            </div>
          )}
        </>
      ) : (
        <div style={{ padding: 80, textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: 12 }}>
          {selectedUnit ? "No students enrolled in this course yet." : "Select a course above to begin."}
        </div>
      )}
    </div>
  );
}
function Assignments({ courses: initialCourses = [], userId, isLecturer }) {
  const [courses, setCourses] = useState(initialCourses);
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    if (isLecturer && userId) {
      axios.get(`${API}/lecturer/${userId}/dashboard`)
        .then(r => setCourses(r.data.courses || []))
        .catch(() => {});
    }
  }, [userId, isLecturer]);
  const [assessments, setAssessments] = useState([]);
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [assForm, setAssForm] = useState({ title: "", type: "cat", max_score: "30" });
  const [assMsg, setAssMsg] = useState("");

  const loadCourseData = async (course) => {
    if (!course?.id) return;

    setSelectedCourse(course);
    setLoading(true);
    setError("");

    try {
      const [studentsRes, assRes] = await Promise.all([
        axios.get(`${API}/courses/${course.id}/students`),
        axios.get(`${API}/assignments?course_id=${course.id}`)
      ]);

      setStudents(studentsRes.data || []);
      setAssessments(assRes.data || []);

      // Load existing scores from backend
      const studs = studentsRes.data || [];
      const ass = assRes.data || [];
      const scoreMap = {};
      studs.forEach(s => { scoreMap[s.id] = {}; });
      for (const a of ass) {
        try {
          const scRes = await axios.get(`${API}/assignments/${a.id}/scores`);
          (scRes.data || []).forEach(sub => {
            if (sub.score !== null && sub.score !== undefined && scoreMap[sub.student_id] !== undefined) {
              scoreMap[sub.student_id][a.id] = sub.score;
            }
          });
        } catch(e) { console.error('score load failed', e); }
      }
      setScores(scoreMap);

    } catch (err) {
      console.error(err);
      setError("Failed to load students. Make sure students are enrolled in this course.");
    }
    setLoading(false);
  };

  const handleScoreChange = (studentId, assessmentId, value) => {
    setScores(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [assessmentId]: value === "" ? null : parseFloat(value)
      }
    }));
  };

  const saveAllScores = async () => {
    if (!selectedCourse) return alert("Please select a course");

    try {
      let savedCount = 0;
      for (const [studentId, studentScores] of Object.entries(scores)) {
        for (const [assId, score] of Object.entries(studentScores)) {
          if (score !== null && score !== undefined) {
            await axios.put(`${API}/assignments/${assId}/scores`, {
              scores: [{ student_id: Number(studentId), score }]
            });
            savedCount++;
          }
        }
      }
      alert(`✅ ${savedCount} scores saved successfully!`);
      await loadCourseData(selectedCourse); // Refresh data
    } catch (err) {
      alert("Error saving scores: " + (err.response?.data?.error || err.message));
    }
  };

  const createNewAssessment = async () => {
    if (!assForm.title.trim()) { setAssMsg("❌ Title is required."); return; }
    try {
      await axios.post(`${API}/assignments`, {
        course_id: selectedCourse.id,
        title: assForm.title.trim(),
        type: assForm.type,
        max_score: parseInt(assForm.max_score) || 30
      });
      setAssMsg("✅ Assessment created!");
      setShowForm(false);
      setAssForm({ title: "", type: "cat", max_score: "30" });
      loadCourseData(selectedCourse);
    } catch (e) {
      setAssMsg("❌ Failed: " + (e.response?.data?.error || e.message));
    }
  };

  return (
    <div>
      <h2>📝 Assessments & Grading</h2>

      {/* Course Selection */}
      <div style={{ background: "white", borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: "0 2px 8px #0000000d" }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12, color: "#1a202c" }}>📚 Select Course to Manage Assessments</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {courses.length === 0 ? (
            <div style={{ color: "#a0aec0", fontSize: 13 }}>No courses assigned. Contact admin.</div>
          ) : courses.map(c => (
            <button key={c.id} onClick={() => loadCourseData(c)}
              style={{ padding: "10px 18px", borderRadius: 30, border: `2px solid ${selectedCourse?.id === c.id ? "#0a3d62" : "#e2e8f0"}`, background: selectedCourse?.id === c.id ? "#0a3d62" : "white", color: selectedCourse?.id === c.id ? "white" : "#374151", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {c.code}
              {selectedCourse?.id === c.id && <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.8 }}>✓ Selected</span>}
            </button>
          ))}
        </div>
        {selectedCourse && (
          <div style={{ marginTop: 12, padding: "8px 14px", background: "#eaf4fb", borderRadius: 8, fontSize: 13, color: "#0a3d62", fontWeight: 600 }}>
            📝 Managing: <strong>{selectedCourse.code} — {selectedCourse.name}</strong> &nbsp;|&nbsp;
            CATs + Assignments = <strong>30 marks</strong> &nbsp;|&nbsp; Exam = <strong>70 marks</strong> &nbsp;|&nbsp; Total = <strong>100 marks</strong>
          </div>
        )}
      </div>

      {selectedCourse && (
        <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 4px 15px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3>{selectedCourse.code} - {selectedCourse.name}</h3>
            <div>
              <button onClick={() => { setShowForm(!showForm); setAssMsg(""); }} style={{ marginRight: 12, padding: "10px 20px", background: "#148f77", color: "white", border: "none", borderRadius: 8 }}>
                {showForm ? "✕ Cancel" : "+ New Assessment"}
              </button>
              <button onClick={saveAllScores} style={{ padding: "10px 24px", background: "#0a3d62", color: "white", border: "none", borderRadius: 8, fontWeight: 700 }}>
                💾 Save All Scores
              </button>
            </div>
          </div>

          {assMsg && <div style={{ padding: "10px 14px", borderRadius: 8, background: assMsg.startsWith("✅") ? "#eafaf1" : "#fdf2f2", color: assMsg.startsWith("✅") ? "#1e8449" : "#c0392b", fontWeight: 600, fontSize: 13, marginBottom: 12 }}>{assMsg}</div>}
          {showForm && (
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>➕ New Assessment</div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#718096", display: "block", marginBottom: 4 }}>TITLE *</label>
                  <input placeholder="e.g. CAT 1, Assignment 1, End Semester Exam" value={assForm.title}
                    onChange={e => setAssForm({...assForm, title: e.target.value})}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#718096", display: "block", marginBottom: 4 }}>TYPE</label>
                  <select value={assForm.type} onChange={e => setAssForm({...assForm, type: e.target.value})}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13 }}>
                    <option value="cat">CAT</option>
                    <option value="assignment">Assignment</option>
                    <option value="exam">Exam</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#718096", display: "block", marginBottom: 4 }}>MAX SCORE</label>
                  <input type="number" min="1" max="100" value={assForm.max_score}
                    onChange={e => setAssForm({...assForm, max_score: e.target.value})}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }} />
                </div>
                <button onClick={createNewAssessment}
                  style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#0a3d62", color: "white", fontWeight: 700, cursor: "pointer" }}>
                  Save
                </button>
              </div>
            </div>
          )}
          {error && <div style={{ color: "red", background: "#fee2e2", padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}

          {loading ? (
            <p>Loading students...</p>
          ) : students.length === 0 ? (
            <p>No students enrolled in this course yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ padding: 14, textAlign: "left" }}>Reg No</th>
                    <th style={{ padding: 14, textAlign: "left" }}>Student Name</th>
                    {assessments.map(a => (
                      <th key={a.id} style={{ padding: 12, textAlign: "center", minWidth: 140 }}>
                        {a.title}<br />
                        <small style={{ color: "#666" }}>({a.type?.toUpperCase()}) • {a.max_score}</small>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id} style={{ borderTop: "1px solid #eee" }}>
                      <td style={{ padding: 14, fontFamily: "monospace", fontWeight: 700 }}>{student.reg_no}</td>
                      <td style={{ padding: 14, fontWeight: 600 }}>{student.full_name}</td>
                      {assessments.map(ass => (
                        <td key={ass.id} style={{ padding: 12, textAlign: "center" }}>
                          <input
                            type="number"
                            min="0"
                            max={ass.max_score}
                            value={scores[student.id]?.[ass.id] ?? ""}
                            onChange={(e) => handleScoreChange(student.id, ass.id, e.target.value)}
                            style={{ width: 90, padding: 8, textAlign: "center", border: "1.5px solid #e2e8f0", borderRadius: 6 }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
          }
        </div>
      )}

      {!selectedCourse && (
        <div style={{ textAlign: "center", padding: 100, color: "#64748b", background: "white", borderRadius: 16 }}>
          Select a course above to view students and enter scoress
        </div>
      )}
    </div>
  );
}
function Insights({ students, user, isAdmin, lecturerCourses }) {
  const [atRisk, setAtRisk] = useState({ attendance_risk: [], performance_risk: [] });
  const [tab, setTab] = useState("attendance");

  useEffect(() => {
    const url = isAdmin ? `${API}/analytics/at-risk` : `${API}/analytics/at-risk?lecturer_id=${user?.id}`;
    axios.get(url).then(r => setAtRisk(r.data)).catch(() => {});
  }, [user, isAdmin]);

  const TabBtn = ({ id, label, count, color }) => (
    <button onClick={() => setTab(id)}
      style={{ padding: "10px 20px", borderRadius: 8, border: `2px solid ${tab === id ? color : "#e2e8f0"}`, background: tab === id ? color : "white", color: tab === id ? "white" : "#4a5568", fontWeight: 700, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
      {label}
      <span style={{ background: tab === id ? "rgba(255,255,255,0.3)" : color + "22", color: tab === id ? "white" : color, borderRadius: 20, padding: "1px 8px", fontSize: 12, fontWeight: 900 }}>{count}</span>
    </button>
  );

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Attendance Risk", value: atRisk.attendance_risk.length, color: "#c0392b", icon: "📋", bg: "#fdf2f2" },
          { label: "Performance Risk", value: atRisk.performance_risk.length, color: "#e67e22", icon: "📉", bg: "#fef9e7" },
          { label: isAdmin ? "Total Students" : "My Students", value: isAdmin ? students.length : new Set([...atRisk.attendance_risk.map(s => s.student_id), ...atRisk.performance_risk.map(s => s.student_id)]).size, color: "#0a3d62", icon: "🎓", bg: "#eaf4fb" },
          { label: "At Risk (Combined)", value: new Set([...atRisk.attendance_risk.map(s => String(s.student_id)), ...atRisk.performance_risk.map(s => String(s.student_id))]).size, color: "#7d3c98", icon: "⚠️", bg: "#f5eef8" },
        ].map((c, i) => (
          <div key={i} style={{ background: c.bg, borderRadius: 14, padding: "18px 20px", border: `1px solid ${c.color}33`, display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ fontSize: 28 }}>{c.icon}</span>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: 12, color: "#718096" }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <TabBtn id="attendance" label="🚨 Attendance Risk" count={atRisk.attendance_risk.length} color="#c0392b" />
        <TabBtn id="performance" label="📉 Performance Risk" count={atRisk.performance_risk.length} color="#e67e22" />
      </div>

      {/* Attendance Risk Table */}
      {tab === "attendance" && (
        <div style={{ background: "white", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px #0000000d" }}>
          <div style={{ padding: "14px 18px", background: "#fdf2f2", borderBottom: "1px solid #f1948a" }}>
            <div style={{ fontWeight: 800, color: "#c0392b", fontSize: 15 }}>⚠️ Attendance Alert — Verify Against Performance</div>
            <div style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>These students have low attendance — but check the Att ≠ Perf tab before intervening. Some may be performing well despite absences.</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f0f4f8" }}>
                {["Reg No", "Student Name", "Course", "Sessions Attended", "Total Sessions", "Attendance %", "Status"].map(h => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#718096", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {atRisk.attendance_risk.map((s, i) => (
                <tr key={i} style={{ borderTop: "1px solid #f0f4f8", background: i % 2 === 0 ? "white" : "#fafbff" }}>
                  <td style={{ padding: "11px 16px", fontFamily: "monospace", color: "#0a3d62", fontWeight: 700, fontSize: 13 }}>{s.reg_no}</td>
                  <td style={{ padding: "11px 16px", fontWeight: 600 }}>{s.full_name}</td>
                  <td style={{ padding: "11px 16px", fontSize: 13 }}>
                    <span style={{ background: "#eaf4fb", color: "#1a6b8a", borderRadius: 6, padding: "2px 8px", fontWeight: 700, fontSize: 12 }}>{s.course_code}</span>
                    <span style={{ fontSize: 12, color: "#718096", marginLeft: 6 }}>{s.course_name}</span>
                  </td>
                  <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: 700 }}>{s.sessions_attended}</td>
                  <td style={{ padding: "11px 16px", fontSize: 13 }}>{s.total_sessions}</td>
                  <td style={{ padding: "11px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 80, height: 6, background: "#f0f4f8", borderRadius: 3 }}>
                        <div style={{ width: `${s.attendance_percentage}%`, height: "100%", background: s.attendance_percentage < 50 ? "#c0392b" : "#e67e22", borderRadius: 3 }} />
                      </div>
                      <span style={{ fontWeight: 800, color: s.attendance_percentage < 50 ? "#c0392b" : "#e67e22", fontSize: 14 }}>{s.attendance_percentage}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <span style={{ background: s.attendance_percentage < 50 ? "#fdf2f2" : "#fef9e7", color: s.attendance_percentage < 50 ? "#c0392b" : "#e67e22", border: `1px solid ${s.attendance_percentage < 50 ? "#f1948a" : "#f8c471"}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                      {s.attendance_percentage < 50 ? "🚨 Critical" : "⚠️ At Risk"}
                    </span>
                  </td>
                </tr>
              ))}
              {atRisk.attendance_risk.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 50, color: "#a0aec0", fontSize: 14 }}>🎉 No attendance risk students found!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Performance Risk Table */}
      {tab === "performance" && (
        <div style={{ background: "white", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px #0000000d" }}>
          <div style={{ padding: "14px 18px", background: "#fef9e7", borderBottom: "1px solid #f8c471" }}>
            <div style={{ fontWeight: 800, color: "#e67e22", fontSize: 15 }}>📉 Students Below 50% Performance</div>
            <div style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>Students scoring below 40% per unit are failing — below 50% are at risk</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f0f4f8" }}>
                {["Reg No", "Student Name", "Course", "CAT Average", "Exam Score", "Final Score", "Status"].map(h => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#718096", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {atRisk.performance_risk.map((s, i) => (
                <tr key={i} style={{ borderTop: "1px solid #f0f4f8", background: i % 2 === 0 ? "white" : "#fafbff" }}>
                  <td style={{ padding: "11px 16px", fontFamily: "monospace", color: "#0a3d62", fontWeight: 700, fontSize: 13 }}>{s.reg_no}</td>
                  <td style={{ padding: "11px 16px", fontWeight: 600 }}>{s.full_name}</td>
                  <td style={{ padding: "11px 16px", fontSize: 13 }}>
                    <span style={{ background: "#eaf4fb", color: "#1a6b8a", borderRadius: 6, padding: "2px 8px", fontWeight: 700, fontSize: 12 }}>{s.course_code}</span>
                    <span style={{ fontSize: 12, color: "#718096", marginLeft: 6 }}>{s.course_name}</span>
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <span style={{ fontWeight: 800, color: (s.cat_average || 0) < 40 ? "#c0392b" : "#e67e22", fontSize: 14 }}>{s.cat_average || "—"}</span>
                    <span style={{ fontSize: 11, color: "#a0aec0" }}>/100</span>
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <span style={{ fontWeight: 800, color: (s.exam_score || 0) < 40 ? "#c0392b" : "#e67e22", fontSize: 14 }}>{s.exam_score || "—"}</span>
                    <span style={{ fontSize: 11, color: "#a0aec0" }}>/100</span>
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 80, height: 6, background: "#f0f4f8", borderRadius: 3 }}>
                        <div style={{ width: `${s.final_score}%`, height: "100%", background: s.final_score < 40 ? "#c0392b" : "#e67e22", borderRadius: 3 }} />
                      </div>
                      <span style={{ fontWeight: 800, color: s.final_score < 40 ? "#c0392b" : "#e67e22", fontSize: 14 }}>{s.final_score}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <span style={{ background: s.performance_status === "failing" ? "#fdf2f2" : "#fef9e7", color: s.performance_status === "failing" ? "#c0392b" : "#e67e22", border: `1px solid ${s.performance_status === "failing" ? "#f1948a" : "#f8c471"}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                      {s.performance_status === "failing" ? "🚨 Failing (<40%)" : "⚠️ At Risk (<50%)"}
                    </span>
                  </td>
                </tr>
              ))}
              {atRisk.performance_risk.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 50, color: "#a0aec0", fontSize: 14 }}>🎉 No performance risk students found!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
function Enrollments({ courses = [] }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load enrolled students
  useEffect(() => {
    if (!selectedCourse?.id) return;
    setLoading(true);
    axios.get(`${API}/courses/${selectedCourse.id}/students`)
      .then(res => setEnrolledStudents(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedCourse]);

  const openManual = async () => {
    setShowManual(true);
    try {
      const res = await axios.get(`${API}/students`);
      setAllStudents(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const enrollStudent = async (studentId) => {
    try {
      await axios.post(`${API}/enrollments`, {
        student_id: studentId,
        course_id: selectedCourse.id
      });
      
      alert("✅ Student enrolled successfully!");

      // Refresh enrolled list
      const res = await axios.get(`${API}/courses/${selectedCourse.id}/students`);
      setEnrolledStudents(res.data || []);
    } catch (err) {
      alert("Failed to enroll student. Check console (F12).");
      console.error(err);
    }
  };

  const filteredEnrolled = enrolledStudents.filter(s => 
    (s.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.reg_no || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: 24 }}>
      <h2>Enroll</h2>
      <p style={{ color: "#718096", marginBottom: 24 }}>Assign students to courses</p>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Select Course</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {courses.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCourse(c)}
              style={{
                padding: "10px 20px",
                borderRadius: 30,
                border: selectedCourse?.id === c.id ? "2px solid #0a3d62" : "1px solid #e2e8f0",
                background: selectedCourse?.id === c.id ? "#0a3d62" : "white",
                color: selectedCourse?.id === c.id ? "white" : "#374151",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {c.code} - {c.name}
            </button>
          ))}
        </div>
      </div>

      {selectedCourse && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3>Enrolled in {selectedCourse.code} - {selectedCourse.name}</h3>
            <button onClick={openManual} style={{ padding: "10px 20px", background: "#0a3d62", color: "white", border: "none", borderRadius: 8 }}>
              + Manual Enroll
            </button>
          </div>

          {loading ? <p>Loading...</p> : filteredEnrolled.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ padding: 12, textAlign: "left" }}>Reg No</th>
                  <th style={{ padding: 12, textAlign: "left" }}>Student Name</th>
                  <th style={{ padding: 12, textAlign: "left" }}>Program</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnrolled.map(s => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: 12 }}>{s.reg_no}</td>
                    <td style={{ padding: 12 }}>{s.full_name}</td>
                    <td style={{ padding: 12 }}>{s.program || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: "center", padding: 80, color: "#666" }}>
              No students enrolled yet.
            </p>
          )}
        </>
      )}

      {/* Manual Enroll Modal */}
      {showManual && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", padding: 24, borderRadius: 12, width: "90%", maxWidth: 700, maxHeight: "85vh", overflow: "auto" }}>
            <h3>Manual Enroll to {selectedCourse?.code}</h3>
            
            <input 
              type="text" 
              placeholder="Search by name or Reg No..." 
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", padding: 12, margin: "15px 0", borderRadius: 8 }}
            />

            <div style={{ maxHeight: "60vh", overflow: "auto" }}>
              {allStudents
                .filter(s => !enrolledStudents.some(es => es.id === s.id))
                .filter(s => !selectedCourse?.program || !s.program ||
                  s.program?.toLowerCase().trim() === selectedCourse?.program?.toLowerCase().trim())
                .filter(s =>
                  !searchTerm ||
                  (s.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (s.reg_no || "").toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(student => (
                  <div key={student.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px", borderBottom: "1px solid #eee" }}>
                    <div>
                      <strong>{student.reg_no}</strong> — {student.full_name}
                      <div style={{ fontSize: 13, color: "#666" }}>{student.program}</div>
                    </div>
                    <button 
                      onClick={() => enrollStudent(student.id)}
                      style={{ padding: "8px 20px", background: "#0a3d62", color: "white", border: "none", borderRadius: 6 }}
                    >
                      Enroll
                    </button>
                  </div>
                ))}
            </div>

            <button onClick={() => setShowManual(false)} style={{ marginTop: 20 }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
function LecturersAdmin({ courses = [] }) {
  const [lecturers, setLecturers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [form, setForm] = useState({ 
    staff_no: "", 
    full_name: "", 
    email: "", 
    department_id: "1", 
    assigned_courses: [] 
  });

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const loadLecturers = () => {
    axios.get(`${API}/lecturers`).then(r => setLecturers(r.data)).catch(() => {});
  };

  useEffect(() => {
    loadLecturers();
    axios.get(`${API}/departments`).then(r => setDepartments(r.data)).catch(() => {});
  }, []);

  const filteredLecturers = lecturers.filter(l => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      (l.full_name || "").toLowerCase().includes(search) || 
      (l.staff_no || "").toLowerCase().includes(search) ||
      (l.email || "").toLowerCase().includes(search);

    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && l.is_active) || 
      (statusFilter === "inactive" && !l.is_active);

    return matchesSearch && matchesStatus;
  });

  // Save (Add or Update)
  const saveLecturer = () => {
    if (!form.staff_no || !form.full_name || !form.email) {
      return setError("Staff Number, Full Name and Email are required!");
    }

    const payload = { ...form };

    if (editingLecturer) {
      axios.put(`${API}/lecturers/${editingLecturer.id}`, payload)
        .then(() => {
          setMsg("✅ Lecturer updated successfully!");
          setShowAdd(false);
          setEditingLecturer(null);
          loadLecturers();
        })
        .catch(() => setError("Failed to update lecturer."));
    } else {
      axios.post(`${API}/admin/register-lecturer`, payload)
        .then(() => {
          setMsg("✅ Lecturer registered successfully!");
          setShowAdd(false);
          setForm({ staff_no: "", full_name: "", email: "", department_id: "1", assigned_courses: [] });
          loadLecturers();
        })
        .catch(() => setError("Failed to register lecturer."));
    }
  };

  const openEdit = (lecturer) => {
    setEditingLecturer(lecturer);
    setForm({
      staff_no: lecturer.staff_no || "",
      full_name: lecturer.full_name || "",
      email: lecturer.email || "",
      department_id: lecturer.department_id || "1",
      assigned_courses: lecturer.assigned_courses || []
    });
    setShowAdd(true);
  };

  const addCourseToLecturer = (lecturer) => {
    setEditingLecturer(lecturer);
    setForm({
      staff_no: lecturer.staff_no || "",
      full_name: lecturer.full_name || "",
      email: lecturer.email || "",
      department_id: lecturer.department_id || "1",
      assigned_courses: lecturer.assigned_courses || []
    });
    setShowAdd(true);
  };

  const toggleCourse = (courseName) => {
    const current = form.assigned_courses || [];
    const exists = current.some(c => (typeof c === "string" ? c : c.name) === courseName);
    if (exists) {
      setForm({ ...form, assigned_courses: current.filter(c => (typeof c === "string" ? c : c.name) !== courseName) });
    } else {
      setForm({ ...form, assigned_courses: [...current, courseName] });
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2>👨‍🏫 Manage Lecturers</h2>
        <button onClick={() => {
          setShowAdd(true);
          setEditingLecturer(null);
          setForm({ staff_no: "", full_name: "", email: "", department_id: "1", assigned_courses: [] });
        }} style={{ padding: "10px 20px", background: "#0a3d62", color: "white", border: "none", borderRadius: 8 }}>
          + Register New Lecturer
        </button>
      </div>

      {/* Messages */}
      {msg && <div style={{ padding: 12, background: "#d1fae5", color: "#166534", borderRadius: 8, marginBottom: 16 }}>{msg}</div>}
      {error && <div style={{ padding: 12, background: "#fee2e2", color: "#b91c1c", borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {/* Search */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input type="text" placeholder="Search lecturers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Add/Edit Form */}
      {showAdd && (
        <div style={{ background: "#f8fafc", padding: 24, borderRadius: 12, marginBottom: 30, border: "1px solid #e2e8f0" }}>
          <h3>{editingLecturer ? "Edit Lecturer" : "Register New Lecturer"}</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#718096" }}>STAFF NUMBER {!editingLecturer && "*"}</label>
              {editingLecturer ? (
                <div style={{ padding:"10px 12px", marginTop:6, background:"#f8fafc", borderRadius:8, border:"1px solid #e2e8f0", fontSize:14, fontWeight:600 }}>{form.staff_no || "—"}</div>
              ) : (
                <input value={form.staff_no} onChange={e => setForm({...form, staff_no: e.target.value})} style={{width:"100%", padding:12, marginTop:6, borderRadius:8, border:"1.5px solid #e2e8f0", boxSizing:"border-box"}} />
              )}
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#718096" }}>FULL NAME {!editingLecturer && "*"}</label>
              {editingLecturer ? (
                <div style={{ padding:"10px 12px", marginTop:6, background:"#f8fafc", borderRadius:8, border:"1px solid #e2e8f0", fontSize:14, fontWeight:600 }}>{form.full_name || "—"}</div>
              ) : (
                <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} style={{width:"100%", padding:12, marginTop:6, borderRadius:8, border:"1.5px solid #e2e8f0", boxSizing:"border-box"}} />
              )}
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#718096" }}>EMAIL {!editingLecturer && "*"}</label>
              {editingLecturer ? (
                <div style={{ padding:"10px 12px", marginTop:6, background:"#f8fafc", borderRadius:8, border:"1px solid #e2e8f0", fontSize:14, color:"#718096" }}>{form.email || "—"}</div>
              ) : (
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={{width:"100%", padding:12, marginTop:6, borderRadius:8, border:"1.5px solid #e2e8f0", boxSizing:"border-box"}} />
              )}
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#718096" }}>SCHOOL</label>
              {editingLecturer ? (
                <div style={{ padding:"10px 12px", marginTop:6, background:"#f8fafc", borderRadius:8, border:"1px solid #e2e8f0", fontSize:14, color:"#718096" }}>{departments.find(d => d.id == form.department_id)?.name || "—"}</div>
              ) : (
                <select value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})} style={{width:"100%", padding:12, marginTop:6, borderRadius:8, border:"1.5px solid #e2e8f0", boxSizing:"border-box"}}>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              )}
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <label style={{fontWeight: 600}}>Assign Courses / Units</label>
            <div style={{ maxHeight: 280, overflowY: "auto", border: "1px solid #e2e8f0", padding: 12, borderRadius: 8, background: "white", marginTop: 8 }}>
              {courses
                .filter(c => !form.department_id || c.department_id == form.department_id)
                .map((c, i) => {
                  const name = typeof c === "string" ? c : (c.name || c.code || "Untitled");
                  const isChecked = form.assigned_courses.some(ac => 
                    (typeof ac === "string" ? ac : ac.name) === name
                  );
                  return (
                    <div key={i} onClick={() => toggleCourse(name)}
                      style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", cursor:"pointer", borderRadius:6, marginBottom:2, background: isChecked ? "#eaf4fb" : "transparent", border: `1px solid ${isChecked ? "#0a3d62" : "transparent"}` }}>
                      <div style={{ width:16, height:16, borderRadius:3, border:`2px solid ${isChecked ? "#0a3d62" : "#cbd5e0"}`, background: isChecked ? "#0a3d62" : "white", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        {isChecked && <span style={{ color:"white", fontSize:10, fontWeight:900 }}>✓</span>}
                      </div>
                      <div>
                        <span style={{ fontWeight:700, fontSize:13, color:"#0a3d62" }}>{c.code}</span>
                        <span style={{ fontSize:13, color:"#4a5568", marginLeft:6 }}>{c.name}</span>
                        {c.program && <span style={{ fontSize:11, color:"#a0aec0", marginLeft:6 }}>({c.program})</span>}
                      </div>
                    </div>
                  );
                })}
              {courses.filter(c => !form.department_id || c.department_id == form.department_id).length === 0 && (
                <div style={{ color:"#a0aec0", fontSize:13, padding:8 }}>No courses found for selected school.</div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <button onClick={saveLecturer} style={{ padding: "12px 32px", background: "#0a3d62", color: "white", border: "none", borderRadius: 8, marginRight: 12 }}>
              {editingLecturer ? "Update Lecturer" : "Save Lecturer"}
            </button>
            <button onClick={() => {setShowAdd(false); setEditingLecturer(null);}} style={{ padding: "12px 32px", background: "#e2e8f0", border: "none", borderRadius: 8 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            <th style={{ padding: 14, textAlign: "left" }}>Staff No</th>
            <th style={{ padding: 14, textAlign: "left" }}>Full Name</th>
            <th style={{ padding: 14, textAlign: "left" }}>Email</th>
            <th style={{ padding: 14, textAlign: "left" }}>Assigned Courses</th>
            <th style={{ padding: 14, textAlign: "center" }}>Status</th>
            <th style={{ padding: 14, textAlign: "center" }}>Action</th>
          </tr>
        </thead>
        <tbody>
       {/* Inside the <tbody> of your table */}
{filteredLecturers.map(l => (
  <tr key={l.id} style={{ borderTop: "1px solid #eee" }}>
    <td style={{ padding: 14 }}>{l.staff_no}</td>
    <td style={{ padding: 14, fontWeight: 600 }}>{l.full_name}</td>
    <td style={{ padding: 14 }}>{l.email}</td>
    
    {/* FIXED Assigned Courses Column */}
    <td style={{ padding: 14 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {(l.assigned_courses && l.assigned_courses.length > 0) ? 
          l.assigned_courses.map((c, i) => {
            const courseName = typeof c === "string" ? c : (c.name || c.code || "Unknown");
            return (
              <span key={i} style={{ 
                background: "#dbeafe", 
                padding: "3px 10px", 
                borderRadius: 12, 
                fontSize: 13 
              }}>
                {courseName}
              </span>
            );
          }) 
          : <span style={{ color: "#94a3b8" }}>No courses assigned</span>
        }
      </div>
    </td>

    <td style={{ padding: 14, textAlign: "center" }}>
      <span style={{ padding: "4px 12px", borderRadius: 20, background: l.is_active ? "#d1fae5" : "#fee2e2", color: l.is_active ? "#10b981" : "#ef4444" }}>
        {l.is_active ? "Active" : "Inactive"}
      </span>
    </td>
   <td style={{ padding: 14, textAlign: "center" }}>
  <button onClick={() => openEdit(l)} style={{marginRight:6, padding:"6px 12px", background:"#3b82f6", color:"white", border:"none", borderRadius:6, fontSize:12}}>✏️ Edit</button>
  
  <button onClick={() => {
    if(window.confirm(`Deactivate ${l.full_name}?`)){
      axios.post(`${API}/lecturers/${l.id}/deactivate`)
        .then(() => {alert("Deactivated"); loadLecturers();})
        .catch(e => alert(e.response?.data?.error || "Failed"));
    }
  }} style={{marginRight:6, padding:"6px 12px", background:"#f59e0b", color:"white", border:"none", borderRadius:6, fontSize:12}}>⏸ Deactivate</button>

  <button onClick={() => {
    if(window.confirm(`PERMANENTLY DELETE ${l.full_name}?\nThis cannot be undone!`)){
      axios.delete(`${API}/lecturers/${l.id}`)
        .then(() => {alert("Deleted"); loadLecturers();})
        .catch(e => alert(e.response?.data?.error || "Failed"));
    }
  }} style={{padding:"6px 12px", background:"#ef4444", color:"white", border:"none", borderRadius:6, fontSize:12}}>🗑️ Delete</button>
</td>
  </tr>
))}
        </tbody>
      </table>
    </div>
  );
}
function Settings({ user }) {
  const [form, setForm] = useState({ old_password: "", new_password: "", confirm_password: "" });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (!form.old_password || !form.new_password) return setError("All fields are required.");
    if (form.new_password !== form.confirm_password) return setError("New passwords do not match.");
    if (form.new_password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true); setError(""); setMsg("");
    try {
      await axios.post(`${API}/auth/change-password`, { id: user.id, role: user.role, old_password: form.old_password, new_password: form.new_password });
      setMsg("✅ Password changed successfully!");
      setForm({ old_password: "", new_password: "", confirm_password: "" });
    } catch(e) {
      setError(e.response?.data?.error || "Failed to change password.");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 500 }}>
      <div style={{ background: "white", borderRadius: 14, padding: 28, boxShadow: "0 2px 8px #0000000d" }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6, color: "#1a202c" }}>⚙️ Account Settings</div>
        <div style={{ fontSize: 13, color: "#718096", marginBottom: 24 }}>Logged in as <strong>{user.full_name}</strong> ({user.role})</div>

        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: "#1a202c" }}>🔒 Change Password</div>

        {error && (
  <div style={{ background: "#fdf2f2", border: "1px solid #f1948a", borderRadius: 8, padding: "10px 14px", color: "#c0392b", fontSize: 13, marginBottom: 16, fontWeight: 600 }}>
    {error.includes('admin@pu.ac.ke') ? error.split('admin@pu.ac.ke')[0] : error}
    {error.includes('admin@pu.ac.ke') && (
      <><a href="mailto:admin@pu.ac.ke" style={{ color: "#c0392b", fontWeight: 800 }}>admin@pu.ac.ke</a>{error.split('admin@pu.ac.ke')[1]}</>
    )}
  </div>
)}
        {msg && <div style={{ background: "#eafaf1", border: "1px solid #82e0aa", borderRadius: 8, padding: "10px 14px", color: "#1e8449", fontSize: 13, marginBottom: 16, fontWeight: 600 }}>{msg}</div>}

        {[
          { label: "CURRENT PASSWORD", key: "old_password", placeholder: "Enter current password" },
          { label: "NEW PASSWORD", key: "new_password", placeholder: "Min 6 characters" },
          { label: "CONFIRM NEW PASSWORD", key: "confirm_password", placeholder: "Re-enter new password" },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#718096", display: "block", marginBottom: 6 }}>{f.label}</label>
            <input type="password" placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }} />
          </div>
        ))}

        <button onClick={handleChange} disabled={loading}
          style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: loading ? "#a0aec0" : "#0a3d62", color: "white", fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Changing..." : "Change Password"}
        </button>
      </div>
    </div>
  );
}
function Charts({ students, courses, overview }) {
  const [atRisk, setAtRisk] = useState({ attendance_risk: [], performance_risk: [] });

  useEffect(() => {
    axios.get(`${API}/analytics/at-risk`).then(r => setAtRisk(r.data)).catch(() => {});
  }, []);

  const attendanceData = [
    { label: "At Risk (<75%)", value: atRisk.attendance_risk.length, color: "#c0392b" },
    { label: "Healthy (≥75%)", value: Math.max(0, students.length - atRisk.attendance_risk.length), color: "#1e8449" },
  ];

  const performanceData = [
    { label: "Failing (<40%)", value: atRisk.performance_risk.filter(s => s.performance_status === "failing").length, color: "#c0392b" },
    { label: "At Risk (<50%)", value: atRisk.performance_risk.filter(s => s.performance_status === "at_risk").length, color: "#e67e22" },
    { label: "Passing (≥50%)", value: Math.max(0, students.length - atRisk.performance_risk.length), color: "#1e8449" },
  ];

  const Bar = ({ data, title }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
      <div style={{ background: "white", borderRadius: 14, padding: 24, boxShadow: "0 2px 8px #0000000d" }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 20, color: "#1a202c" }}>{title}</div>
        {data.map((d, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#4a5568" }}>{d.label}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: d.color }}>{d.value}</span>
            </div>
            <div style={{ height: 10, background: "#f0f4f8", borderRadius: 5 }}>
              <div style={{ width: `${(d.value / max) * 100}%`, height: "100%", background: d.color, borderRadius: 5, transition: "width 0.6s ease" }} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const DonutChart = ({ data, title }) => {
    const total = data.reduce((a, b) => a + b.value, 0) || 1;
    let cumulative = 0;
    const radius = 60;
    const cx = 80, cy = 80;
    const segments = data.map(d => {
      const pct = d.value / total;
      const start = cumulative;
      cumulative += pct;
      const startAngle = start * 2 * Math.PI - Math.PI / 2;
      const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
      const x1 = cx + radius * Math.cos(startAngle);
      const y1 = cy + radius * Math.sin(startAngle);
      const x2 = cx + radius * Math.cos(endAngle);
      const y2 = cy + radius * Math.sin(endAngle);
      const largeArc = pct > 0.5 ? 1 : 0;
      return { ...d, path: `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`, pct: Math.round(pct * 100) };
    });

    return (
      <div style={{ background: "white", borderRadius: 14, padding: 24, boxShadow: "0 2px 8px #0000000d" }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 20, color: "#1a202c" }}>{title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="160" height="160" viewBox="0 0 160 160">
            {segments.map((s, i) => (
              <path key={i} d={s.path} fill={s.color} opacity={0.9} />
            ))}
            <circle cx={cx} cy={cy} r={35} fill="white" />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="800" fill="#1a202c">{total}</text>
            <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#718096">students</text>
          </svg>
          <div>
            {segments.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: s.color }} />
                <span style={{ fontSize: 13, color: "#4a5568" }}>{s.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: s.color, marginLeft: 4 }}>{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Students", value: students.length, color: "#0a3d62", icon: "🎓" },
          { label: "Total Courses", value: courses.length, color: "#148f77", icon: "📚" },
          { label: "Attendance Risk", value: atRisk.attendance_risk.length, color: "#c0392b", icon: "⚠️" },
          { label: "Performance Risk", value: atRisk.performance_risk.length, color: "#e67e22", icon: "📉" },
        ].map((c, i) => (
          <div key={i} style={{ background: "white", borderRadius: 14, padding: "18px 20px", boxShadow: "0 2px 8px #0000000d", display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ fontSize: 28 }}>{c.icon}</span>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: 12, color: "#718096" }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <DonutChart data={attendanceData} title="📋 Attendance Distribution" />
        <DonutChart data={performanceData} title="📊 Performance Distribution" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Bar data={attendanceData} title="📋 Attendance Risk Breakdown" />
        <Bar data={performanceData} title="📊 Performance Risk Breakdown" />
      </div>
    </div>
  );
}

function Reports({ students, courses }) {
  const [atRisk, setAtRisk] = useState({ attendance_risk: [], performance_risk: [] });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    axios.get(`${API}/analytics/at-risk`).then(r => setAtRisk(r.data)).catch(() => {});
  }, []);

  const exportCSV = (data, filename, headers) => {
    const rows = [headers.join(","), ...data.map(r => headers.map(h => {
      const key = h.toLowerCase().replace(/ /g, "_");
      const val = r[key] || r[Object.keys(r).find(k => k.toLowerCase().includes(key.split("_")[0]))] || "";
      return `"${val}"`;
    }).join(","))];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    setMsg(`✅ ${filename} downloaded!`);
  };

  const exportStudentsCSV = () => {
    const headers = ["Reg No", "Full Name", "Department", "Year", "Status"];
    const rows = ["Reg No,Full Name,Department,Year,Status",
      ...students.map(s => `"${s.reg_no}","${s.full_name}","${s.department_name}","Year ${s.year_of_study}","${s.status}"`)
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "students_report.csv"; a.click();
    setMsg("✅ Students report downloaded!");
  };

  const exportAttendanceRiskCSV = () => {
    const rows = ["Reg No,Student Name,Course,Sessions Attended,Total Sessions,Attendance %,Status",
      ...atRisk.attendance_risk.map(s => `"${s.reg_no}","${s.full_name}","${s.course_code}","${s.sessions_attended}","${s.total_sessions}","${s.attendance_percentage}%","${s.attendance_percentage < 50 ? "Critical" : "At Risk"}"`)
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "attendance_risk_report.csv"; a.click();
    setMsg("✅ Attendance risk report downloaded!");
  };

  const exportPerformanceRiskCSV = () => {
    const rows = ["Reg No,Student Name,Course,CAT Average,Exam Score,Final Score,Status",
      ...atRisk.performance_risk.map(s => `"${s.reg_no}","${s.full_name}","${s.course_code}","${s.cat_average || 0}","${s.exam_score || 0}","${s.final_score}%","${s.performance_status === "failing" ? "Failing" : "At Risk"}"`)
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "performance_risk_report.csv"; a.click();
    setMsg("✅ Performance risk report downloaded!");
  };

  const exportCoursesCSV = () => {
    const rows = ["Code,Course Name,Department,Year,Credits,Enrolled,Sessions",
      ...courses.map(c => `"${c.code}","${c.name}","${c.department_name}","Year ${c.year_of_study}","${c.credits}","${c.enrolled_count}","${c.total_sessions}"`)
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "courses_report.csv"; a.click();
    setMsg("✅ Courses report downloaded!");
  };

  const exportAllGradesCSV = async () => {
    try {
      let allRows = ["Reg No,Student,Course,CAT Avg,Exam Score,Final Score,Grade,Attendance %,Status"];
      for (const course of courses) {
        const res = await axios.get(`${API}/courses/${course.id}/grades`);
        res.data.students.forEach(s => {
          if (s.has_data) {
            allRows.push(`"${s.reg_no}","${s.full_name}","${course.code}","${s.cat_average}%","${s.exam_score}%","${s.final_score}%","${s.grade}","${s.attendance_pct}%","${s.status}"`);
          }
        });
      }
      const blob = new Blob([allRows.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "all_grades_report.csv"; a.click();
      setMsg("✅ All grades report downloaded!");
    } catch (e) { setMsg("❌ Failed: " + e.message); }
  };

  const reports = [
    { title: "Students Report", desc: "Full list of all active students with their school and year", icon: "🎓", color: "#0a3d62", action: exportStudentsCSV, count: students.length },
    { title: "Courses Report", desc: "All registered courses with enrollment and session counts", icon: "📚", color: "#148f77", action: exportCoursesCSV, count: courses.length },
    { title: "Attendance Risk Report", desc: "⚠️ Students flagged for low attendance — verify against performance before intervening", icon: "📋", color: "#c0392b", action: exportAttendanceRiskCSV, count: atRisk.attendance_risk.length },
    { title: "Performance Risk Report", desc: "Students scoring below 50% in assessments", icon: "📉", color: "#e67e22", action: exportPerformanceRiskCSV, count: atRisk.performance_risk.length },
    { title: "Full Grades Report", desc: "All students — CAT avg, exam, final score, grade letter across all courses", icon: "📊", color: "#7d3c98", action: exportAllGradesCSV, count: courses.length + " courses" },
  ];

  return (
    <div>
      {msg && <div style={{ background: msg.startsWith("❌") ? "#fdf2f2" : "#eafaf1", border: `1px solid ${msg.startsWith("❌") ? "#f1948a" : "#82e0aa"}`, borderRadius: 10, padding: "12px 16px", color: msg.startsWith("❌") ? "#c0392b" : "#1e8449", fontWeight: 600, fontSize: 13, marginBottom: 20 }}>{msg}</div>}

      <div style={{ background: "white", borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: "0 2px 8px #0000000d" }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6, color: "#1a202c" }}>📄 Export Reports</div>
        <div style={{ fontSize: 13, color: "#718096" }}>Download reports as CSV files that can be opened in Excel or Google Sheets.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
        {reports.map((r, i) => (
          <div key={i} style={{ background: "white", borderRadius: 14, padding: 24, boxShadow: "0 2px 8px #0000000d", border: `1px solid #f0f4f8` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: 12, background: r.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{r.icon}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#1a202c" }}>{r.title}</div>
                <div style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>{r.count} records</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#718096", marginBottom: 16 }}>{r.desc}</div>
            <button onClick={r.action}
              style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "none", background: r.color, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              ⬇️ Download CSV
            </button>
          </div>
        ))}
      </div>

      {/* Danger Zone — System-wide Reset */}
      <div style={{ marginTop: 24, background: "white", borderRadius: 14, padding: 24, boxShadow: "0 2px 8px #0000000d", border: "2px solid #f1948a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div style={{ width: 50, height: 50, borderRadius: 12, background: "#fdf2f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>⚠️</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#c0392b" }}>Danger Zone — Reset All Attendance</div>
            <div style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>Permanently deletes ALL attendance sessions and records system-wide. Cannot be undone.</div>
          </div>
        </div>
        <button
          onClick={async () => {
            const confirm1 = window.confirm("⚠️ WARNING: This will DELETE ALL attendance data for ALL courses system-wide.\n\nThis cannot be undone. Are you absolutely sure?");
            if (!confirm1) return;
            const code = prompt('Type  RESET  exactly to confirm:');
            if (code !== "RESET") { alert("Cancelled — confirmation code did not match."); return; }
            try {
              await axios.post(`${API}/admin/reset-attendance`, { confirm: "RESET_ALL_ATTENDANCE_CONFIRMED" });
              setMsg("✅ All attendance data has been reset successfully.");
            } catch (e) {
              setMsg("❌ Reset failed: " + (e.response?.data?.error || e.message));
            }
          }}
          style={{ padding: "11px 28px", borderRadius: 8, border: "none", background: "#c0392b", color: "white", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
          🔄 Reset All Attendance (System-Wide)
        </button>
      </div>
    </div>
  );
}
function QuadrantAnalysis({ user, isAdmin, courses }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [attThreshold, setAttThreshold] = useState(75);
  const [perfThreshold, setPerfThreshold] = useState(50);
  const [activeTab, setActiveTab] = useState('chart');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (!isAdmin && user?.id) params.append('lecturer_id', user.id);
      params.append('att_threshold', attThreshold);
      params.append('perf_threshold', perfThreshold);
      const res = await axios.get(`${API}/analytics/quadrant?${params}`);
      setData(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const quadrantConfig = [
    {
      key: 'high_att_high_perf',
      label: 'Ideal',
      icon: '✅',
      color: '#1e8449',
      bg: '#eafaf1',
      border: '#82e0aa',
      desc: 'Attending & performing well',
      position: 'top-right'
    },
    {
      key: 'high_att_low_perf',
      label: 'Hidden Struggle',
      icon: '⚠️',
      color: '#e67e22',
      bg: '#fef9e7',
      border: '#f8c471',
      desc: 'Attending but failing — academic difficulty',
      position: 'top-left'
    },
    {
      key: 'low_att_high_perf',
      label: 'Independent Learner',
      icon: '📘',
      color: '#2980b9',
      bg: '#eaf4fb',
      border: '#85c1e9',
      desc: 'Missing lectures but performing — no alarm needed',
      position: 'bottom-right'
    },
    {
      key: 'low_att_low_perf',
      label: 'True At-Risk',
      icon: '🚨',
      color: '#c0392b',
      bg: '#fdf2f2',
      border: '#f1948a',
      desc: 'Low attendance AND low performance — urgent',
      position: 'bottom-left'
    },
  ];

  const filtered = (data?.results || []).filter(r => {
    const matchQuadrant = activeFilter === 'all' || r.quadrant === activeFilter;
    const matchCourse = selectedCourse === 'all' || r.course_code === selectedCourse;
    return matchQuadrant && matchCourse;
  });

  const uniqueCourses = [...new Set((data?.results || []).map(r => r.course_code))];

  // Simple scatter plot using SVG
 const ScatterPlot = () => {
  const [tooltip, setTooltip] = useState(null);
  const W = 500, H = 380;
  const PAD = 50;
  const plotW = W - PAD * 2;
  const plotH = H - PAD * 2;

  const points = (data?.results || []).filter(r =>
    selectedCourse === 'all' || r.course_code === selectedCourse
  );

  return (
    <div style={{ position: "relative" }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: W }}
        onMouseLeave={() => setTooltip(null)}>
        {/* Background quadrants */}
        <rect x={PAD} y={PAD} width={plotW/2} height={plotH/2} fill="#fef9e722" />
        <rect x={PAD+plotW/2} y={PAD} width={plotW/2} height={plotH/2} fill="#eafaf133" />
        <rect x={PAD} y={PAD+plotH/2} width={plotW/2} height={plotH/2} fill="#fdf2f222" />
        <rect x={PAD+plotW/2} y={PAD+plotH/2} width={plotW/2} height={plotH/2} fill="#eaf4fb22" />

        {/* Threshold lines */}
        <line x1={PAD+(attThreshold/100)*plotW} y1={PAD} x2={PAD+(attThreshold/100)*plotW} y2={PAD+plotH} stroke="#718096" strokeWidth={1} strokeDasharray="4,4" />
        <line x1={PAD} y1={PAD+plotH-(perfThreshold/100)*plotH} x2={PAD+plotW} y2={PAD+plotH-(perfThreshold/100)*plotH} stroke="#718096" strokeWidth={1} strokeDasharray="4,4" />

        {/* Quadrant labels */}
        <text x={PAD+8} y={PAD+16} fontSize="9" fill="#e67e22" fontWeight="700">⚠ Hidden Struggle</text>
        <text x={PAD+plotW/2+8} y={PAD+16} fontSize="9" fill="#1e8449" fontWeight="700">✓ Ideal</text>
        <text x={PAD+8} y={PAD+plotH-6} fontSize="9" fill="#c0392b" fontWeight="700">🚨 True At-Risk</text>
        <text x={PAD+plotW/2+8} y={PAD+plotH-6} fontSize="9" fill="#2980b9" fontWeight="700">📘 Independent</text>

        {/* Axes */}
        <line x1={PAD} y1={PAD} x2={PAD} y2={PAD+plotH} stroke="#cbd5e0" strokeWidth={1.5} />
        <line x1={PAD} y1={PAD+plotH} x2={PAD+plotW} y2={PAD+plotH} stroke="#cbd5e0" strokeWidth={1.5} />

        {/* Axis labels */}
        <text x={PAD+plotW/2} y={H-6} textAnchor="middle" fontSize="11" fill="#4a5568" fontWeight="600">Attendance %</text>
        <text x={12} y={PAD+plotH/2} textAnchor="middle" fontSize="11" fill="#4a5568" fontWeight="600"
          transform={`rotate(-90, 12, ${PAD+plotH/2})`}>Performance %</text>

        {/* Axis ticks */}
        {[0,25,50,75,100].map(v => (
          <g key={v}>
            <text x={PAD+(v/100)*plotW} y={PAD+plotH+14} textAnchor="middle" fontSize="9" fill="#718096">{v}%</text>
            <text x={PAD-8} y={PAD+plotH-(v/100)*plotH+3} textAnchor="end" fontSize="9" fill="#718096">{v}%</text>
          </g>
        ))}

        {/* Data points */}
        {points.map((r, i) => {
          const cx = PAD + (r.attendance_pct / 100) * plotW;
          const cy = PAD + plotH - (r.final_score / 100) * plotH;
          return (
            <circle key={i} cx={cx} cy={cy} r={6} fill={r.color} opacity={0.85}
              stroke="white" strokeWidth={1.5}
              style={{ cursor: "pointer" }}
              onMouseEnter={(e) => setTooltip({ r, x: cx, y: cy })}
            />
          );
        })}

        {/* Tooltip inside SVG */}
        {tooltip && (() => {
          const tx = tooltip.x > plotW * 0.7 ? tooltip.x - 150 : tooltip.x + 12;
          const ty = tooltip.y < PAD + 60 ? tooltip.y + 10 : tooltip.y - 70;
          return (
            <g>
              <rect x={tx} y={ty} width={148} height={66} rx={6} fill="white"
                stroke={tooltip.r.color} strokeWidth={1.5}
                filter="url(#shadow)" />
              <text x={tx+8} y={ty+16} fontSize="11" fontWeight="700" fill="#1a202c">{tooltip.r.reg_no}</text>
              <text x={tx+8} y={ty+30} fontSize="10" fill="#4a5568">{tooltip.r.full_name.substring(0,20)}</text>
              <text x={tx+8} y={ty+44} fontSize="10" fill="#4a5568">Att: <tspan fontWeight="700" fill={tooltip.r.attendance_pct >= attThreshold ? "#1e8449" : "#c0392b"}>{tooltip.r.attendance_pct}%</tspan>  Perf: <tspan fontWeight="700" fill={tooltip.r.final_score >= perfThreshold ? "#1e8449" : "#c0392b"}>{tooltip.r.final_score}%</tspan></text>
              <text x={tx+8} y={ty+58} fontSize="10" fontWeight="700" fill={tooltip.r.color}>{tooltip.r.label}</text>
            </g>
          );
        })()}

        <defs>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>
      </svg>
    </div>
  );
};

  return (
    <div>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0a3d62,#1a5276)", borderRadius: 14, padding: "20px 24px", color: "white", marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
          📊 Attendance ≠ Performance Analysis
        </div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          Identifies students where attendance and performance disagree — exposing false alarms and hidden struggles
        </div>
      </div>

      {/* Threshold Controls */}
      <div style={{ background: "white", borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: "0 2px 8px #0000000d", display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#1a202c" }}>⚙️ Thresholds:</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#718096" }}>Attendance cutoff:</label>
          <input type="number" min="0" max="100" value={attThreshold}
            onChange={e => setAttThreshold(Number(e.target.value))}
            style={{ width: 60, padding: "5px 8px", borderRadius: 6, border: "1.5px solid #e2e8f0", fontSize: 13, textAlign: "center" }} />
          <span style={{ fontSize: 12, color: "#718096" }}>%</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#718096" }}>Performance cutoff:</label>
          <input type="number" min="0" max="100" value={perfThreshold}
            onChange={e => setPerfThreshold(Number(e.target.value))}
            style={{ width: 60, padding: "5px 8px", borderRadius: 6, border: "1.5px solid #e2e8f0", fontSize: 13, textAlign: "center" }} />
          <span style={{ fontSize: 12, color: "#718096" }}>%</span>
        </div>
        <button onClick={load} disabled={loading}
          style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: loading ? "#a0aec0" : "#0a3d62", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          {loading ? "Loading..." : "🔄 Apply"}
        </button>
        {data && (
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
            style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13 }}>
            <option value="all">All Courses</option>
            {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {loading && <div style={{ padding: 60, textAlign: "center", color: "#a0aec0" }}>Calculating quadrants...</div>}

      {data && (
        <>
          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
            {quadrantConfig.map(q => (
              <div key={q.key}
                onClick={() => setActiveFilter(activeFilter === q.key ? 'all' : q.key)}
                style={{ background: q.bg, border: `2px solid ${activeFilter === q.key ? q.color : q.border}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "all 0.2s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 20 }}>{q.icon}</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: q.color }}>{data.summary[q.key]}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, color: q.color, marginBottom: 2 }}>{q.label}</div>
                <div style={{ fontSize: 11, color: "#718096" }}>{q.desc}</div>
              </div>
            ))}
          </div>

          {/* Contradiction Alert */}
          {data.contradictions.length > 0 && (
            <div style={{ background: "#fff8e1", border: "2px solid #f9ca5a", borderRadius: 12, padding: "14px 18px", marginBottom: 16, display: "flex", gap: 14, alignItems: "center" }}>
              <span style={{ fontSize: 28 }}>⚡</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#856404", marginBottom: 2 }}>
                  {data.contradictions.length} Contradiction{data.contradictions.length !== 1 ? 's' : ''} Detected
                </div>
                <div style={{ fontSize: 13, color: "#856404" }}>
                  These students show a mismatch between attendance and performance —
                  standard at-risk detection would misclassify them.
                </div>
              </div>
              <button
                onClick={() => { setActiveFilter('high_att_low_perf'); setActiveTab('table'); }}
                style={{ marginLeft: "auto", padding: "8px 16px", borderRadius: 8, border: "none", background: "#856404", color: "white", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
                View Hidden Struggles →
              </button>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {[
              { id: 'chart', label: '📈 Scatter Plot' },
              { id: 'table', label: '📋 Student Table' },
              { id: 'report', label: '⚡ Contradiction Report' },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ padding: "9px 18px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", background: activeTab === t.id ? "#0a3d62" : "#f0f4f8", color: activeTab === t.id ? "white" : "#4a5568" }}>
                {t.label}
              </button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              {quadrantConfig.map(q => (
                <button key={q.key}
                  onClick={() => setActiveFilter(activeFilter === q.key ? 'all' : q.key)}
                  style={{ padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${q.color}`, background: activeFilter === q.key ? q.color : "white", color: activeFilter === q.key ? "white" : q.color, fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                  {q.icon} {q.label}
                </button>
              ))}
              {activeFilter !== 'all' && (
                <button onClick={() => setActiveFilter('all')}
                  style={{ padding: "6px 12px", borderRadius: 20, border: "1.5px solid #e2e8f0", background: "white", color: "#718096", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                  ✕ Clear
                </button>
              )}
            </div>
          </div>

          {/* Scatter Plot Tab */}
          {activeTab === 'chart' && (
            <div style={{ background: "white", borderRadius: 14, padding: 24, boxShadow: "0 2px 8px #0000000d" }}>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Attendance vs Performance Scatter Plot</div>
              <div style={{ fontSize: 12, color: "#718096", marginBottom: 16 }}>
                Each dot is a student. Hover for details. Dashed lines show your thresholds ({attThreshold}% attendance, {perfThreshold}% performance).
              </div>
              <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                <ScatterPlot />
                <div style={{ minWidth: 160 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#718096", marginBottom: 10 }}>LEGEND</div>
                  {quadrantConfig.map(q => (
                    <div key={q.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: q.color, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: q.color }}>{q.label}</div>
                        <div style={{ fontSize: 10, color: "#718096" }}>{data.summary[q.key]} students</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Table Tab */}
          {activeTab === 'table' && (
            <div style={{ background: "white", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px #0000000d" }}>
              <div style={{ padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {filtered.length} student{filtered.length !== 1 ? 's' : ''}
                  {activeFilter !== 'all' && <span style={{ marginLeft: 8, fontSize: 12, color: "#718096" }}>
                    — filtered: {quadrantConfig.find(q => q.key === activeFilter)?.label}
                  </span>}
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Reg No", "Student", "Course", "Attendance", "Performance", "CAT", "Exam", "Quadrant", "Action Needed"].map(h => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#718096", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, i) => (
                      <tr key={i} style={{ borderTop: "1px solid #f0f4f8", background: i % 2 === 0 ? "white" : "#fafbff" }}>
                        <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 700, color: "#0a3d62", fontSize: 12 }}>{r.reg_no}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 600, fontSize: 13 }}>{r.full_name}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ background: "#eaf4fb", color: "#1a6b8a", borderRadius: 6, padding: "2px 8px", fontWeight: 700, fontSize: 11 }}>{r.course_code}</span>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 50, height: 5, background: "#f0f4f8", borderRadius: 3 }}>
                              <div style={{ width: `${r.attendance_pct}%`, height: "100%", background: r.attendance_pct >= attThreshold ? "#1e8449" : "#c0392b", borderRadius: 3 }} />
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 12, color: r.attendance_pct >= attThreshold ? "#1e8449" : "#c0392b" }}>{r.attendance_pct}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 50, height: 5, background: "#f0f4f8", borderRadius: 3 }}>
                              <div style={{ width: `${r.final_score}%`, height: "100%", background: r.final_score >= perfThreshold ? "#1e8449" : "#c0392b", borderRadius: 3 }} />
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 12, color: r.final_score >= perfThreshold ? "#1e8449" : "#c0392b" }}>{r.final_score}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 12, fontWeight: 700, color: "#7d3c98" }}>{r.cat_average}%</td>
                        <td style={{ padding: "10px 12px", fontSize: 12, fontWeight: 700, color: "#1a6b8a" }}>{r.exam_score}%</td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ background: quadrantConfig.find(q => q.key === r.quadrant)?.bg, color: r.color, border: `1px solid ${r.color}44`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                            {quadrantConfig.find(q => q.key === r.quadrant)?.icon} {r.label}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 11, color: "#718096" }}>{r.description}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#a0aec0" }}>No students in this category.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Contradiction Report Tab */}
          {activeTab === 'report' && (
            <div>
              <div style={{ background: "white", borderRadius: 14, padding: 20, marginBottom: 14, boxShadow: "0 2px 8px #0000000d" }}>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>⚡ Contradiction Report</div>
                <div style={{ fontSize: 13, color: "#718096", marginBottom: 16 }}>
                  Students where attendance and performance disagree. Standard monitoring systems would misclassify these students.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "#fef9e7", border: "1px solid #f8c471", borderRadius: 10, padding: 14 }}>
                    <div style={{ fontWeight: 800, color: "#e67e22", fontSize: 14, marginBottom: 4 }}>
                      ⚠️ Hidden Struggles — {data.summary.high_att_low_perf} students
                    </div>
                    <div style={{ fontSize: 12, color: "#856404" }}>
                      High attendance (≥{attThreshold}%) but low performance (&lt;{perfThreshold}%). These students are present but not understanding the material.
                      A standard system would NOT flag them as at-risk — but they are failing.
                    </div>
                  </div>
                  <div style={{ background: "#eaf4fb", border: "1px solid #85c1e9", borderRadius: 10, padding: 14 }}>
                    <div style={{ fontWeight: 800, color: "#2980b9", fontSize: 14, marginBottom: 4 }}>
                      📘 Independent Learners — {data.summary.low_att_high_perf} students
                    </div>
                    <div style={{ fontSize: 12, color: "#1a6b8a" }}>
                      Low attendance (&lt;{attThreshold}%) but high performance (≥{perfThreshold}%). These students learn independently.
                      A standard system WOULD flag them as at-risk — but they are performing well. No intervention needed.
                    </div>
                  </div>
                </div>
              </div>

              {/* Hidden Struggles Table */}
              {data.results.filter(r => r.quadrant === 'high_att_low_perf').length > 0 && (
                <div style={{ background: "white", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px #0000000d", marginBottom: 14 }}>
                  <div style={{ padding: "12px 16px", background: "#fef9e7", borderBottom: "1px solid #f8c471", fontWeight: 700, color: "#e67e22", fontSize: 14 }}>
                    ⚠️ Hidden Struggles — High Attendance, Low Performance
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {["Reg No", "Student", "Course", "Attendance %", "Performance %", "Recommended Action"].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#718096", textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.results.filter(r => r.quadrant === 'high_att_low_perf').map((r, i) => (
                        <tr key={i} style={{ borderTop: "1px solid #f0f4f8" }}>
                          <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 700, color: "#0a3d62", fontSize: 12 }}>{r.reg_no}</td>
                          <td style={{ padding: "10px 14px", fontWeight: 600 }}>{r.full_name}</td>
                          <td style={{ padding: "10px 14px" }}><span style={{ background: "#eaf4fb", color: "#1a6b8a", borderRadius: 6, padding: "2px 8px", fontWeight: 700, fontSize: 11 }}>{r.course_code}</span></td>
                          <td style={{ padding: "10px 14px", fontWeight: 700, color: "#1e8449" }}>{r.attendance_pct}% ✓</td>
                          <td style={{ padding: "10px 14px", fontWeight: 700, color: "#c0392b" }}>{r.final_score}% ✗</td>
                          <td style={{ padding: "10px 14px", fontSize: 12, color: "#718096" }}>Academic support / tutoring — not attendance intervention</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Independent Learners Table */}
              {data.results.filter(r => r.quadrant === 'low_att_high_perf').length > 0 && (
                <div style={{ background: "white", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px #0000000d" }}>
                  <div style={{ padding: "12px 16px", background: "#eaf4fb", borderBottom: "1px solid #85c1e9", fontWeight: 700, color: "#2980b9", fontSize: 14 }}>
                    📘 Independent Learners — Low Attendance, High Performance
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {["Reg No", "Student", "Course", "Attendance %", "Performance %", "Note"].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#718096", textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.results.filter(r => r.quadrant === 'low_att_high_perf').map((r, i) => (
                        <tr key={i} style={{ borderTop: "1px solid #f0f4f8" }}>
                          <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 700, color: "#0a3d62", fontSize: 12 }}>{r.reg_no}</td>
                          <td style={{ padding: "10px 14px", fontWeight: 600 }}>{r.full_name}</td>
                          <td style={{ padding: "10px 14px" }}><span style={{ background: "#eaf4fb", color: "#1a6b8a", borderRadius: 6, padding: "2px 8px", fontWeight: 700, fontSize: 11 }}>{r.course_code}</span></td>
                          <td style={{ padding: "10px 14px", fontWeight: 700, color: "#c0392b" }}>{r.attendance_pct}% ✗</td>
                          <td style={{ padding: "10px 14px", fontWeight: 700, color: "#1e8449" }}>{r.final_score}% ✓</td>
                          <td style={{ padding: "10px 14px", fontSize: 12, color: "#718096" }}>Performing well — monitor attendance policy compliance only</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
export default App;