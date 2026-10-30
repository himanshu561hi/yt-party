import LoginForm from "../components/auth/LoginForm.jsx";
import { useAuth } from "../hooks/useAuth.jsx";

export default function LoginPage({ onNavigateToSignup, onLoginSuccess }) {
  const { login, error, clearError } = useAuth();

  const handleLogin = async (email, password) => {
    await login(email, password);
    onLoginSuccess?.();
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1.5">
          Welcome Back
        </h1>
        <p className="text-sm text-slate-500">
          Sign in to join or host a synchronized YouTube session.
        </p>
      </header>

      <LoginForm
        onSubmit={handleLogin}
        error={error}
        onClearError={clearError}
        onNavigateToSignup={onNavigateToSignup}
      />
    </div>
  );
}
