import React, { useState, useEffect } from "react";
import { Lock } from "lucide-react";

interface PasswordGateProps {
  children: React.ReactNode;
}

// Simple hash function for basic obfuscation (not cryptographically secure)
const CORRECT_PASSWORD_HASH = "123456";

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
    if (password === CORRECT_PASSWORD_HASH) {
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase text-foreground">AntHive</h1>
            <p className="text-sm text-muted-foreground">請輸入密碼以進入</p>
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
              className={`w-full px-4 py-3 rounded-xl bg-muted border text-foreground text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                error ? "border-destructive shake" : "border-border"
              }`}
              autoFocus
            />

            {error && <p className="text-destructive text-sm text-center animate-fade-in">密碼錯誤，請重試</p>}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity"
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
