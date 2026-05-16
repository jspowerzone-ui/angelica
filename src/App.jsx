import { useEffect, useState, useCallback } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
} from "firebase/firestore";
import { auth, db } from "./firebase";

import Login from "./components/Login";
import Register from "./components/Register";

const CLASSES_COL  = "classes";
const STUDENTS_COL = "students";

// ─────────────────────────────────────────────
// 📅 CALENDAR VIEW
// ─────────────────────────────────────────────
function CalendarView({ classes, onAdd, onEdit, onDelete }) {
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]           = useState({ title: "", date: "", time: "", color: "green" });
  const [saving, setSaving]       = useState(false);

  const colorOptions = ["green", "violet", "amber", "pink"];
  const subjects     = ["Inglés", "Portugués", "Francés"];

  const openNew = () => {
    setForm({ title: "", date: "", time: "", color: "green" });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (cls) => {
    setForm({ title: cls.title, date: cls.date, time: cls.time, color: cls.color });
    setEditingId(cls.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setSaving(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.date || !form.time) return;
    setSaving(true);
    try {
      if (editingId !== null) {
        await onEdit(editingId, form);
      } else {
        await onAdd(form);
      }
    } catch (err) {
      console.error("Error guardando clase:", err);
    } finally {
      setSaving(false);
      setShowForm(false);
      setEditingId(null);
    }
  };

  const sorted = [...classes].sort((a, b) =>
    (a.date + a.time).localeCompare(b.date + b.time)
  );

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <p className="section-label">✦ Vista principal</p>
          <h2 className="view-title">Calendario de Clases</h2>
        </div>
        <button className="btn-add" onClick={openNew}>+ Nueva clase</button>
      </div>

      {showForm && (
        <div className="form-overlay" onClick={closeForm}>
          <div className="form-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{editingId ? "Editar clase" : "Nueva clase"}</h3>

            <div className="form-group">
              <label>Materia</label>
              <select value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}>
                <option value="">Selecciona una materia</option>
                {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Fecha</label>
                <input
                  className="input-dark"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Hora</label>
                <input
                  className="input-dark"
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Color</label>
              <div className="color-picker">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    className={`color-dot color-dot-${c}${form.color === c ? " selected" : ""}`}
                    onClick={() => setForm({ ...form, color: c })}
                  />
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={closeForm} disabled={saving}>
                Cancelar
              </button>
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar clase"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="calendar-list">
        {sorted.length === 0 && (
          <div className="empty-state">
            <span>📅</span>
            <p>No hay clases agendadas. ¡Agrega una!</p>
          </div>
        )}
        {sorted.map((cls, i) => (
          <div key={cls.id} className="class-item fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
            <div className={`class-accent class-accent-${cls.color}`} />
            <div className="class-info">
              <strong>{cls.title}</strong>
              <span>
                {cls.date
                  ? new Date(cls.date + "T00:00:00").toLocaleDateString("es-CO", {
                      weekday: "long", year: "numeric", month: "long", day: "numeric",
                    })
                  : "Sin fecha"}
                {" · "}{cls.time || "Sin hora"}
              </span>
            </div>
            <div className="class-actions">
              <button className="icon-btn edit-btn"   onClick={() => openEdit(cls)}    title="Editar">✏️</button>
              <button className="icon-btn delete-btn" onClick={() => onDelete(cls.id)} title="Eliminar">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 👨‍🎓 STUDENTS VIEW
// ─────────────────────────────────────────────
function StudentsView({ students, onAdd, onEdit, onDelete }) {
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]           = useState({ name: "", level: "Básico", subject: "", email: "" });
  const [search, setSearch]       = useState("");
  const [saving, setSaving]       = useState(false);

  const levels   = ["Básico", "Intermedio", "Avanzado"];
  const subjects = ["Inglés", "Portugués", "Francés"];

  const openNew = () => {
    setForm({ name: "", level: "Básico", subject: "", email: "" });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (s) => {
    setForm({ name: s.name, level: s.level, subject: s.subject, email: s.email });
    setEditingId(s.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setSaving(false);
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      if (editingId !== null) {
        await onEdit(editingId, form);
      } else {
        await onAdd(form);
      }
    } catch (err) {
      console.error("Error guardando estudiante:", err);
    } finally {
      setSaving(false);
      setShowForm(false);
      setEditingId(null);
    }
  };

  const levelColor = { Básico: "green", Intermedio: "amber", Avanzado: "violet" };

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <p className="section-label">✦ Gestión</p>
          <h2 className="view-title">Estudiantes</h2>
        </div>
        <button className="btn-add" onClick={openNew}>+ Nuevo estudiante</button>
      </div>

      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Buscar por nombre o materia..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {showForm && (
        <div className="form-overlay" onClick={closeForm}>
          <div className="form-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{editingId ? "Editar estudiante" : "Nuevo estudiante"}</h3>

            <div className="form-group">
              <label>Nombre completo</label>
              <input
                type="text"
                placeholder="Ej: María García"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Materia</label>
                <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                  <option value="">Selecciona</option>
                  {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Nivel</label>
                <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                  {levels.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Correo electrónico</label>
              <input
                type="email"
                placeholder="correo@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={closeForm} disabled={saving}>
                Cancelar
              </button>
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar estudiante"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="students-list">
        {filtered.length === 0 && (
          <div className="empty-state">
            <span>👨‍🎓</span>
            <p>No se encontraron estudiantes.</p>
          </div>
        )}
        {filtered.map((s, i) => (
          <div key={s.id} className="student-item fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
            <div
              className="student-avatar"
              style={{
                background: `rgba(var(--accent-${levelColor[s.level] || "green"}-rgb, 0,229,160), 0.13)`,
                color: `var(--accent-${levelColor[s.level] || "green"})`,
              }}
            >
              {s.name[0].toUpperCase()}
            </div>
            <div className="student-info">
              <strong>{s.name}</strong>
              <span>{s.email || "Sin correo"}</span>
            </div>
            <div className="student-meta">
              {s.subject && <span className="subject-tag">{s.subject}</span>}
              <span className={`level-tag level-${levelColor[s.level]}`}>{s.level}</span>
            </div>
            <div className="class-actions">
              <button className="icon-btn edit-btn"   onClick={() => openEdit(s)}      title="Editar">✏️</button>
              <button className="icon-btn delete-btn" onClick={() => onDelete(s.id)}   title="Eliminar">🗑️</button>
            </div>
          </div>
        ))}
      </div>
      <div className="students-footer">
        {filtered.length} estudiante{filtered.length !== 1 ? "s" : ""}
        {search && ` encontrado${filtered.length !== 1 ? "s" : ""}`}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 🏠 HOME
// ─────────────────────────────────────────────
function Home() {
  const navigate = useNavigate();
  const [user, setUser]               = useState(null);
  const [view, setView]               = useState("calendar");
  const [transitioning, setTransitioning] = useState(false);
  const [classes, setClasses]         = useState([]);
  const [students, setStudents]       = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // ── Auth ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // ── Listeners en tiempo real — sin orderBy para evitar el bug de índice ──
  useEffect(() => {
    const unsubClasses = onSnapshot(
      query(collection(db, CLASSES_COL)),
      (snap) => {
        setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoadingData(false);
      },
      (err) => {
        console.error("Error clases:", err);
        setLoadingData(false);
      }
    );

    const unsubStudents = onSnapshot(
      query(collection(db, STUDENTS_COL)),
      (snap) => {
        setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => console.error("Error estudiantes:", err)
    );

    return () => {
      unsubClasses();
      unsubStudents();
    };
  }, []);

  // ── CRUD Clases ──
  const addClass = useCallback(async (data) => {
    await addDoc(collection(db, CLASSES_COL), data);
  }, []);

  const editClass = useCallback(async (id, data) => {
    await updateDoc(doc(db, CLASSES_COL, id), data);
  }, []);

  const deleteClass = useCallback(async (id) => {
    await deleteDoc(doc(db, CLASSES_COL, id));
  }, []);

  // ── CRUD Estudiantes ──
  const addStudent = useCallback(async (data) => {
    await addDoc(collection(db, STUDENTS_COL), data);
  }, []);

  const editStudent = useCallback(async (id, data) => {
    await updateDoc(doc(db, STUDENTS_COL, id), data);
  }, []);

  const deleteStudent = useCallback(async (id) => {
    await deleteDoc(doc(db, STUDENTS_COL, id));
  }, []);

  const logout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const displayName =
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Profe";
  const avatarLetter = displayName[0].toUpperCase();

  const switchView = (target) => {
    if (target === view) return;
    setTransitioning(true);
    setTimeout(() => {
      setView(target);
      setTransitioning(false);
    }, 220);
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="nav-logo">🌐 <span>ClasesGratis</span></div>
        <div className="nav-links">
          <button
            className={`nav-link${view === "calendar" ? " active" : ""}`}
            onClick={() => switchView("calendar")}
          >
            📅 Calendario
          </button>
          <button
            className={`nav-link${view === "students" ? " active" : ""}`}
            onClick={() => switchView("students")}
          >
            👨‍🎓 Estudiantes
          </button>
        </div>
        <div className="nav-actions">
          <div className="nav-avatar" title={displayName}>{avatarLetter}</div>
          <button className="btn-logout" onClick={logout}>Salir</button>
        </div>
      </nav>

      <div className="dashboard-body">
        <div className="panel-left">
          {loadingData ? (
            <div className="loading-data">
              <div className="loading-spinner" />
              <p>Cargando datos compartidos...</p>
            </div>
          ) : (
            <div className={`view-wrapper${transitioning ? " view-exit" : " view-enter"}`}>
              {view === "calendar" ? (
                <CalendarView
                  classes={classes}
                  onAdd={addClass}
                  onEdit={editClass}
                  onDelete={deleteClass}
                />
              ) : (
                <StudentsView
                  students={students}
                  onAdd={addStudent}
                  onEdit={editStudent}
                  onDelete={deleteStudent}
                />
              )}
            </div>
          )}
        </div>

        <div className="panel-right">
          <div className="user-welcome fade-up fade-up-1">
            <div className="user-avatar-lg">{avatarLetter}</div>
            <div className="user-info">
              <h3>¡Hola, {displayName}! 👋</h3>
              <p>{user?.email || "Sesión activa"}</p>
              
            </div>
          </div>

          <div className="toggle-section fade-up fade-up-2">
            <p className="panel-section-title">Vista activa</p>
            <div className="view-indicator">
              <span className={`indicator-dot${view === "calendar" ? " dot-active" : ""}`} />
              <span>
                {view === "calendar" ? "📅 Calendario de clases" : "👨‍🎓 Gestión de estudiantes"}
              </span>
            </div>
            <button
              className="btn-toggle"
              onClick={() => switchView(view === "calendar" ? "students" : "calendar")}
            >
              {view === "calendar" ? "👨‍🎓 Ver estudiantes" : "📅 Ir a calendario"}
            </button>
          </div>

          <div className="summary-card fade-up fade-up-3">
            <p className="panel-section-title">
              Resumen compartido
              <span className="live-badge">● EN VIVO</span>
            </p>
            <div className="summary-list">
              <div className="summary-item">
                <span className="summary-emoji">📅</span>
                <div className="summary-text">
                  <strong>{classes.length} clase{classes.length !== 1 ? "s" : ""}</strong>
                  <span>agendada{classes.length !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <div className="summary-item">
                <span className="summary-emoji">👨‍🎓</span>
                <div className="summary-text">
                  <strong>{students.length} estudiante{students.length !== 1 ? "s" : ""}</strong>
                  <span>registrado{students.length !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <div className="summary-item">
                <span className="summary-emoji">🌐</span>
                <div className="summary-text">
                  <strong>3 idiomas</strong>
                  <span>Inglés · Portugués · Francés</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 🔒 PRIVATE ROUTE
// ─────────────────────────────────────────────
function PrivateRoute({ user, children }) {
  return user ? children : <Navigate to="/" />;
}

// ─────────────────────────────────────────────
// 🚀 APP ROOT
// ─────────────────────────────────────────────
export default function App() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">🌐 Clases de idiomas</div>
        <div className="loading-spinner" />
        <p className="loading-text">Preparando tu plataforma...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/home"
        element={
          <PrivateRoute user={user}>
            <Home />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}