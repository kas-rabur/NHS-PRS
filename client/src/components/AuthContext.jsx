import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext({ token: null, user: null, isAuthenticated: false, login: () => {}, logout: () => {} });

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("prsToken"));
  const [user,  setUser ] = useState(() => {
    try { return token ? jwtDecode(token) : null; }
    catch { return null; }
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("prsToken", token);
      try { setUser(jwtDecode(token)); }
      catch { setUser(null); }
    } else {
      localStorage.removeItem("prsToken");
      setUser(null);
    }
  }, [token]);

  const login  = (t) => setToken(t);
  const logout = () => setToken(null);

  const isAuthenticated = !!user && Date.now() < user.exp * 1000;

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
