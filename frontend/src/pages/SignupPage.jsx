import SignupForm from "../components/auth/SignupForm.jsx";
import { useAuth } from "../hooks/useAuth.jsx";

export default function SignupPage({ onNavigateToLogin, onSignupSuccess }) {
  const { signup, error, clearError } = useAuth();

  const handleSignup = async (data) => {
    await signup(data);
    if (onSignupSuccess) {
      onSignupSuccess();
    }
  };

  return (
    <div className="max-w-md w-full mx-auto">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          Create an Account
        </h1>
        <p className="text-sm text-slate-400">
          Sign up to host rooms and watch YouTube videos with friends in real-time.
        </p>
      </header>

      <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-6 shadow-xl">
        <SignupForm
          onSubmit={handleSignup}
          error={error}
          onClearError={clearError}
          onNavigateToLogin={onNavigateToLogin}
        />
      </div>
    </div>
  );
}
