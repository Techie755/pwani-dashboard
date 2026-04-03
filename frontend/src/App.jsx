import { useState, useEffect } from "react";
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
    "Bachelor of Science (Computer Science)",
    "Bachelor of Science (Nursing)",
    "Bachelor of Science (Nursing Upgrading)",
    "Bachelor of Science (Biotechnology)",
    "Bachelor of Science (Microbiology)",
    "Bachelor of Science (Chemistry)",
    "Bachelor of Science (Physics, Mathematics, Statistics)",
    "Bachelor of Science (Environmental Health)",
    "Bachelor of Science (Industrial Chemistry)",
    "Bachelor of Science (Biochemistry)",
    "Bachelor of Science (Marine)",
    "Diploma in Computer Science",
    "Diploma in Applied Biology",
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
    "Bachelor of Education (Special Needs)",
    "Bachelor of Education Arts (French)",
    "Bachelor of Education Science (Agriculture)",
    "Bachelor of Education Science (Computer)",
    "Bachelor of Science (Agri. Educ. and Extension)",
    "Diploma in Early Childhood Development",
    "Diploma Primary Education",
    "Diploma in Agri. Educ and Extension",
    "Diploma in Guidance & Counseling",
    "Certificate in Early Childhood Development",
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

  useEffect(() => {
    document.title = "Pwani University — Performance Analytics";
    loadOverview();
    loadStudents();
    loadCourses();
    axios.get(`${API}/departments`).then(r => setDepartments(r.data)).catch(() => {});
  }, []);

