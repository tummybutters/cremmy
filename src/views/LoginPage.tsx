"use client";

export function LoginPage() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-[--bg-primary] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[--card-bg] border border-[--border-primary] rounded-xl p-8 text-center">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[--text-primary] mb-2">
            CREMMY CRM
          </h1>
          <p className="text-[--text-secondary]">
            Single-user CRM for freelancers
          </p>
        </div>

        <p className="text-[--text-secondary] mb-8">
          Sign in to access your client management dashboard
        </p>

        <button
          onClick={handleLogin}
          className="w-full bg-[--accent-blue] hover:bg-[--accent-blue-hover] text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}
