import LoginForm from "../components/auth/LoginForm.jsx";
import { useAuth } from "../hooks/useAuth.jsx";

export default function LoginPage({ onNavigateToSignup, onLoginSuccess }) {
  const { login, error, clearError } = useAuth();

  const handleLogin = async (email, password) => {
    await login(email, password);
    onLoginSuccess?.();
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
      <header className="mb-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
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
