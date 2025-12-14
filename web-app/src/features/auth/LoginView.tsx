import { type FormEvent, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Mail, Shield, Cpu, Terminal, Zap } from "lucide-react";
import { useStores } from "@/stores/StoreProvider";
import { useTheme } from "@/theme/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
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

  const handleEmailSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || isSubmitting) return;
    sendLoginCode();
  };

  const handleOtpSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!otp.trim() || isSubmitting) return;
    verifyLoginCode();
  };

  const awaitingOtp = viewState === "awaitingOtp";

  if (viewState === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-8 fade-in">
          <div className="flex items-center gap-4">
            <Terminal className="h-6 w-6 text-primary" />
            <span className="font-mono text-primary">Initializing...</span>
            <div className="loading"></div>
          </div>
          <div className="mt-4 space-y-2 font-mono text-sm text-muted-foreground">
            <div>Loading workspace...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full max-w-md">
        {/* Clean Logo */}
        <div className="text-center mb-8 fade-in">
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">
            LeetStack
          </h1>
          <p className="text-sm text-muted-foreground">
            {awaitingOtp
              ? "Enter your verification code"
              : "Sign in to continue"}
          </p>
        </div>

        {/* Login Card */}
        <Card className="fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              {awaitingOtp ? "Verification Required" : "Secure Sign In"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Display */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  <span className="font-medium">Authentication failed</span>
                </div>
                <div className="text-xs mt-1">{error}</div>
              </div>
            )}

            {!awaitingOtp ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoFocus
                    placeholder="Enter your email"
                    disabled={isSubmitting}
                    className="font-mono"
                  />
                </div>
                <Button
                  onClick={handleEmailSubmit}
                  className="w-full interactive-hover"
                  disabled={isSubmitting || !email.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <div className="loading mr-2"></div>
                      Sending code...
                    </>
                  ) : (
                    "Send verification code"
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-success/10 text-success-foreground text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>
                      Code sent to <span className="font-mono">{email}</span>
                    </span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    placeholder="8-digit code"
                    disabled={isSubmitting}
                    maxLength={8}
                    className="font-mono text-center text-lg tracking-widest"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleOtpSubmit}
                    className="flex-1 interactive-hover"
                    disabled={isSubmitting || !otp.trim()}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="loading mr-2"></div>
                        Verifying...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => resetPendingFlow()}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                </div>
              </div>
            )}

            <div className="pt-4 border-t text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3" />
                <span>Use the same email as your Chrome extension</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

export default LoginView;
