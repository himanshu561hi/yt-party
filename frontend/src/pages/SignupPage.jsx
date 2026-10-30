import SignupForm from "../components/auth/SignupForm.jsx";
import { useAuth } from "../hooks/useAuth.jsx";

export default function SignupPage({ onNavigateToLogin, onSignupSuccess }) {
  const { signup, error, clearError } = useAuth();

  const handleSignup = async (data) => {
    await signup(data);
    onSignupSuccess?.();
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1.5">
          Create an Account
        </h1>
        <p className="text-sm text-slate-500">
          Sign up to watch YouTube videos with friends in real-time.
        </p>
      </header>

      <SignupForm
        onSubmit={handleSignup}
        error={error}
        onClearError={clearError}
        onNavigateToLogin={onNavigateToLogin}
      />
    </div>
  );
}