const navItems = [
    { id: "overview", label: "Dashboard", icon: "🏠" },
    { id: "students", label: "Students", icon: "🎓" },
    { id: "courses", label: "Courses", icon: "📚" },
    { id: "attendance", label: "Attendance", icon: "📋" },
    { id: "assignments", label: "Assessments", icon: "📝" },
    { id: "insights", label: "Insights", icon: "💡" },
    ...(isAdmin ? [
      { id: "enrollments", label: "Enrollments", icon: "🔗" },
      { id: "lecturers", label: "Lecturers", icon: "👨‍🏫" },
      { id: "settings", label: "Settings", icon: "⚙️" },
    ] : []),
  ];

  const pageTitle = { overview: "Dashboard", students: "Students", courses: "Courses", attendance: "Attendance", assignments: "Assessments", insights: "Insights", enrollments: "Student Enrollments", lecturers: "Manage Lecturers", settings: "Settings" };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', Arial, sans-serif", background: "#f0f4f8" }}>
      {/* Sidebar */}
      <div style={{ width: sidebarOpen ? 240 : 0, minWidth: sidebarOpen ? 240 : 0, background: "linear-gradient(180deg, #0a3d62 0%, #1a5276 100%)", color: "white", position: "fixed", height: "100vh", overflowY: "auto", overflowX: "hidden", transition: "all 0.3s", zIndex: 100, boxShadow: "2px 0 12px #00000033" }}>
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #ffffff22" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "#f39c12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900 }}>PU</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 14, letterSpacing: 0.3 }}>Pwani University</div>
              <div style={{ fontSize: 10, color: "#a9c8e8", marginTop: 1 }}>Performance Analytics System</div>
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
            <div style={{ fontWeight: 700, color: "white", marginBottom: 4 }}>📅 Academic Year 2024/2025</div>
            <div>Semester 1 — Active</div>
            <div style={{ marginTop: 4, color: "#f39c12", fontWeight: 600 }}>75% Attendance Required</div>
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
              <div style={{ fontSize: 11, color: "#a0aec0" }}>Pwani University — Academic Year 2024/2025</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "#eafaf1", color: "#1e8449", border: "1px solid #82e0aa", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>● System Online</div>
            <div style={{ fontSize: 13, color: "#4a5568", fontWeight: 600 }}>{user?.full_name}</div>
            <div style={{ background: user?.role === 'admin' ? '#f39c12' : '#148f77', color: 'white', borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
              {user?.role === 'admin' ? '👑 Admin' : '👨‍🏫 Lecturer'}
            </div>
            <button onClick={onLogout} style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "white", color: "#c0392b", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              Logout
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
          {page === "overview" && <Overview overview={overview} setPage={setPage} students={students} courses={courses} />}
          {page === "students" && <Students students={students} departments={departments} onRefresh={loadStudents} />}
          {page === "courses" && <Courses courses={courses} departments={departments} onRefresh={loadCourses} />}
          {page === "attendance" && <Attendance courses={courses} />}
          {page === "assignments" && <Assignments courses={courses} />}
          {page === "insights" && <Insights students={students} />}
          {page === "enrollments" && isAdmin && <Enrollments students={students} courses={courses} />}
          {page === "lecturers" && isAdmin && <LecturersAdmin />}
          {page === "settings" && <Settings user={user} />}
        </div>
      </div>
    </div>
  );
}function LoginPage({ onLogin }) {
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
      const r = await axios.post(`${API}/auth/login`, form);
      if (r.data.success) onLogin(r.data);
      else setError(r.data.error || "Invalid credentials.");
    } catch (e) {
      setError(e.response?.data?.error || "Login failed. Check your credentials.");
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!regForm.full_name || !regForm.email || !regForm.password) return setError("All fields are required.");
    if (regForm.password !== regForm.confirm_password) return setError("Passwords do not match.");
    if (regForm.password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true); setError(""); setSuccess("");
    try {
      await axios.post(`${API}/auth/register-lecturer`, regForm);
      setSuccess("✅ Registration successful! You can now log in.");
      setTab("login");
      setForm({ email: regForm.email, password: "" });
      setRegForm({ full_name: "", email: "", password: "", confirm_password: "", department_id: "1" });
    } catch (e) {
      setError(e.response?.data?.error || "Registration failed.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a3d62 0%, #1a5276 50%, #148f77 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Segoe UI, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 460, padding: 24 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 70, height: 70, borderRadius: 20, background: "#f39c12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: "white", margin: "0 auto 14px" }}>PU</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "white" }}>Pwani University</div>
          <div style={{ fontSize: 13, color: "#a9c8e8", marginTop: 4 }}>Performance Analytics System</div>
        </div>

        {/* Mode selector */}
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

        {/* Card */}
        <div style={{ background: "white", borderRadius: 20, padding: 32, boxShadow: "0 20px 60px #00000033" }}>
          {mode === "lecturer" && (
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
              {mode === "admin" ? "Admin Login" : tab === "login" ? "Lecturer Login" : "Lecturer Registration"}
            </div>
            <div style={{ fontSize: 12, color: "#a0aec0", marginTop: 4 }}>
              {mode === "admin" ? "Sign in with your administrator credentials" : tab === "login" ? "Sign in to your lecturer account" : "Create a new lecturer account"}
            </div>
          </div>

          {error && <div style={{ background: "#fdf2f2", border: "1px solid #f1948a", borderRadius: 8, padding: "10px 14px", color: "#c0392b", fontSize: 13, marginBottom: 16, fontWeight: 600 }}>{error}</div>}
          {success && <div style={{ background: "#eafaf1", border: "1px solid #82e0aa", borderRadius: 8, padding: "10px 14px", color: "#1e8449", fontSize: 13, marginBottom: 16, fontWeight: 600 }}>{success}</div>}
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
              <button onClick={async () => {
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
              }} disabled={loading}
                style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: loading ? "#a0aec0" : "#7d3c98", color: "white", fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Resetting..." : "Reset Password →"}
              </button>
              <div style={{ textAlign: "center", marginTop: 14 }}>
                <button onClick={() => { setTab("login"); setError(""); }}
                  style={{ background: "none", border: "none", color: "#0a3d62", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
                  ← Back to Login
                </button>
              </div>
            </div>
          )}
          {(mode === "admin" || tab === "login") && (
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
                <button onClick={() => { setTab("forgot"); setError(""); }}
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
              <button onClick={async () => {
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
              }} disabled={loading}
                style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: loading ? "#a0aec0" : "#7d3c98", color: "white", fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Resetting..." : "Reset Password →"}
              </button>
              <div style={{ textAlign: "center", marginTop: 14 }}>
                <button onClick={() => { setTab("login"); setError(""); }}
                  style={{ background: "none", border: "none", color: "#0a3d62", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
                  ← Back to Login
                </button>
              </div>
            </div>
          )}

          {mode === "lecturer" && tab === "register" && (
            <div>
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
          © 2024/2025 Pwani University — Performance Analytics System
        </div>
      </div>
    </div>
  );
}
// end Dashboard

function StatCard({ label, value, icon, color, onClick, subtitle }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: "white", borderRadius: 14, padding: "20px 24px", boxShadow: hovered && onClick ? `0 8px 24px ${color}33` : "0 2px 8px #0000000d", display: "flex", gap: 16, alignItems: "center", cursor: onClick ? "pointer" : "default", border: `2px solid ${hovered && onClick ? color : "transparent"}`, transition: "all 0.2s" }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 30, fontWeight: 900, color }}>{value}</div>
        <div style={{ fontSize: 13, color: "#718096", marginTop: 1 }}>{label}</div>
        {subtitle && <div style={{ fontSize: 11, color: color, marginTop: 3, fontWeight: 600 }}>{subtitle}</div>}
      </div>
      {onClick && <div style={{ fontSize: 18, color: color, opacity: hovered ? 1 : 0.3 }}>→</div>}
    </div>
  );
}

function Overview({ overview, setPage, students, courses }) {
  const atRisk = students.filter(s => (s.avg_attendance || 0) < 75).length;
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#1a202c", marginBottom: 4 }}>Welcome to Pwani University Analytics</div>
        <div style={{ fontSize: 14, color: "#718096" }}>Monitor student performance, attendance, and academic progress in real time.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Students" value={overview?.total_students || 0} icon="🎓" color="#0a3d62" onClick={() => setPage("students")} subtitle="Click to view all" />
        <StatCard label="Total Courses" value={overview?.total_courses || 0} icon="📚" color="#148f77" onClick={() => setPage("courses")} subtitle="Click to manage" />
        <StatCard label="At Risk Students" value={overview?.at_risk_attendance || 0} icon="⚠️" color="#c0392b" onClick={() => setPage("insights")} subtitle="Below 75% attendance" />
        <StatCard label="Avg Attendance" value={`${overview?.avg_attendance || 0}%`} icon="📊" color="#d35400" onClick={() => setPage("attendance")} subtitle={overview?.avg_attendance >= 75 ? "✅ Above threshold" : "⚠️ Below threshold"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 2px 8px #0000000d" }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14, color: "#1a202c" }}>📌 Academic Policy</div>
          <div style={{ background: "#fff8e1", border: "1px solid #f9ca5a", borderRadius: 10, padding: 14, fontSize: 13, marginBottom: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Attendance Requirement</div>
            Students must attend minimum <strong>75%</strong> of all sessions to sit for end-semester exams.
          </div>
          <div style={{ background: "#eaf4fb", border: "1px solid #85c1e9", borderRadius: 10, padding: 14, fontSize: 13 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Grade Calculation</div>
            <strong>30%</strong> CATs & Assignments + <strong>70%</strong> End Semester Exam = Final Grade
          </div>
        </div>

        <div style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 2px 8px #0000000d" }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14, color: "#1a202c" }}>🏫 Schools at Pwani University</div>
          {[
            { name: "School of Pure & Applied Sciences", icon: "🔬", color: "#0a3d62" },
            { name: "School of Education", icon: "📖", color: "#148f77" },
            { name: "School of Humanities & Social Sciences", icon: "🌍", color: "#7d3c98" },
            { name: "School of Agriculture & Environmental Sciences", icon: "🌱", color: "#1e8449" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 3 ? "1px solid #f0f4f8" : "none" }}>
              <span style={{ fontSize: 18 }}>{s.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: s.color }}>{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 14, padding: 20, boxShadow: "0 2px 8px #0000000d" }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14, color: "#1a202c" }}>📊 Quick Summary</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {[
            { label: "Active Students", value: students.length, color: "#0a3d62" },
            { label: "Registered Courses", value: courses.length, color: "#148f77" },
            { label: "Needing Intervention", value: overview?.at_risk_attendance || 0, color: "#c0392b" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#718096", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function Students({ students, departments, onRefresh }) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [filterDept, setFilterDept] = useState("");
  const [form, setForm] = useState({ reg_no: "", full_name: "", email: "", phone: "", department_id: "1", year_of_study: "1", semester: "1", program: "" });

  const filtered = students.filter(s =>
    (s.full_name.toLowerCase().includes(search.toLowerCase()) || s.reg_no.toLowerCase().includes(search.toLowerCase())) &&
    (filterDept === "" || s.department_id == filterDept)
  );

  const handleAdd = () => {
    if (!form.reg_no || !form.full_name) return alert("Reg No and Full Name are required.");
    axios.post(`${API}/students`, form)
      .then(() => { setShowAdd(false); setForm({ reg_no: "", full_name: "", email: "", phone: "", department_id: "1", year_of_study: "1", semester: "1", program: "" }); onRefresh(); })
      .catch(e => alert("Error: " + (e.response?.data?.error || e.message)));
  };

  const handleDelete = (id, name) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    axios.delete(`${API}/students/${id}`)
      .then(() => onRefresh())
      .catch(() => alert("Could not delete student."));
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by name or reg no..."
          style={{ flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14 }} />
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, minWidth: 200 }}>
          <option value="">All Schools</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button onClick={() => setShowAdd(!showAdd)}
          style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#0a3d62", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
          + Add Student
        </button>
      </div>

      {showAdd && (
        <div style={{ background: "white", borderRadius: 14, padding: 24, marginBottom: 16, boxShadow: "0 4px 16px #0000001a", border: "1px solid #e2e8f0" }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16, color: "#1a202c" }}>➕ Add New Student</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#718096", display: "block", marginBottom: 4 }}>REG NO *</label>
              <input placeholder="e.g. S/CS/009/2024" value={form.reg_no} onChange={e => setForm({ ...form, reg_no: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#718096", display: "block", marginBottom: 4 }}>FULL NAME *</label>
              <input placeholder="e.g. John Doe Mwangi" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#718096", display: "block", marginBottom: 4 }}>EMAIL</label>
              <input placeholder="e.g. john@students.pu.ac.ke" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#718096", display: "block", marginBottom: 4 }}>PHONE</label>
              <input placeholder="e.g. 0712345678" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#718096", display: "block", marginBottom: 4 }}>SCHOOL</label>
              <select value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }}>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
           <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#718096", display: "block", marginBottom: 4 }}>PROGRAMME</label>
              <select value={form.program} onChange={e => setForm({ ...form, program: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }}>
                <option value="">Select Programme</option>
                {(PWANI_PROGRAMS_BY_SCHOOL[departments.find(d => d.id == form.department_id)?.name] || []).map((p, i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#718096", display: "block", marginBottom: 4 }}>YEAR OF STUDY</label>
              <select value={form.year_of_study} onChange={e => setForm({ ...form, year_of_study: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }}>
                {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#718096", display: "block", marginBottom: 4 }}>SEMESTER</label>
              <select value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }}>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={handleAdd} style={{ padding: "10px 28px", borderRadius: 8, border: "none", background: "#0a3d62", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Save Student</button>
            <button onClick={() => setShowAdd(false)} style={{ padding: "10px 28px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "white", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ background: "white", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px #0000000d" }}>
        <div style={{ padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: 13, color: "#718096", fontWeight: 600 }}>
          Showing {filtered.length} of {students.length} students
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f0f4f8" }}>
              {["Reg No", "Full Name", "School", "Programme", "Year", "Status", "Action"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#718096", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.id} style={{ borderTop: "1px solid #f0f4f8", background: i % 2 === 0 ? "white" : "#fafbff" }}>
                <td style={{ padding: "12px 16px", fontSize: 13, fontFamily: "monospace", color: "#0a3d62", fontWeight: 700 }}>{s.reg_no}</td>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1a202c" }}>{s.full_name}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "#718096" }}>{s.department_name}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "#718096" }}>{s.program || "—"}</td>
                <td style={{ padding: "12px 16px", fontSize: 13 }}>Year {s.year_of_study}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ background: "#eafaf1", color: "#1e8449", border: "1px solid #82e0aa", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{s.status}</span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <button onClick={() => handleDelete(s.id, s.full_name)}
                    style={{ padding: "5px 14px", borderRadius: 6, border: "1.5px solid #f1948a", background: "#fdf2f2", color: "#c0392b", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    🗑 Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 50, color: "#a0aec0", fontSize: 14 }}>No students found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Courses({ courses, departments, onRefresh }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", department_id: "1", year_of_study: "1", semester: "1", credits: "3" });

  const handleAdd = () => {
    if (!form.code || !form.name) return alert("Code and Name are required.");
    axios.post(`${API}/courses`, form)
      .then(() => { setShowAdd(false); setForm({ code: "", name: "", department_id: "1", year_of_study: "1", semester: "1", credits: "3" }); onRefresh(); })
      .catch(e => alert("Error: " + (e.response?.data?.error || e.message)));
  };

  const handleDelete = (id, name) => {
    if (!window.confirm(`Delete course ${name}?`)) return;
    axios.delete(`${API}/courses/${id}`)
      .then(() => onRefresh())
      .catch(() => alert("Could not delete course — it may have existing records."));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button onClick={() => setShowAdd(!showAdd)}
          style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#0a3d62", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
          + Add Course
        </button>
      </div>

      {showAdd && (
        <div style={{ background: "white", borderRadius: 14, padding: 24, marginBottom: 16, boxShadow: "0 4px 16px #0000001a", border: "1px solid #e2e8f0" }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16, color: "#1a202c" }}>➕ Add New Course</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              { label: "COURSE CODE *", key: "code", placeholder: "e.g. CS501" },
              { label: "COURSE NAME *", key: "name", placeholder: "e.g. Artificial Intelligence" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#718096", display: "block", marginBottom: 4 }}>{f.label}</label>
                <input placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#718096", display: "block", marginBottom: 4 }}>SCHOOL</label>
              <select value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }}>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#718096", display: "block", marginBottom: 4 }}>YEAR</label>
              <select value={form.year_of_study} onChange={e => setForm({ ...form, year_of_study: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }}>
                {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#718096", display: "block", marginBottom: 4 }}>SEMESTER</label>
              <select value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }}>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#718096", display: "block", marginBottom: 4 }}>CREDITS</label>
              <input type="number" placeholder="3" value={form.credits} onChange={e => setForm({ ...form, credits: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={handleAdd} style={{ padding: "10px 28px", borderRadius: 8, border: "none", background: "#0a3d62", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Save Course</button>
            <button onClick={() => setShowAdd(false)} style={{ padding: "10px 28px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "white", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ background: "white", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px #0000000d" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f0f4f8" }}>
              {["Code", "Course Name", "School", "Year", "Sem", "Credits", "Enrolled", "Sessions", "Action"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#718096", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.map((c, i) => (
              <tr key={c.id} style={{ borderTop: "1px solid #f0f4f8", background: i % 2 === 0 ? "white" : "#fafbff" }}>
                <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#0a3d62", fontWeight: 800, fontSize: 13 }}>{c.code}</td>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1a202c" }}>{c.name}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "#718096" }}>{c.department_name}</td>
                <td style={{ padding: "12px 16px", fontSize: 13 }}>Yr {c.year_of_study}</td>
                <td style={{ padding: "12px 16px", fontSize: 13 }}>S{c.semester}</td>
                <td style={{ padding: "12px 16px", fontSize: 13 }}>{c.credits}</td>
                <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#0a3d62" }}>{c.enrolled_count}</td>
                <td style={{ padding: "12px 16px", fontSize: 13 }}>{c.total_sessions}</td>
                <td style={{ padding: "12px 16px" }}>
                  <button onClick={() => handleDelete(c.id, c.code)}
                    style={{ padding: "5px 14px", borderRadius: 6, border: "1.5px solid #f1948a", background: "#fdf2f2", color: "#c0392b", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    🗑 Delete
                  </button>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: "center", padding: 50, color: "#a0aec0" }}>No courses found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function Attendance({ courses }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [sessionForm, setSessionForm] = useState({ session_date: "", session_type: "lecture", notes: "" });

  const loadSessions = (course) => {
    setSelectedCourse(course);
    axios.get(`${API}/attendance/sessions?course_id=${course.id}`).then(r => setSessions(r.data)).catch(() => setSessions([]));
  };

  const handleAddSession = () => {
    if (!sessionForm.session_date) return alert("Please select a date.");
    axios.post(`${API}/attendance/sessions`, { ...sessionForm, course_id: selectedCourse.id })
      .then(() => { setShowAdd(false); setSessionForm({ session_date: "", session_type: "lecture", notes: "" }); loadSessions(selectedCourse); })
      .catch(e => alert("Error: " + e.message));
  };

  const handleUpload = async () => {
    if (!file || !selectedCourse) return alert("Select a course and file first.");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("course_id", selectedCourse.id);
    formData.append("session_date", new Date().toISOString().split("T")[0]);
    try {
      await axios.post(`${API}/attendance/upload`, formData);
      setUploadMsg("✅ Register uploaded successfully!");
      loadSessions(selectedCourse);
    } catch { setUploadMsg("❌ Upload failed. Try again."); }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {courses.map(c => (
          <button key={c.id} onClick={() => loadSessions(c)}
            style={{ padding: "8px 16px", borderRadius: 20, border: `2px solid ${selectedCourse?.id === c.id ? "#0a3d62" : "#e2e8f0"}`, background: selectedCourse?.id === c.id ? "#0a3d62" : "white", color: selectedCourse?.id === c.id ? "white" : "#4a5568", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {c.code}
          </button>
        ))}
      </div>

      {selectedCourse && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, background: "white", borderRadius: 12, padding: "12px 16px", boxShadow: "0 2px 8px #0000000d" }}>
          <div style={{ fontWeight: 700, color: "#0a3d62" }}>📚 {selectedCourse.code} — {selectedCourse.name}</div>
          <button onClick={() => setShowAdd(!showAdd)}
            style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#0a3d62", color: "white", fontWeight: 700, cursor: "pointer" }}>
            + New Session
          </button>
        </div>
      )}

      {showAdd && (
        <div style={{ background: "white", borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: "0 4px 16px #0000001a" }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>➕ New Session — {selectedCourse?.code}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#718096", display: "block", marginBottom: 4 }}>DATE *</label>
              <input type="date" value={sessionForm.session_date} onChange={e => setSessionForm({ ...sessionForm, session_date: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#718096", display: "block", marginBottom: 4 }}>TYPE</label>
              <select value={sessionForm.session_type} onChange={e => setSessionForm({ ...sessionForm, session_type: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }}>
                <option value="lecture">Lecture</option>
                <option value="lab">Lab</option>
                <option value="tutorial">Tutorial</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#718096", display: "block", marginBottom: 4 }}>NOTES</label>
              <input placeholder="Optional notes..." value={sessionForm.notes} onChange={e => setSessionForm({ ...sessionForm, notes: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button onClick={handleAddSession} style={{ padding: "9px 24px", borderRadius: 8, border: "none", background: "#0a3d62", color: "white", fontWeight: 700, cursor: "pointer" }}>Save Session</button>
            <button onClick={() => setShowAdd(false)} style={{ padding: "9px 24px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "white", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ background: "white", borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: "0 2px 8px #0000000d" }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>📷 Upload Scanned Register</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <input type="file" accept=".jpg,.jpeg,.png,.pdf,.tiff" onChange={e => setFile(e.target.files[0])} style={{ fontSize: 13 }} />
          <button onClick={handleUpload} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#0a3d62", color: "white", fontWeight: 700, cursor: "pointer" }}>Upload</button>
          {uploadMsg && <span style={{ fontSize: 13, fontWeight: 600 }}>{uploadMsg}</span>}
        </div>
        <div style={{ fontSize: 12, color: "#a0aec0", marginTop: 8 }}>Supported: JPG, PNG, PDF, TIFF — max 16MB</div>
      </div>

      <div style={{ background: "white", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px #0000000d" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f0f4f8" }}>
              {["Date", "Type", "Present", "Absent", "Attendance Rate", "Notes"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#718096", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.map((s, i) => {
              const pct = s.total_records ? Math.round((s.present_count / s.total_records) * 100) : 0;
              return (
                <tr key={s.id} style={{ borderTop: "1px solid #f0f4f8", background: i % 2 === 0 ? "white" : "#fafbff" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600 }}>{s.session_date}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, textTransform: "capitalize" }}>{s.session_type}</td>
                  <td style={{ padding: "12px 16px", color: "#1e8449", fontWeight: 700 }}>{s.present_count || 0}</td>
                  <td style={{ padding: "12px 16px", color: "#c0392b", fontWeight: 700 }}>{(s.total_records || 0) - (s.present_count || 0)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: "#f0f4f8", borderRadius: 3 }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: pct >= 75 ? "#1e8449" : "#c0392b", borderRadius: 3 }} />
                      </div>
                      <span style={{ fontWeight: 700, color: pct >= 75 ? "#1e8449" : "#c0392b", fontSize: 13, minWidth: 36 }}>{pct}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#a0aec0" }}>{s.notes || "—"}</td>
                </tr>
              );
            })}
            {sessions.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 50, color: "#a0aec0" }}>
                {selectedCourse ? "No sessions yet — click + New Session to add one." : "👆 Select a course above to view sessions"}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Assignments({ courses }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [scores, setScores] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [form, setForm] = useState({ title: "", type: "assignment", max_score: 100, due_date: "" });

  const loadAssignments = (course) => {
    setSelectedCourse(course);
    setSelectedAssignment(null);
    axios.get(`${API}/assignments?course_id=${course.id}`).then(r => setAssignments(r.data)).catch(() => setAssignments([]));
  };

  const loadScores = (assignment) => {
    setSelectedAssignment(assignment);
    axios.get(`${API}/assignments/${assignment.id}/scores`).then(r => setScores(r.data)).catch(() => setScores([]));
  };

  const handleAdd = () => {
    if (!form.title) return alert("Title is required.");
    axios.post(`${API}/assignments`, { ...form, course_id: selectedCourse.id })
      .then(() => { setShowAdd(false); setForm({ title: "", type: "assignment", max_score: 100, due_date: "" }); loadAssignments(selectedCourse); })
      .catch(e => alert("Error: " + e.message));
  };

  const handleSaveScores = () => {
    const payload = scores.map(s => ({ student_id: s.student_id, score: parseFloat(s.score) || 0 }));
    axios.put(`${API}/assignments/${selectedAssignment.id}/scores`, { scores: payload })
      .then(() => { alert("✅ Scores saved!"); loadAssignments(selectedCourse); setSelectedAssignment(null); })
      .catch(() => alert("Error saving scores."));
  };

  const typeColor = { assignment: "#1a6b8a", cat: "#e67e22", exam: "#c0392b", project: "#148f77" };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "#eaf4fb", border: "1px solid #85c1e9", borderRadius: 12, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>📝 CATs & Assignments — 30%</div>
          <div style={{ fontSize: 13 }}>Continuous Assessment Tests contribute <strong>30%</strong> to the final grade.</div>
        </div>
        <div style={{ background: "#fdf2e9", border: "1px solid #f0b27a", borderRadius: 12, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>📋 End Semester Exam — 70%</div>
          <div style={{ fontSize: 13 }}>The final examination contributes <strong>70%</strong> to the final grade.</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {courses.map(c => (
          <button key={c.id} onClick={() => loadAssignments(c)}
            style={{ padding: "8px 16px", borderRadius: 20, border: `2px solid ${selectedCourse?.id === c.id ? "#0a3d62" : "#e2e8f0"}`, background: selectedCourse?.id === c.id ? "#0a3d62" : "white", color: selectedCourse?.id === c.id ? "white" : "#4a5568", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {c.code}
          </button>
        ))}
      </div>

      {selectedCourse && !selectedAssignment && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button onClick={() => setShowAdd(!showAdd)}
            style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#0a3d62", color: "white", fontWeight: 700, cursor: "pointer" }}>
            + Add Assessment
          </button>
        </div>
      )}

      {showAdd && (
        <div style={{ background: "white", borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: "0 4px 16px #0000001a" }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>➕ New Assessment — {selectedCourse?.code}</div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#718096", display: "block", marginBottom: 4 }}>TITLE *</label>
              <input placeholder="e.g. CAT 1 — Chapter 1-3" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#718096", display: "block", marginBottom: 4 }}>TYPE</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }}>
                <option value="assignment">Assignment</option>
                <option value="cat">CAT</option>
                <option value="exam">Exam</option>
                <option value="project">Project</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#718096", display: "block", marginBottom: 4 }}>MAX SCORE</label>
              <input type="number" value={form.max_score} onChange={e => setForm({ ...form, max_score: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#718096", display: "block", marginBottom: 4 }}>DUE DATE</label>
              <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button onClick={handleAdd} style={{ padding: "9px 24px", borderRadius: 8, border: "none", background: "#0a3d62", color: "white", fontWeight: 700, cursor: "pointer" }}>Save</button>
            <button onClick={() => setShowAdd(false)} style={{ padding: "9px 24px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "white", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {selectedAssignment && (
        <div style={{ background: "white", borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: "0 4px 16px #0000001a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>✏️ Enter Scores — {selectedAssignment.title}</div>
            <button onClick={() => setSelectedAssignment(null)} style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 13 }}>✕ Close</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f0f4f8" }}>
                {["Reg No", "Student Name", `Score (out of ${selectedAssignment.max_score})`].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#718096", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scores.map((s, i) => (
                <tr key={s.student_id} style={{ borderTop: "1px solid #f0f4f8" }}>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#0a3d62", fontWeight: 700 }}>{s.reg_no}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 600 }}>{s.full_name}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <input type="number" min="0" max={selectedAssignment.max_score} value={s.score || ""}
                      onChange={e => { const updated = [...scores]; updated[i] = { ...s, score: e.target.value }; setScores(updated); }}
                      style={{ width: 100, padding: "6px 10px", borderRadius: 6, border: "1.5px solid #e2e8f0", fontSize: 14 }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleSaveScores} style={{ marginTop: 14, padding: "10px 28px", borderRadius: 8, border: "none", background: "#0a3d62", color: "white", fontWeight: 700, cursor: "pointer" }}>
            💾 Save All Scores
          </button>
        </div>
      )}

      {!selectedAssignment && (
        <div style={{ background: "white", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px #0000000d" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f0f4f8" }}>
                {["Title", "Type", "Max Score", "Due Date", "Avg Score", "Submissions", "Missing", "Action"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#718096", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assignments.map((a, i) => (
                <tr key={a.id} style={{ borderTop: "1px solid #f0f4f8", background: i % 2 === 0 ? "white" : "#fafbff" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600 }}>{a.title}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: (typeColor[a.type] || "#888") + "22", color: typeColor[a.type] || "#888", border: `1px solid ${typeColor[a.type] || "#888"}55`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                      {a.type?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>{a.max_score}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>{a.due_date || "—"}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: (a.avg_score || 0) >= 50 ? "#1e8449" : "#c0392b" }}>{a.avg_score || "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>{a.submission_count || 0}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {(a.missing_count || 0) > 0
                      ? <span style={{ background: "#fdf2f2", color: "#c0392b", border: "1px solid #f1948a", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{a.missing_count} missing</span>
                      : <span style={{ background: "#eafaf1", color: "#1e8449", border: "1px solid #82e0aa", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>Complete</span>}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button onClick={() => loadScores(a)}
                      style={{ padding: "5px 14px", borderRadius: 6, border: "1.5px solid #85c1e9", background: "#eaf4fb", color: "#1a6b8a", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      ✏️ Scores
                    </button>
                  </td>
                </tr>
              ))}
              {assignments.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 50, color: "#a0aec0" }}>
                  {selectedCourse ? "No assessments yet — click + Add Assessment." : "👆 Select a course to view assessments"}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Insights({ students }) {
  const [atRisk, setAtRisk] = useState({ attendance_risk: [], performance_risk: [] });
  const [tab, setTab] = useState("attendance");

  useEffect(() => {
    axios.get(`${API}/analytics/at-risk`).then(r => setAtRisk(r.data)).catch(() => {});
  }, []);

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
          { label: "Total Students", value: students.length, color: "#0a3d62", icon: "🎓", bg: "#eaf4fb" },
          { label: "At Risk (Combined)", value: new Set([...atRisk.attendance_risk.map(s => s.student_id), ...atRisk.performance_risk.map(s => s.student_id)]).size, color: "#7d3c98", icon: "⚠️", bg: "#f5eef8" },
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
            <div style={{ fontWeight: 800, color: "#c0392b", fontSize: 15 }}>🚨 Students Below 75% Attendance</div>
            <div style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>These students are at risk of being barred from end-semester examinations</div>
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
function Enrollments({ students, courses }) {
  const [enrollments, setEnrollments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolled, setEnrolled] = useState([]);
  const [msg, setMsg] = useState("");

  const loadEnrolled = (course) => {
    setSelectedCourse(course);
    setMsg("");
    axios.get(`${API}/courses/${course.id}/students`).then(r => setEnrolled(r.data)).catch(() => setEnrolled([]));
  };

  const enrollStudent = (studentId) => {
    axios.post(`${API}/enrollments`, { student_id: studentId, course_id: selectedCourse.id })
      .then(() => { setMsg("✅ Student enrolled!"); loadEnrolled(selectedCourse); })
      .catch(e => setMsg("❌ " + (e.response?.data?.error || "Already enrolled or error.")));
  };

  const unenrollStudent = (studentId) => {
    if (!window.confirm("Remove this student from the course?")) return;
    axios.delete(`${API}/enrollments`, { data: { student_id: studentId, course_id: selectedCourse.id } })
      .then(() => { setMsg("✅ Student removed."); loadEnrolled(selectedCourse); })
      .catch(() => setMsg("❌ Could not remove student."));
  };

  const enrolledIds = enrolled.map(e => e.student_id);
  const notEnrolled = students.filter(s => !enrolledIds.includes(s.id));

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, color: "#1a202c" }}>Select a course to manage enrollments:</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {courses.map(c => (
            <button key={c.id} onClick={() => loadEnrolled(c)}
              style={{ padding: "8px 16px", borderRadius: 20, border: `2px solid ${selectedCourse?.id === c.id ? "#0a3d62" : "#e2e8f0"}`, background: selectedCourse?.id === c.id ? "#0a3d62" : "white", color: selectedCourse?.id === c.id ? "white" : "#4a5568", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {c.code}
            </button>
          ))}
        </div>
      </div>

      {msg && <div style={{ padding: "10px 14px", borderRadius: 8, background: msg.startsWith("✅") ? "#eafaf1" : "#fdf2f2", color: msg.startsWith("✅") ? "#1e8449" : "#c0392b", fontWeight: 600, fontSize: 13, marginBottom: 16 }}>{msg}</div>}

      {selectedCourse && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Enrolled */}
          <div style={{ background: "white", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px #0000000d" }}>
            <div style={{ padding: "14px 18px", background: "#eafaf1", borderBottom: "1px solid #82e0aa" }}>
              <div style={{ fontWeight: 800, color: "#1e8449" }}>✅ Enrolled Students ({enrolled.length})</div>
              <div style={{ fontSize: 12, color: "#718096" }}>{selectedCourse.code} — {selectedCourse.name}</div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {enrolled.map((s, i) => (
                  <tr key={s.student_id} style={{ borderTop: i > 0 ? "1px solid #f0f4f8" : "none" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, fontSize: 13 }}>{s.full_name}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#718096", fontFamily: "monospace" }}>{s.reg_no}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <button onClick={() => unenrollStudent(s.student_id)}
                        style={{ padding: "4px 12px", borderRadius: 6, border: "1.5px solid #f1948a", background: "#fdf2f2", color: "#c0392b", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {enrolled.length === 0 && <tr><td colSpan={3} style={{ textAlign: "center", padding: 30, color: "#a0aec0" }}>No students enrolled yet</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Not enrolled */}
          <div style={{ background: "white", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px #0000000d" }}>
            <div style={{ padding: "14px 18px", background: "#eaf4fb", borderBottom: "1px solid #85c1e9" }}>
              <div style={{ fontWeight: 800, color: "#1a6b8a" }}>➕ Available Students ({notEnrolled.length})</div>
              <div style={{ fontSize: 12, color: "#718096" }}>Click to enroll in {selectedCourse.code}</div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {notEnrolled.map((s, i) => (
                  <tr key={s.id} style={{ borderTop: i > 0 ? "1px solid #f0f4f8" : "none" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, fontSize: 13 }}>{s.full_name}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#718096", fontFamily: "monospace" }}>{s.reg_no}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <button onClick={() => enrollStudent(s.id)}
                        style={{ padding: "4px 12px", borderRadius: 6, border: "1.5px solid #82e0aa", background: "#eafaf1", color: "#1e8449", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                        Enroll
                      </button>
                    </td>
                  </tr>
                ))}
                {notEnrolled.length === 0 && <tr><td colSpan={3} style={{ textAlign: "center", padding: 30, color: "#a0aec0" }}>All students enrolled</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function LecturersAdmin() {
  const [lecturers, setLecturers] = useState([]);

  const load = () => axios.get(`${API}/lecturers`).then(r => setLecturers(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const toggleActive = (id, current) => {
    if (!window.confirm(`${current ? "Deactivate" : "Activate"} this lecturer?`)) return;
    axios.delete(`${API}/lecturers/${id}`).then(() => load());
  };

  return (
    <div>
      <div style={{ background: "white", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px #0000000d" }}>
        <div style={{ padding: "14px 18px", background: "#f0f4f8", borderBottom: "1px solid #e2e8f0", fontWeight: 800, fontSize: 15 }}>
          👨‍🏫 Registered Lecturers ({lecturers.length})
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Staff No", "Full Name", "Email", "School", "Role", "Status", "Action"].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#718096", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lecturers.map((l, i) => (
              <tr key={l.id} style={{ borderTop: "1px solid #f0f4f8", background: i % 2 === 0 ? "white" : "#fafbff" }}>
                <td style={{ padding: "11px 16px", fontFamily: "monospace", color: "#0a3d62", fontWeight: 700, fontSize: 13 }}>{l.staff_no || "—"}</td>
                <td style={{ padding: "11px 16px", fontWeight: 600 }}>{l.full_name}</td>
                <td style={{ padding: "11px 16px", fontSize: 13, color: "#718096" }}>{l.email}</td>
                <td style={{ padding: "11px 16px", fontSize: 12, color: "#718096" }}>{l.department_name}</td>
                <td style={{ padding: "11px 16px" }}>
                  <span style={{ background: l.role === "admin" ? "#fff8e1" : "#eaf4fb", color: l.role === "admin" ? "#f39c12" : "#1a6b8a", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                    {l.role === "admin" ? "👑 Admin" : "👨‍🏫 Lecturer"}
                  </span>
                </td>
                <td style={{ padding: "11px 16px" }}>
                  <span style={{ background: l.is_active ? "#eafaf1" : "#fdf2f2", color: l.is_active ? "#1e8449" : "#c0392b", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                    {l.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={{ padding: "11px 16px" }}>
                  <button onClick={() => toggleActive(l.id, l.is_active)}
                    style={{ padding: "5px 14px", borderRadius: 6, border: `1.5px solid ${l.is_active ? "#f1948a" : "#82e0aa"}`, background: l.is_active ? "#fdf2f2" : "#eafaf1", color: l.is_active ? "#c0392b" : "#1e8449", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    {l.is_active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
            {lecturers.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: 50, color: "#a0aec0" }}>No lecturers registered yet</td></tr>}
          </tbody>
        </table>
      </div>
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

        {error && <div style={{ background: "#fdf2f2", border: "1px solid #f1948a", borderRadius: 8, padding: "10px 14px", color: "#c0392b", fontSize: 13, marginBottom: 16, fontWeight: 600 }}>{error}</div>}
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
export default App;