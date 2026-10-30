import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService.js";
import { connectSocket, disconnectSocket } from "../socket.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore authenticated session on mount
  useEffect(() => {
    let isMounted = true;
    authService
      .getCurrentUser()
      .then((currentUser) => {
        if (!isMounted) return;
        if (currentUser) {
          setUser(currentUser);
          connectSocket(authService.getToken());
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Shared runner for login & signup
  const handleAuth = async (authFn) => {
    setError(null);
    try {
      const data = await authFn();
      setUser(data.user);
      connectSocket(data.token);
      return data.user;
    } catch (err) {
      setError(err.message || "Authentication failed.");
      throw err;
    }
  };

  const login = (email, password) => handleAuth(() => authService.login({ email, password }));
  const signup = (formData) => handleAuth(() => authService.signup(formData));

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      disconnectSocket();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        signup,
        logout,
        clearError: () => setError(null)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
