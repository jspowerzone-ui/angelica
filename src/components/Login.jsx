import { useState } from "react";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

const provider = new GoogleAuthProvider();

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/home");
    } catch (err) {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

 const google = async () => {
  setError("");
  try {
    await signInWithPopup(auth, provider);
    navigate("/home");
  } catch (err) {
    setError("No se pudo iniciar sesión con Google.");
  }
};
  return (
    <div className="auth-wrapper">
      {/* LEFT BRAND PANEL */}
      <div className="auth-brand">
        <div className="auth-brand-logo">
          📚 <span>Clases de idiomas</span>
        </div>
        <h1>
          Aprende sin <em>límites</em>,<br />
          crece sin frenos.
        </h1>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="auth-form-side">
        <div className="auth-card fade-up fade-up-1">
          <h2>Bienvenido de vuelta</h2>
          <p className="auth-subtitle">Ingresa tus datos para continuar</p>

          {error && (
            <p style={{
              background: "rgba(240,98,146,0.1)",
              border: "1px solid rgba(240,98,146,0.2)",
              color: "#f06292",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "16px"
            }}>
              {error}
            </p>
          )}

          <form onSubmit={login}>
            <div className="form-group">
              <label>Correo electrónico</label>
              <input
                type="email"
                placeholder="tu@correo.com"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: "8px" }}
            >
              {loading ? "Entrando..." : "Iniciar sesión →"}
            </button>
          </form>

          <div className="auth-divider">
            <span>o continúa con</span>
          </div>

          <button className="btn btn-google" onClick={google}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>

          <p className="auth-link">
            ¿No tienes cuenta?
            <button onClick={() => navigate("/register")}>Regístrate gratis</button>
          </p>
        </div>
      </div>
    </div>
  );
}