import { type FormEvent, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  NotebookPen,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useStores } from "@/stores/StoreProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const featureHighlights = [
  {
    icon: NotebookPen,
    title: "Unified notebook",
    description: "Capture prompts, notes, and code in one feed.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by default",
    description: "Passwordless auth + RLS for every note.",
  },
  {
    icon: CheckCircle2,
    title: "Signals you trust",
    description: "Track patterns, difficulty, readiness.",
  },
];

const LoginView = observer(() => {
  const { loginStore } = useStores();
  const navigate = useNavigate();
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
    <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative hidden overflow-hidden bg-slate-950 text-white lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,_163,_255,_0.25),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[conic-gradient(at_top,_#312e81,_#0f172a,_#020617)] opacity-70" />
        <div className="relative z-10 flex w-full flex-col justify-between p-12">
          <div className="space-y-6">
            <Badge
              variant="secondary"
              className="border-white/30 bg-white/10 text-white"
            >
              Private beta · Spring Playlists
            </Badge>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight">
                Move faster on interviews.
              </h1>
              <p className="text-base text-white/70">
                Capture in Chrome, review here.
              </p>
            </div>
            <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              {featureHighlights.map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/5 text-white">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{feature.title}</p>
                    <p className="text-sm text-white/70">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/80 backdrop-blur">
            <p className="font-medium">Realtime sync</p>
            <p className="text-white/60">Chrome extension • Notebook API</p>
          </div>
        </div>
      </aside>

      <main className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-lg">
          <div className="mb-8 flex flex-col gap-3 text-center lg:text-left">
            <Badge
              variant="secondary"
              className="w-fit bg-muted text-muted-foreground"
            >
              Secure access
            </Badge>
            <div>
              <p className="text-sm text-muted-foreground">
                Sign in to LeetStack
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                {awaitingOtp ? "Check your inbox" : "Welcome back"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {awaitingOtp
                  ? "Enter the 8 digit passcode we sent."
                  : "Passwordless login. Start with your work email."}
              </p>
            </div>
          </div>

          <Card className="border-border/60 shadow-xl">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                Secure one-time code
              </div>
              <CardTitle className="text-2xl">
                {awaitingOtp
                  ? "We emailed you a code"
                  : "Request a code with email"}
              </CardTitle>
              <CardDescription>
                {awaitingOtp
                  ? "Use the code to unlock your notebook."
                  : "Use the same email as your Chrome extension."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {error ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              {!awaitingOtp ? (
                <form className="space-y-5" onSubmit={handleEmailSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
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
                    className="w-full"
                    disabled={isSubmitting || !email.trim()}
                  >
                    {isSubmitting ? "Sending code…" : "Email me a login code"}
                  </Button>
                </form>
              ) : (
                <form className="space-y-5" onSubmit={handleOtpSubmit}>
                  <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                    Code sent to{" "}
                    <span className="font-medium text-foreground">{email}</span>
                    .
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification code</Label>
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
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isSubmitting || !otp.trim()}
                    >
                      {isSubmitting ? "Verifying…" : "Verify code"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => resetPendingFlow()}
                    >
                      Start over
                    </Button>
                  </div>
                </form>
              )}

              <Separator className="bg-border" />

              <div className="flex items-start gap-3 rounded-2xl border border-border/80 p-4 text-sm text-muted-foreground">
                <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  Use the same email as the Chrome extension to sync instantly.
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 border-t border-border/60 bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Need help? founders@leetstack.com
              </p>
              <Button variant="ghost" size="sm" className="group">
                View release notes
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
});

export default LoginView;
