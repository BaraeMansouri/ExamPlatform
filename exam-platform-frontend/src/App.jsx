import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";


// Pages professeur
import Login              from "./pages/Login";
import Register           from "./pages/Register";
import Logout             from "./pages/Logout";
import Welcome            from "./pages/Welcome";
import Profile            from "./pages/Profile";
import Page1_ExamList     from "./pages/Page1_ExamList";
import Page2_CreateExam   from "./pages/Page2_CreateExam";
import Page3_Control      from "./pages/Page3_Control";
import Page4_Results      from "./pages/Page4_Results";
import Page5_Controllers  from "./pages/Page5_Controllers";

// Pages étudiant
import Page5_StudentForm  from "./pages/Page5_StudentForm";
import Page6_TakeExam     from "./pages/Page6_TakeExam";

function FullscreenLoader() {
  return (
    <div style={loaderStyles.shell}>
      <div style={loaderStyles.glowA} />
      <div style={loaderStyles.glowB} />
      <div style={loaderStyles.card}>
        <div style={loaderStyles.spinner} />
        <div style={loaderStyles.kicker}>ExamPlatform</div>
        <div style={loaderStyles.text}>Chargement de votre espace...</div>
      </div>
    </div>
  );
}

// Route protégée professeur
function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) return <FullscreenLoader />;

  return token ? children : <Navigate to="/welcome" replace />;
}

// Route publique (redirige si déjà connecté)
function PublicRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) return <FullscreenLoader />;

  return !token ? children : <Navigate to="/welcome" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* ── Auth ── */}
      <Route path="/welcome"  element={<Welcome />} />
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/logout"   element={<ProtectedRoute><Logout /></ProtectedRoute>} />

      {/* ── Professeur (protégées) ── */}
      <Route path="/dashboard" element={
        <ProtectedRoute><Page1_ExamList /></ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute><Profile /></ProtectedRoute>
      } />
      <Route path="/exams/create" element={
        <ProtectedRoute><Page2_CreateExam /></ProtectedRoute>
      } />
      <Route path="/exams/:id/edit" element={
        <ProtectedRoute><Page2_CreateExam /></ProtectedRoute>
      } />
      <Route path="/exams/:examId/control" element={
        <ProtectedRoute><Page3_Control /></ProtectedRoute>
      } />
      <Route path="/exams/:examId/results" element={
        <ProtectedRoute><Page4_Results /></ProtectedRoute>
      } />
      <Route path="/exams/:examId/reports" element={
        <ProtectedRoute><Page5_Controllers /></ProtectedRoute>
      } />

      {/* ── Étudiant (publiques) ── */}
      <Route path="/exam/:token"      element={<Page5_StudentForm />} />
      <Route path="/exam/:token/take" element={<Page6_TakeExam />} />

      {/* ── Redirections ── */}
      <Route path="/"   element={<Navigate to="/welcome" replace />} />
      <Route path="*"   element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

const loaderStyles = {
  shell: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #07111f 0%, #0d1f36 100%)",
    display: "grid",
    placeItems: "center",
    position: "relative",
    overflow: "hidden",
    color: "white",
  },
  glowA: {
    position: "absolute",
    width: "340px",
    height: "340px",
    borderRadius: "999px",
    background: "rgba(34, 211, 238, 0.16)",
    filter: "blur(90px)",
    top: "10%",
    left: "8%",
  },
  glowB: {
    position: "absolute",
    width: "360px",
    height: "360px",
    borderRadius: "999px",
    background: "rgba(37, 99, 235, 0.18)",
    filter: "blur(90px)",
    bottom: "8%",
    right: "8%",
  },
  card: {
    position: "relative",
    zIndex: 1,
    minWidth: "320px",
    padding: "32px 28px",
    borderRadius: "28px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(20px)",
    display: "grid",
    placeItems: "center",
    gap: "12px",
    boxShadow: "0 24px 80px rgba(2, 8, 23, 0.38)",
  },
  spinner: {
    width: "46px",
    height: "46px",
    borderRadius: "999px",
    border: "4px solid rgba(103, 232, 249, 0.14)",
    borderTopColor: "#67e8f9",
    animation: "app-spin 0.85s linear infinite",
  },
  kicker: {
    fontSize: "11px",
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    fontWeight: 900,
    color: "#67e8f9",
  },
  text: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#e2e8f0",
  },
};
