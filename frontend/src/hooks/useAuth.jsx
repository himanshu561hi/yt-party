import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService.js";
import { connectSocket, disconnectSocket } from "../socket.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check existing session on mount
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const currentUser = await authService.getCurrentUser();
        if (isMounted) {
          if (currentUser) {
            setUser(currentUser);
            connectSocket(authService.getToken());
          } else {
            setUser(null);
          }
        }
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await authService.login({ email, password });
      setUser(data.user);
      connectSocket(data.token);
      return data.user;
    } catch (err) {
      setError(err.message || "Failed to log in.");
      throw err;
    }
  };

  const signup = async ({ name, email, password, confirmPassword }) => {
    setError(null);
    try {
      const data = await authService.signup({ name, email, password, confirmPassword });
      setUser(data.user);
      connectSocket(data.token);
      return data.user;
    } catch (err) {
      setError(err.message || "Failed to sign up.");
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      disconnectSocket();
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        signup,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

