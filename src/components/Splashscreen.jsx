function SplashScreen() {
  return (
    <div
      style={{
        height: "100vh",
        background:
          "linear-gradient(135deg, #0f172a, #1e1b4b, #312e81)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        color: "white",
        fontFamily: "Arial"
      }}
    >
      {/* LOGO */}
      <div
        style={{
          fontSize: 80,
          marginBottom: 20
        }}
      >
        📅
      </div>

      {/* TITLE */}
      <h1
        style={{
          margin: 0,
          fontSize: 36,
          letterSpacing: 1
        }}
      >
        Diego Language Academy
      </h1>

      {/* SUBTITLE */}
      <p
        style={{
          marginTop: 12,
          color: "#cbd5e1",
          fontSize: 18
        }}
      >
        Loading application...
      </p>

      {/* LOADING BAR */}
      <div
        style={{
          width: 250,
          height: 8,
          background: "rgba(255,255,255,0.15)",
          borderRadius: 20,
          marginTop: 30,
          overflow: "hidden"
        }}
      >
        <div
          style={{
            width: "70%",
            height: "100%",
            background:
              "linear-gradient(90deg, #7c3aed, #2563eb)",
            borderRadius: 20
          }}
        />
      </div>
    </div>
  );
}

export default SplashScreen;