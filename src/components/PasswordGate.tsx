import React, { useState, useEffect } from "react";
import { Lock } from "lucide-react";

interface PasswordGateProps {
  children: React.ReactNode;
}

// NOTE: This is a DEMO access gate for convenience, NOT a security feature.
// The code is visible in the browser bundle - do not use for sensitive content.
// For real protection, use server-side authentication (e.g., Supabase Auth).
const DEMO_ACCESS_CODE = "123456";

const PasswordGate: React.FC<PasswordGateProps> = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if already unlocked
    const unlocked = localStorage.getItem("anthive_unlocked");
    if (unlocked === "true") {
      setIsUnlocked(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === DEMO_ACCESS_CODE) {
      localStorage.setItem("anthive_unlocked", "true");
      setIsUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setPassword("");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-neutral-400" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase text-white">AntHive</h1>
            <p className="text-sm text-neutral-400">請輸入密碼以進入</p>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="輸入密碼..."
              className={`w-full px-4 py-3 rounded-xl bg-neutral-900 border text-white text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all ${
                error ? "border-red-500 shake" : "border-neutral-700"
              }`}
              autoFocus
            />

            {error && <p className="text-red-500 text-sm text-center animate-fade-in">密碼錯誤，請重試</p>}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 text-black font-bold uppercase tracking-widest text-sm hover:bg-amber-400 transition-colors"
            >
              進入
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordGate;
