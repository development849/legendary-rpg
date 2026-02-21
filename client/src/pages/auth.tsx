import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Sword, Eye, EyeOff, Scroll, Users, Sparkles, CheckCircle2 } from "lucide-react";

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "At least 3 characters")
    .max(30, "At most 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Letters, numbers, underscores, hyphens only"),
  email: z.string().email("Invalid email address"),
  displayName: z.string().min(1, "Display name required").max(50, "Too long"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username required"),
  password: z.string().min(1, "Password required"),
});

type RegisterForm = z.infer<typeof registerSchema>;
type LoginForm = z.infer<typeof loginSchema>;

const FEATURES = [
  { icon: Sword, label: "Choose your class and race", detail: "Fighter, Rogue, Wizard, or Cleric" },
  { icon: Scroll, label: "AI-powered Game Master", detail: "GPT-4o narrates your story in real time" },
  { icon: Users, label: "Solo or party play", detail: "Join friends with invite codes" },
  { icon: Sparkles, label: "Persistent world", detail: "Your choices shape the chronicle forever" },
];

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const checks = [
    { test: password.length >= 8, label: "8+ characters" },
    { test: /[A-Z]/.test(password), label: "Uppercase letter" },
    { test: /[0-9]/.test(password), label: "Number" },
    { test: /[^a-zA-Z0-9]/.test(password), label: "Special character" },
  ];

  const score = checks.filter(c => c.test).length;
  const colors = ["", "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500"];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];

  return (
    <div className="space-y-2 mt-1">
      <div className="flex gap-1 h-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`flex-1 rounded-full transition-colors ${i <= score ? colors[score] : "bg-secondary"}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {checks.map(check => (
          <span key={check.label} className={`text-xs flex items-center gap-1 ${check.test ? "text-emerald-400" : "text-muted-foreground/50"}`}>
            {check.test ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-current" />}
            {check.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", displayName: "", password: "", confirmPassword: "" },
  });

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const watchPassword = registerForm.watch("password");

  async function onRegister(data: RegisterForm) {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          displayName: data.displayName,
          password: data.password,
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        if (body.issues) {
          const first = Object.values(body.issues)[0];
          toast({ title: "Registration failed", description: Array.isArray(first) ? first[0] : String(first), variant: "destructive" });
        } else {
          toast({ title: "Registration failed", description: body.error, variant: "destructive" });
        }
        return;
      }

      queryClient.setQueryData(["/api/auth/user"], body.user);
      toast({ title: "Welcome to Mythweave!", description: `Your account has been created, ${data.displayName}.` });
      navigate("/dashboard");
    } catch {
      toast({ title: "Network error", description: "Could not connect. Please try again.", variant: "destructive" });
    }
  }

  async function onLogin(data: LoginForm) {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const body = await res.json();

      if (!res.ok) {
        toast({ title: "Sign in failed", description: body.error, variant: "destructive" });
        return;
      }

      queryClient.setQueryData(["/api/auth/user"], body.user);
      toast({ title: "Welcome back!", description: `Signed in as ${body.user.firstName || body.user.username}.` });
      navigate("/dashboard");
    } catch {
      toast({ title: "Network error", description: "Could not connect. Please try again.", variant: "destructive" });
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left: Feature panel */}
      <div className="hidden lg:flex flex-col justify-center px-12 w-[480px] flex-shrink-0 relative overflow-hidden border-r border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-900/10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-px bg-primary/60" />
              <Sword className="w-5 h-5 text-primary" />
              <div className="w-8 h-px bg-primary/60" />
            </div>
            <h1 className="text-4xl font-sans font-bold tracking-widest text-foreground glow-gold">
              MYTHWEAVE
            </h1>
            <p className="text-primary font-sans tracking-widest text-xs uppercase">The Living Chronicle</p>
            <p className="text-muted-foreground font-serif italic text-lg leading-relaxed max-w-xs">
              "An AI Game Master weaves your story in real time. Every choice shapes the world."
            </p>
          </div>

          <div className="space-y-5">
            {FEATURES.map(({ icon: Icon, label, detail }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-sans font-semibold tracking-wide text-sm">{label}</p>
                  <p className="text-muted-foreground font-serif text-sm">{detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-md border border-primary/10 bg-primary/5 p-4">
            <p className="text-xs text-muted-foreground/60 font-serif italic">
              "The dungeon breathes around you. Somewhere in the dark, something ancient stirs..."
            </p>
            <p className="text-xs text-primary/50 mt-2 font-sans tracking-wide">— The Chronicle, Turn 1</p>
          </div>
        </div>
      </div>

      {/* Right: Auth forms */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Tab switcher */}
          <div className="flex rounded-md border border-border bg-secondary/30 p-1 gap-1">
            <button
              onClick={() => setTab("login")}
              data-testid="tab-login"
              className={`flex-1 py-2.5 rounded text-sm font-sans tracking-wide transition-all ${
                tab === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab("register")}
              data-testid="tab-register"
              className={`flex-1 py-2.5 rounded text-sm font-sans tracking-wide transition-all ${
                tab === "register" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Login Form */}
          {tab === "login" && (
            <Card className="border-border">
              <CardHeader className="pb-4">
                <CardTitle className="font-sans tracking-widest text-xl">Welcome Back</CardTitle>
                <CardDescription className="font-serif italic">
                  Sign in to continue your adventure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="identifier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-sans tracking-widest uppercase text-muted-foreground">
                            Email or Username
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="your@email.com or username"
                              className="font-serif"
                              data-testid="input-identifier"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-sans tracking-widest uppercase text-muted-foreground">
                            Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="font-serif pr-10"
                                data-testid="input-password-login"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(p => !p)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                data-testid="button-toggle-password"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full mt-2"
                      disabled={loginForm.formState.isSubmitting}
                      data-testid="button-login"
                    >
                      {loginForm.formState.isSubmitting ? "Signing in..." : "Enter the Chronicle"}
                    </Button>
                  </form>
                </Form>

                <p className="text-center text-xs text-muted-foreground mt-4 font-serif">
                  No account?{" "}
                  <button
                    onClick={() => setTab("register")}
                    className="text-primary hover:underline"
                    data-testid="link-switch-register"
                  >
                    Create one for free
                  </button>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Register Form */}
          {tab === "register" && (
            <Card className="border-border">
              <CardHeader className="pb-4">
                <CardTitle className="font-sans tracking-widest text-xl">Join the Chronicle</CardTitle>
                <CardDescription className="font-serif italic">
                  Create your account and begin your legend
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-sans tracking-widest uppercase text-muted-foreground">
                              Username *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="heroic_knight"
                                className="font-sans"
                                data-testid="input-username"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-sans tracking-widest uppercase text-muted-foreground">
                              Display Name *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Aldric"
                                className="font-serif"
                                data-testid="input-display-name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-sans tracking-widest uppercase text-muted-foreground">
                            Email Address *
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="your@email.com"
                              className="font-serif"
                              data-testid="input-email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-sans tracking-widest uppercase text-muted-foreground">
                            Password *
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Min. 8 chars, 1 uppercase, 1 number"
                                className="font-serif pr-10"
                                data-testid="input-password-register"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(p => !p)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <PasswordStrength password={watchPassword} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-sans tracking-widest uppercase text-muted-foreground">
                            Confirm Password *
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showConfirm ? "text" : "password"}
                                placeholder="••••••••"
                                className="font-serif pr-10"
                                data-testid="input-confirm-password"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirm(p => !p)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <p className="text-xs text-muted-foreground/60 font-serif">
                      By registering, you agree to keep your account secure. Mythweave never sells your data.
                    </p>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerForm.formState.isSubmitting}
                      data-testid="button-register"
                    >
                      {registerForm.formState.isSubmitting ? "Forging your account..." : "Begin Your Legend"}
                    </Button>
                  </form>
                </Form>

                <p className="text-center text-xs text-muted-foreground mt-4 font-serif">
                  Already have an account?{" "}
                  <button
                    onClick={() => setTab("login")}
                    className="text-primary hover:underline"
                    data-testid="link-switch-login"
                  >
                    Sign in
                  </button>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
