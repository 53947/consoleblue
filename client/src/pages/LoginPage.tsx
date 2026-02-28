import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin, useForgotPassword } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BRAND_ASSETS } from "@/lib/assets";
import { Eye, EyeOff, Mail, ArrowLeft } from "lucide-react";

type View = "login" | "forgot" | "sent";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const login = useLogin();
  const forgotPassword = useForgotPassword();
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await login.mutateAsync({ email, password, rememberMe });
      navigate("/");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Login failed";
      setError(message);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await forgotPassword.mutateAsync(email);
      setView("sent");
    } catch {
      setView("sent"); // always show sent to prevent email enumeration
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img
            src={BRAND_ASSETS.consoleblue.icon}
            alt=""
            className="mx-auto mb-4 w-16 h-16"
          />
          <h1 className="text-2xl font-bold">
            <span style={{ color: "#FF44CC" }}>Console.</span>
            <span style={{ color: "#0000FF" }}>Blue</span>
          </h1>
        </CardHeader>
        <CardContent>
          {/* ── Login View ── */}
          {view === "login" && (
            <>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Sign in to your project management hub
              </p>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md border border-red-200">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="remember" className="text-sm font-normal">
                      Remember me for 7 days
                    </Label>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={login.isPending}
                >
                  {login.isPending ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              <div className="mt-4 pt-4 border-t text-center">
                <button
                  onClick={() => { setView("forgot"); setError(""); }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Forgot your password? We'll email you a reset link.
                </button>
              </div>
            </>
          )}

          {/* ── Forgot Password View ── */}
          {view === "forgot" && (
            <>
              <h2 className="text-lg font-semibold text-center mb-2">
                Reset your password
              </h2>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Enter your email and we'll send you a link to set a new password.
              </p>
              <form onSubmit={handleForgot} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={forgotPassword.isPending}
                >
                  {forgotPassword.isPending ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => { setView("login"); setError(""); }}
                  className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to sign in
                </button>
              </div>
            </>
          )}

          {/* ── Email Sent View ── */}
          {view === "sent" && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold">Check your email</h2>
              <p className="text-sm text-gray-500">
                If an account exists for <strong>{email}</strong>, we sent a
                password reset link. Check your inbox.
              </p>
              <button
                onClick={() => { setView("login"); setError(""); }}
                className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
