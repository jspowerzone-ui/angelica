function Schedule({ onBack }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f172a, #1e1b4b, #312e81)",
        color: "white",
        padding: 30,
        fontFamily: "Arial"
      }}
    >
      <button
        onClick={onBack}
        style={{
          padding: "10px 16px",
          border: "none",
          borderRadius: 12,
          background: "#2563eb",
          color: "white",
          cursor: "pointer",
          marginBottom: 20
        }}
      >
        ← Back
      </button>

      <h1>📅 Schedule Manager</h1>

      <p>
        CRUD system coming soon...
      </p>
    </div>
  );
}

export default Schedule;