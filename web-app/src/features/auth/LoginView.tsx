import { type FormEvent, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Mail,
  Sparkles,
} from "lucide-react";
import { useStores } from "@/stores/StoreProvider";
import { useTheme } from "@/theme/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

const LoginView = observer(() => {
  const { loginStore } = useStores();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const {
    viewState,
    email,
    otp,
    error,
    isSubmitting,
    isAuthenticated,
    setEmail,
    setOtp,
    sendLoginCode,
    verifyLoginCode,
    resetPendingFlow,
  } = loginStore;

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleEmailSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || isSubmitting) return;
    sendLoginCode();
  };

  const handleOtpSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!otp.trim() || isSubmitting) return;
    verifyLoginCode();
  };

  if (viewState === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="flex items-center gap-3 rounded-full border bg-background/80 px-5 py-2 text-sm text-muted-foreground shadow-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          Preparing your workspace…
        </div>
      </div>
    );
  }

  const awaitingOtp = viewState === "awaitingOtp";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-foreground">
            LeetStack
          </h1>
          <p className="text-muted-foreground">
            {awaitingOtp ? "Check your inbox" : "Passwordless login"}
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl">
          <CardContent className="p-6 space-y-6">
            {/* Icon and Title */}
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
                <Mail className="h-6 w-6 text-blue-500" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                {awaitingOtp ? "Enter your code" : "Sign in with email"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {awaitingOtp
                  ? "We sent a code to your email"
                  : "Use your work email to get started"
                }
              </p>
            </div>

            {/* Error Message */}
            {error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            {/* Forms */}
            {!awaitingOtp ? (
              <form className="space-y-4" onSubmit={handleEmailSubmit}>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoFocus
                    placeholder="you@company.com"
                    disabled={isSubmitting}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full font-medium transition-all duration-200 hover:scale-[1.02] bg-blue-500 hover:bg-blue-400 text-white"
                  disabled={isSubmitting || !email.trim()}
                >
                  {isSubmitting ? "Sending code…" : "Email me a login code"}
                </Button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleOtpSubmit}>
                <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                  Code sent to <span className="font-medium text-foreground">{email}</span>
                </div>
                <div>
                  <Label htmlFor="otp" className="text-sm font-medium">
                    Verification code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    placeholder="12345678"
                    className="tracking-[0.35em] text-center text-base font-semibold"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1 font-medium transition-all duration-200 bg-blue-500 hover:bg-blue-400 text-white"
                    disabled={isSubmitting || !otp.trim()}
                  >
                    {isSubmitting ? "Verifying…" : "Verify code"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => resetPendingFlow()}
                  >
                    Start over
                  </Button>
                </div>
              </form>
            )}

            {/* Help Text */}
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span>Use the same email as your Chrome extension</span>
            </div>
          </CardContent>

          {/* Footer */}
          <div className="border-t px-6 py-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Need help? leetstack.app@gmail.com</span>
              <Button variant="ghost" size="sm" className="p-0 h-auto">
                View release notes
                <ArrowRight className="h-3 w-3 ml-1 text-blue-500" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
});

export default LoginView;
