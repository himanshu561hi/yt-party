import LoginForm from "../components/auth/LoginForm.jsx";
import { useAuth } from "../hooks/useAuth.jsx";

export default function LoginPage({ onNavigateToSignup, onLoginSuccess }) {
  const { login, error, clearError } = useAuth();

  const handleLogin = async (email, password) => {
    await login(email, password);
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <div className="max-w-md w-full mx-auto">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          Welcome Back
        </h1>
        <p className="text-sm text-slate-400">
          Sign in to join or host a synchronized YouTube Watch Party session.
        </p>
      </header>

      <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-6 shadow-xl">
        <LoginForm
          onSubmit={handleLogin}
          error={error}
          onClearError={clearError}
          onNavigateToSignup={onNavigateToSignup}
        />
      </div>
    </div>
  );
}
