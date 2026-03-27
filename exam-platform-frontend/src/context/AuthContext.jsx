import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../api/api";

export const AuthContext = createContext();
const PROFILE_STORAGE_KEY = "professor_profile_overrides";

const readProfileOverrides = () => {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(false);

  // Synchronise le token avec localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setUser(null);
        return;
      }

      try {
        const response = await api.get("/user");
        const loadedUser = response.data;
        const overrides = readProfileOverrides();
        setUser({
          ...loadedUser,
          ...(loadedUser?.email ? overrides[loadedUser.email] || {} : {}),
        });
      } catch (error) {
        console.error("Load user failed:", error.response?.data || error.message);
        setUser(null);
        setToken(null);
      }
    };

    loadUser();
  }, [token]);

  // ✅ Login
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post(
        "/login",
        { email, password },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      // Stocke le token et l’utilisateur
      setUser(response.data.user);
      setToken(response.data.token);

      return true;
    } catch (error) {
      console.error("Login failed:", error.response?.data || error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ name, email, password }) => {
    setLoading(true);
    try {
      const response = await api.post(
        "/register",
        { name, email, password },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      setUser(response.data.user);
      setToken(response.data.token);

      return true;
    } catch (error) {
      console.error("Register failed:", error.response?.data || error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Logout
  const logout = async () => {
    try {
      await api.post("/logout", {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Logout failed:", error.response?.data || error.message);
    }
    setUser(null);
    setToken(null);
  };

  const updateProfile = (profileData) => {
    setUser((current) => {
      if (!current?.email) return current;

      const nextUser = { ...current, ...profileData };
      const overrides = readProfileOverrides();
      overrides[current.email] = {
        ...overrides[current.email],
        ...profileData,
      };
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(overrides));
      return nextUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Hook personnalisé
export const useAuth = () => useContext(AuthContext);
