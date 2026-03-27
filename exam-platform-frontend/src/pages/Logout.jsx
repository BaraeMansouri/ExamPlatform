import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Logout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      await logout();
      localStorage.removeItem("session_id");
      navigate("/login", { replace: true });
    };

    run();
  }, [logout, navigate]);

  return <div style={{ padding: 24 }}>Déconnexion...</div>;
}
