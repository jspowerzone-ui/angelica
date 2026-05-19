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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import Login from "./components/Login";
import Register from "./components/Register";

const CLASSES_COL    = "classes";
const STUDENTS_COL   = "students";
const ATTENDANCE_COL = "attendance";

// ─────────────────────────────────────────────
// 🔧 CONSTANTS
// ─────────────────────────────────────────────
const STATUS_CONFIG = {
  presente: { label: "Presente",  emoji: "✅", color: "green",  short: "P" },
  ausente:  { label: "Ausente",   emoji: "❌", color: "pink",   short: "A" },
  tarde:    { label: "Tarde",     emoji: "🕐", color: "amber",  short: "T" },
  excusa:   { label: "Excusa",    emoji: "📋", color: "violet", short: "E" },
};

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

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
      if (editingId !== null) await onEdit(editingId, form);
      else await onAdd(form);
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
                <input className="input-dark" type="date" value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Hora</label>
                <input className="input-dark" type="time" value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Color</label>
              <div className="color-picker">
                {colorOptions.map((c) => (
                  <button key={c}
                    className={`color-dot color-dot-${c}${form.color === c ? " selected" : ""}`}
                    onClick={() => setForm({ ...form, color: c })} />
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={closeForm} disabled={saving}>Cancelar</button>
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar clase"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="calendar-list">
        {sorted.length === 0 && (
          <div className="empty-state"><span>📅</span><p>No hay clases agendadas. ¡Agrega una!</p></div>
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
  const [form, setForm]           = useState({
    name: "", level: "Básico", subject: "", email: "",
    phone: "", schedule: "", joinDate: "", status: "activo",
  });
  const [search, setSearch]       = useState("");
  const [saving, setSaving]       = useState(false);

  const levels   = ["Básico", "Intermedio", "Avanzado"];
  const subjects = ["Inglés", "Portugués", "Francés"];
  const statuses = ["activo", "inactivo"];

  const openNew = () => {
    setForm({ name: "", level: "Básico", subject: "", email: "", phone: "", schedule: "", joinDate: "", status: "activo" });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (s) => {
    setForm({
      name: s.name, level: s.level, subject: s.subject || "", email: s.email || "",
      phone: s.phone || "", schedule: s.schedule || "", joinDate: s.joinDate || "", status: s.status || "activo",
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); setSaving(false); };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      if (editingId !== null) await onEdit(editingId, form);
      else await onAdd(form);
    } catch (err) {
      console.error("Error guardando estudiante:", err);
    } finally {
      setSaving(false);
      setShowForm(false);
      setEditingId(null);
    }
  };

  const levelColor = { Básico: "green", Intermedio: "amber", Avanzado: "violet" };

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.subject || "").toLowerCase().includes(search.toLowerCase())
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
        <input type="text" placeholder="Buscar por nombre o materia..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {showForm && (
        <div className="form-overlay" onClick={closeForm}>
          <div className="form-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{editingId ? "Editar estudiante" : "Nuevo estudiante"}</h3>

            <div className="form-group">
              <label>Nombre completo</label>
              <input type="text" placeholder="Ej: María García" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
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

            <div className="form-row">
              <div className="form-group">
                <label>Correo electrónico</label>
                <input type="email" placeholder="correo@email.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input type="tel" placeholder="300 000 0000" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Horario</label>
                <input type="text" placeholder="Ej: Lun-Mié 7pm" value={form.schedule}
                  onChange={(e) => setForm({ ...form, schedule: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Fecha de ingreso</label>
                <input type="date" value={form.joinDate}
                  onChange={(e) => setForm({ ...form, joinDate: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label>Estado</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {statuses.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={closeForm} disabled={saving}>Cancelar</button>
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar estudiante"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="students-list">
        {filtered.length === 0 && (
          <div className="empty-state"><span>👨‍🎓</span><p>No se encontraron estudiantes.</p></div>
        )}
        {filtered.map((s, i) => (
          <div key={s.id} className="student-item fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="student-avatar"
              style={{
                background: `rgba(var(--accent-${levelColor[s.level] || "green"}-rgb, 0,229,160), 0.13)`,
                color: `var(--accent-${levelColor[s.level] || "green"})`,
              }}
            >
              {s.name[0].toUpperCase()}
            </div>
            <div className="student-info">
              <strong>{s.name}</strong>
              <span>{s.email || s.phone || "Sin contacto"}</span>
              {s.schedule && <span style={{ fontSize: 11, opacity: 0.6 }}>🕐 {s.schedule}</span>}
            </div>
            <div className="student-meta">
              {s.subject && <span className="subject-tag">{s.subject}</span>}
              <span className={`level-tag level-${levelColor[s.level]}`}>{s.level}</span>
              <span className={`level-tag level-${s.status === "activo" ? "green" : "pink"}`}>
                {s.status === "activo" ? "Activo" : "Inactivo"}
              </span>
            </div>
            <div className="class-actions">
              <button className="icon-btn edit-btn"   onClick={() => openEdit(s)}    title="Editar">✏️</button>
              <button className="icon-btn delete-btn" onClick={() => onDelete(s.id)} title="Eliminar">🗑️</button>
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
// 📋 ATTENDANCE VIEW
// ─────────────────────────────────────────────
function AttendanceView({ students, attendance, onSetStatus }) {
  const today = new Date();
  const [selMonth, setSelMonth] = useState(today.getMonth());
  const [selYear,  setSelYear]  = useState(today.getFullYear());
  const [tab, setTab]           = useState("daily");
  const [selDate, setSelDate]   = useState(getTodayStr());
  const [saving, setSaving]     = useState({});
  const [selStudentId, setSelStudentId] = useState(null);

  const activeStudents = students.filter((s) => s.status !== "inactivo");

  const getRecord = useCallback(
    (studentId, date) => attendance.find((r) => r.studentId === studentId && r.date === date),
    [attendance]
  );

  const handleSetStatus = async (studentId, date, status) => {
    const key = `${studentId}_${date}`;
    setSaving((p) => ({ ...p, [key]: true }));
    try {
      await onSetStatus(studentId, date, status);
    } finally {
      setSaving((p) => ({ ...p, [key]: false }));
    }
  };

  const getMonthStats = useCallback((studentId, year, month) => {
    const days   = getDaysInMonth(year, month);
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    const records = attendance.filter((r) => r.studentId === studentId && r.date.startsWith(prefix));
    const counts  = { presente: 0, ausente: 0, tarde: 0, excusa: 0 };
    records.forEach((r) => { if (counts[r.status] !== undefined) counts[r.status]++; });
    const pct = Math.round((counts.presente / days) * 100);
    return { ...counts, total: records.length, days, pct };
  }, [attendance]);

  const getOverallStats = useCallback(() => {
    const prefix   = `${selYear}-${String(selMonth + 1).padStart(2, "0")}`;
    const monthRecs = attendance.filter((r) => r.date.startsWith(prefix));
    const counts    = { presente: 0, ausente: 0, tarde: 0, excusa: 0 };
    monthRecs.forEach((r) => { if (counts[r.status] !== undefined) counts[r.status]++; });
    const total = monthRecs.length;
    const pct   = total === 0 ? 0 : Math.round((counts.presente / total) * 100);
    return { ...counts, total, pct, activeCount: activeStudents.length };
  }, [attendance, selMonth, selYear, activeStudents.length]);

  // ── PDF Export ──
  const downloadPDF = () => {
    const docPdf      = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const daysInMonth = getDaysInMonth(selYear, selMonth);
    const monthName   = MONTHS[selMonth];

    docPdf.setFillColor(15, 20, 30);
    docPdf.rect(0, 0, 297, 297, "F");
    docPdf.setTextColor(0, 229, 160);
    docPdf.setFontSize(18);
    docPdf.setFont("helvetica", "bold");
    docPdf.text(`Reporte de Asistencia — ${monthName} ${selYear}`, 14, 18);
    docPdf.setTextColor(180, 180, 180);
    docPdf.setFontSize(10);
    docPdf.setFont("helvetica", "normal");
    docPdf.text(`Generado: ${new Date().toLocaleDateString("es-CO")}  ·  Clases de Idiomas`, 14, 26);

    const stats = getOverallStats();
    docPdf.setTextColor(220, 220, 220);
    docPdf.setFontSize(9);
    docPdf.text(
      `Activos: ${stats.activeCount}  ·  Presentes: ${stats.presente}  ·  Ausentes: ${stats.ausente}  ·  Tarde: ${stats.tarde}  ·  Excusas: ${stats.excusa}  ·  Asistencia: ${stats.pct}%`,
      14, 33
    );

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const head = [["Estudiante", "Materia", ...days.map(String), "P", "A", "T", "E", "%"]];
    const body = activeStudents.map((s) => {
      const mStats = getMonthStats(s.id, selYear, selMonth);
      const prefix = `${selYear}-${String(selMonth + 1).padStart(2, "0")}`;
      const row    = [s.name, s.subject || "—"];
      days.forEach((d) => {
        const dateStr = `${prefix}-${String(d).padStart(2, "0")}`;
        const rec     = getRecord(s.id, dateStr);
        row.push(rec ? STATUS_CONFIG[rec.status]?.short || "" : "");
      });
      row.push(mStats.presente, mStats.ausente, mStats.tarde, mStats.excusa, `${mStats.pct}%`);
      return row;
    });

    autoTable(docPdf, {
      head, body, startY: 38,
      styles: { fontSize: 7, cellPadding: 1.5, halign: "center", textColor: [220,220,220], fillColor: [22,28,42], lineColor: [40,50,70], lineWidth: 0.2 },
      headStyles: { fillColor: [0,120,90], textColor: [255,255,255], fontStyle: "bold" },
      columnStyles: { 0: { halign: "left", cellWidth: 38 }, 1: { halign: "left", cellWidth: 20 } },
      alternateRowStyles: { fillColor: [28,36,54] },
    });

    docPdf.save(`asistencia_${monthName}_${selYear}.pdf`);
  };

  const stats       = getOverallStats();
  const daysInMonth = getDaysInMonth(selYear, selMonth);

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <p className="section-label">✦ Control</p>
          <h2 className="view-title">Asistencia</h2>
        </div>
        <button className="btn-add pdf-btn" onClick={downloadPDF}>⬇️ Descargar PDF</button>
      </div>

      <div className="attendance-controls">
        <div className="month-selector">
          <select value={selMonth} onChange={(e) => setSelMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select value={selYear} onChange={(e) => setSelYear(Number(e.target.value))}>
            {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="att-tabs">
          <button className={`att-tab${tab === "daily" ? " att-tab-active" : ""}`} onClick={() => setTab("daily")}>
            📅 Vista diaria
          </button>
          <button className={`att-tab${tab === "monthly" ? " att-tab-active" : ""}`} onClick={() => setTab("monthly")}>
            📊 Vista mensual
          </button>
        </div>
      </div>

      <div className="att-stats-strip">
        {[
          { label: "Activos",   value: stats.activeCount, emoji: "👨‍🎓", color: "green"  },
          { label: "Presentes", value: stats.presente,    emoji: "✅",   color: "green"  },
          { label: "Ausentes",  value: stats.ausente,     emoji: "❌",   color: "pink"   },
          { label: "Tarde",     value: stats.tarde,       emoji: "🕐",   color: "amber"  },
          { label: "Excusas",   value: stats.excusa,      emoji: "📋",   color: "violet" },
          { label: "% Asist.",  value: `${stats.pct}%`,   emoji: "📈",   color: "green"  },
        ].map((s) => (
          <div key={s.label} className={`att-stat-card att-stat-${s.color}`}>
            <span className="att-stat-emoji">{s.emoji}</span>
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {tab === "daily" && (
        <div className="daily-view fade-up">
          <div className="daily-date-row">
            <label>Fecha:</label>
            <input type="date" value={selDate} className="input-dark"
              onChange={(e) => setSelDate(e.target.value)} />
            <span className="date-badge">
              {new Date(selDate + "T00:00:00").toLocaleDateString("es-CO", {
                weekday: "long", day: "numeric", month: "long",
              })}
            </span>
          </div>

          {activeStudents.length === 0 ? (
            <div className="empty-state"><span>👨‍🎓</span><p>No hay estudiantes activos.</p></div>
          ) : (
            <div className="daily-list">
              {activeStudents.map((s, i) => {
                const rec     = getRecord(s.id, selDate);
                const saveKey = `${s.id}_${selDate}`;
                return (
                  <div key={s.id} className="daily-row fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="daily-student">
                      <div className="student-avatar" style={{ minWidth: 38 }}>
                        {s.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <strong>{s.name}</strong>
                        <span>{s.subject || "Sin materia"} · {s.level || ""}</span>
                      </div>
                    </div>
                    <div className="status-buttons">
                      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                        <button key={key} disabled={saving[saveKey]}
                          className={`status-btn status-btn-${cfg.color}${rec?.status === key ? " status-btn-active" : ""}`}
                          onClick={() => handleSetStatus(s.id, selDate, key)}
                          title={cfg.label}
                        >
                          {cfg.emoji} <span>{cfg.label}</span>
                        </button>
                      ))}
                    </div>
                    {saving[saveKey] && <div className="saving-dot" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "monthly" && (
        <div className="monthly-view fade-up">
          <div className="student-selector-row">
            <label>Filtrar:</label>
            <div className="student-chips">
              <button className={`student-chip${!selStudentId ? " chip-active" : ""}`}
                onClick={() => setSelStudentId(null)}>Todos</button>
              {activeStudents.map((s) => (
                <button key={s.id}
                  className={`student-chip${selStudentId === s.id ? " chip-active" : ""}`}
                  onClick={() => setSelStudentId(selStudentId === s.id ? null : s.id)}>
                  {s.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="monthly-table-wrapper">
            <table className="monthly-table">
              <thead>
                <tr>
                  <th className="th-student">Estudiante</th>
                  {Array.from({ length: daysInMonth }, (_, i) => (
                    <th key={i + 1} className="th-day">{i + 1}</th>
                  ))}
                  <th className="th-stat">P</th>
                  <th className="th-stat">A</th>
                  <th className="th-stat">T</th>
                  <th className="th-stat">E</th>
                  <th className="th-stat th-pct">%</th>
                </tr>
              </thead>
              <tbody>
                {(selStudentId
                  ? activeStudents.filter((s) => s.id === selStudentId)
                  : activeStudents
                ).map((s) => {
                  const mStats = getMonthStats(s.id, selYear, selMonth);
                  return (
                    <tr key={s.id} className="monthly-row">
                      <td className="td-student">
                        <div className="student-avatar" style={{ width: 28, height: 28, fontSize: 12, minWidth: 28 }}>
                          {s.name[0]?.toUpperCase()}
                        </div>
                        <span>{s.name}</span>
                      </td>
                      {Array.from({ length: daysInMonth }, (_, di) => {
                        const d       = di + 1;
                        const dateStr = `${selYear}-${String(selMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                        const rec     = getRecord(s.id, dateStr);
                        const cfg     = rec ? STATUS_CONFIG[rec.status] : null;
                        return (
                          <td key={d} className={`td-day${cfg ? ` td-${cfg.color}` : ""}`}>
                            {cfg ? cfg.short : ""}
                          </td>
                        );
                      })}
                      <td className="td-stat td-green">{mStats.presente}</td>
                      <td className="td-stat td-pink">{mStats.ausente}</td>
                      <td className="td-stat td-amber">{mStats.tarde}</td>
                      <td className="td-stat td-violet">{mStats.excusa}</td>
                      <td className="td-stat td-pct">
                        <span className={`pct-pill pct-${mStats.pct >= 80 ? "good" : mStats.pct >= 50 ? "mid" : "low"}`}>
                          {mStats.pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 🏠 HOME — recibe todo por props desde App
// ─────────────────────────────────────────────
function Home({ user, classes, students, attendance, loadingData,
                addClass, editClass, deleteClass,
                addStudent, editStudent, deleteStudent,
                setAttendanceStatus, logout }) {
  const [view, setView]                   = useState("calendar");
  const [transitioning, setTransitioning] = useState(false);

  const displayName  = user?.displayName || user?.email?.split("@")[0] || "Profe";
  const avatarLetter = displayName[0].toUpperCase();

  const switchView = (target) => {
    if (target === view) return;
    setTransitioning(true);
    setTimeout(() => { setView(target); setTransitioning(false); }, 220);
  };

  const activeCount = students.filter((s) => s.status !== "inactivo").length;

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="nav-logo">🌐 <span>ClasesGratis</span></div>
        <div className="nav-links">
          <button className={`nav-link${view === "calendar"   ? " active" : ""}`} onClick={() => switchView("calendar")}>
            📅 Calendario
          </button>
          <button className={`nav-link${view === "students"   ? " active" : ""}`} onClick={() => switchView("students")}>
            👨‍🎓 Estudiantes
          </button>
          <button className={`nav-link${view === "attendance" ? " active" : ""}`} onClick={() => switchView("attendance")}>
            📋 Asistencia
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
              {view === "calendar" && (
                <CalendarView classes={classes} onAdd={addClass} onEdit={editClass} onDelete={deleteClass} />
              )}
              {view === "students" && (
                <StudentsView students={students} onAdd={addStudent} onEdit={editStudent} onDelete={deleteStudent} />
              )}
              {view === "attendance" && (
                <AttendanceView students={students} attendance={attendance} onSetStatus={setAttendanceStatus} />
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
                {view === "calendar"   && "📅 Calendario de clases"}
                {view === "students"   && "👨‍🎓 Gestión de estudiantes"}
                {view === "attendance" && "📋 Control de asistencia"}
              </span>
            </div>
            <div className="panel-quick-nav">
              <button className={`btn-toggle-sm${view === "calendar"   ? " btn-toggle-active" : ""}`} onClick={() => switchView("calendar")}>📅</button>
              <button className={`btn-toggle-sm${view === "students"   ? " btn-toggle-active" : ""}`} onClick={() => switchView("students")}>👨‍🎓</button>
              <button className={`btn-toggle-sm${view === "attendance" ? " btn-toggle-active" : ""}`} onClick={() => switchView("attendance")}>📋</button>
            </div>
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
                  <span>{activeCount} activo{activeCount !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <div className="summary-item">
                <span className="summary-emoji">📋</span>
                <div className="summary-text">
                  <strong>{attendance.length} registro{attendance.length !== 1 ? "s" : ""}</strong>
                  <span>de asistencia</span>
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
function PrivateRoute({ user, loading, children }) {
  // Mientras Firebase no haya resuelto el estado de auth, no redirigir
  if (loading) return null;
  return user ? children : <Navigate to="/" />;
}

// ─────────────────────────────────────────────
// 🚀 APP ROOT — único dueño de auth + datos
// ─────────────────────────────────────────────
export default function App() {
  const navigate = useNavigate();

  // ── Auth ──
  // CLAVE: empieza en true para que Firebase resuelva antes de redirigir
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Datos ──
  const [classes,    setClasses]    = useState([]);
  const [students,   setStudents]   = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // ── Escuchar auth UNA sola vez, en el root ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

 useEffect(() => {
  if (loading) return; // 🔥 NO user

  const unsubClasses = onSnapshot(
    query(collection(db, CLASSES_COL)),
    (snap) => {
      setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoadingData(false);
    }
  );

  const unsubStudents = onSnapshot(
    query(collection(db, STUDENTS_COL)),
    (snap) => {
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
  );

  const unsubAttendance = onSnapshot(
    query(collection(db, ATTENDANCE_COL)),
    (snap) => {
      setAttendance(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
  );

  return () => {
    unsubClasses();
    unsubStudents();
    unsubAttendance();
  };
}, [loading]);

  // ── CRUD Clases ──
  const addClass    = useCallback(async (data) => { await addDoc(collection(db, CLASSES_COL), data); }, []);
  const editClass   = useCallback(async (id, data) => { await updateDoc(doc(db, CLASSES_COL, id), data); }, []);
  const deleteClass = useCallback(async (id) => { await deleteDoc(doc(db, CLASSES_COL, id)); }, []);

  // ── CRUD Estudiantes ──
  const addStudent    = useCallback(async (data) => { await addDoc(collection(db, STUDENTS_COL), data); }, []);
  const editStudent   = useCallback(async (id, data) => { await updateDoc(doc(db, STUDENTS_COL, id), data); }, []);
  const deleteStudent = useCallback(async (id) => { await deleteDoc(doc(db, STUDENTS_COL, id)); }, []);

  // ── Asistencia ──
  const setAttendanceStatus = useCallback(async (studentId, date, status) => {
    const existing = attendance.find((r) => r.studentId === studentId && r.date === date);
    if (existing) {
      if (existing.status === status) {
        await deleteDoc(doc(db, ATTENDANCE_COL, existing.id));
      } else {
        await updateDoc(doc(db, ATTENDANCE_COL, existing.id), { status, updatedAt: new Date().toISOString() });
      }
    } else {
      const student = students.find((s) => s.id === studentId);
      await addDoc(collection(db, ATTENDANCE_COL), {
        studentId,
        studentName: student?.name || "",
        date,
        status,
        createdAt: new Date().toISOString(),
      });
    }
  }, [attendance, students]);

  const logout = async () => { await signOut(auth); navigate("/"); };

  // Pantalla de carga inicial (mientras Firebase resuelve)
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
          <PrivateRoute user={user} loading={loading}>
            <Home
              user={user}
              classes={classes}
              students={students}
              attendance={attendance}
              loadingData={loadingData}
              addClass={addClass}
              editClass={editClass}
              deleteClass={deleteClass}
              addStudent={addStudent}
              editStudent={editStudent}
              deleteStudent={deleteStudent}
              setAttendanceStatus={setAttendanceStatus}
              logout={logout}
            />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}