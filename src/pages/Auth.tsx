import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { signInSchema, signUpSchema, validateForm } from "@/lib/validations";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().trim().email("Please enter a valid email"),
});

const newPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword, updatePassword, signInAsGuest } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup" | "forgot" | "reset">(
    searchParams.get("mode") === "signup" ? "signup" :
      searchParams.get("mode") === "forgot" ? "forgot" :
        searchParams.get("mode") === "reset" ? "reset" : "signin"
  );
  const [role, setRole] = useState<"volunteer" | "ngo">(
    (searchParams.get("role") as "volunteer" | "ngo") || "volunteer"
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Update mode when URL params change (for password reset callback)
  useEffect(() => {
    const urlMode = searchParams.get("mode");
    if (urlMode === "reset") {
      setMode("reset");
    }
  }, [searchParams]);

  const validate = () => {
    if (mode === "signin") {
      const result = validateForm(signInSchema, { email, password });
      setErrors(result.errors);
      return result.success;
    } else if (mode === "signup") {
      const result = validateForm(signUpSchema, { email, password, fullName, role, orgName });
      setErrors(result.errors);
      return result.success;
    } else if (mode === "forgot") {
      const result = emailSchema.safeParse({ email });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return false;
      }
      setErrors({});
      return true;
    } else if (mode === "reset") {
      const result = newPasswordSchema.safeParse({ password });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return false;
      }
      setErrors({});
      return true;
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
        navigate("/dashboard");
      } else if (mode === "signup") {
        await signUp(email, password, role, fullName, orgName);
        navigate("/dashboard");
      } else if (mode === "forgot") {
        await resetPassword(email);
        setMode("signin");
      } else if (mode === "reset") {
        await updatePassword(password);
        navigate("/dashboard");
      }
    } catch (error) {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = (guestRole: "volunteer" | "ngo") => {
    signInAsGuest(guestRole);
    navigate("/dashboard");
  };

  const renderForgotPassword = () => (
    <Card className="glass shadow-2xl animate-slide-up">
      <CardHeader className="text-center pb-2">
        <Link to="/" className="flex items-center justify-center gap-2 mb-4 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-glow-primary group-hover:scale-110 transition-transform duration-300">
            <span className="text-2xl font-bold text-primary-foreground">S</span>
          </div>
        </Link>
        <CardTitle className="text-2xl font-display font-bold">Reset Password</CardTitle>
        <CardDescription>
          Enter your email and we'll send you a reset link
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
            <Input
              id="email"
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="bg-background/50 focus:bg-background transition-colors"
            />
            {errors.email && <p className="text-xs text-destructive animate-fade-in">{errors.email}</p>}
          </div>

          <Button type="submit" className="w-full mt-2" variant="hero" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={() => setMode("signin")}
          >
            Back to Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderResetPassword = () => (
    <Card className="glass shadow-2xl animate-slide-up">
      <CardHeader className="text-center pb-2">
        <Link to="/" className="flex items-center justify-center gap-2 mb-4 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-glow-primary group-hover:scale-110 transition-transform duration-300">
            <span className="text-2xl font-bold text-primary-foreground">S</span>
          </div>
        </Link>
        <CardTitle className="text-2xl font-display font-bold">Set New Password</CardTitle>
        <CardDescription>
          Choose a strong password for your account
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10 bg-background/50 focus:bg-background transition-colors"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.password && <p className="text-xs text-destructive animate-fade-in">{errors.password}</p>}
            <PasswordStrengthIndicator password={password} />
          </div>

          <Button type="submit" className="w-full mt-2" variant="hero" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderAuthForm = () => (
    <Card className="glass shadow-2xl animate-slide-up overflow-hidden">
      <CardHeader className="text-center pb-2">
        <Link to="/" className="flex items-center justify-center gap-2 mb-4 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-glow-primary group-hover:scale-110 transition-transform duration-300">
            <span className="text-2xl font-bold text-primary-foreground">S</span>
          </div>
        </Link>
        <CardTitle className="text-2xl font-display font-bold tracking-tight">
          {mode === "signin" ? "Welcome Back" : "Create Account"}
        </CardTitle>
        <CardDescription className="text-base">
          {mode === "signin"
            ? "Sign in to access your SkillBridge dashboard"
            : "Join our community of volunteers and NGOs"}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1">
            <TabsTrigger value="signin" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Sign In</TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-4 animate-fade-in">
                {/* Visual Role Selection */}
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div
                    className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${role === "volunteer"
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-transparent bg-muted/30 hover:bg-muted/50"
                      }`}
                    onClick={() => setRole("volunteer")}
                  >
                    <div className={`p-2 rounded-full mb-2 ${role === "volunteer" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                      <Users className="w-5 h-5" />
                    </div>
                    <span className={`text-sm font-semibold ${role === "volunteer" ? "text-primary" : "text-muted-foreground"}`}>Volunteer</span>
                    {role === "volunteer" && <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />}
                  </div>

                  <div
                    className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${role === "ngo"
                        ? "border-secondary bg-secondary/5 shadow-md"
                        : "border-transparent bg-muted/30 hover:bg-muted/50"
                      }`}
                    onClick={() => setRole("ngo")}
                  >
                    <div className={`p-2 rounded-full mb-2 ${role === "ngo" ? "bg-secondary text-white" : "bg-muted text-muted-foreground"}`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className={`text-sm font-semibold ${role === "ngo" ? "text-secondary" : "text-muted-foreground"}`}>NGO</span>
                    {role === "ngo" && <div className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full border-2 border-background" />}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="bg-background/50 focus:bg-background transition-colors"
                  />
                  {errors.fullName && <p className="text-xs text-destructive animate-fade-in">{errors.fullName}</p>}
                </div>

                {role === "ngo" && (
                  <div className="space-y-2 animate-slide-up">
                    <Label htmlFor="orgName" className="text-sm font-medium">Organization Name</Label>
                    <Input
                      id="orgName"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Empower Foundation"
                      className="bg-background/50 focus:bg-background transition-colors"
                    />
                    {errors.orgName && <p className="text-xs text-destructive animate-fade-in">{errors.orgName}</p>}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="bg-background/50 focus:bg-background transition-colors"
              />
              {errors.email && <p className="text-xs text-destructive animate-fade-in">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                {mode === "signin" && (
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 h-auto text-xs text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setMode("forgot")}
                  >
                    Forgot password?
                  </Button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10 bg-background/50 focus:bg-background transition-colors"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.password && <p className="text-xs text-destructive animate-fade-in">{errors.password}</p>}
              {mode === "signup" && <PasswordStrengthIndicator password={password} />}
            </div>

            <Button type="submit" className="w-full mt-4 h-11" variant="hero" disabled={loading}>
              {loading ? "Processing..." : mode === "signin" ? "Sign In" : "Get Started"}
            </Button>
          </form>
        </Tabs>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background/20 px-3 py-1 rounded-full backdrop-blur-sm border border-muted text-muted-foreground font-medium">
              Quick Explore
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            type="button"
            variant="outline"
            className="group flex flex-col items-center gap-1 h-auto py-3 bg-white/5 hover:bg-primary/5 hover:border-primary/50 transition-all"
            onClick={() => handleGuestLogin("volunteer")}
          >
            <Users className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-xs font-semibold group-hover:text-primary">Guest Volunteer</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="group flex flex-col items-center gap-1 h-auto py-3 bg-white/5 hover:bg-secondary/5 hover:border-secondary/50 transition-all"
            onClick={() => handleGuestLogin("ngo")}
          >
            <Building2 className="w-5 h-5 text-muted-foreground group-hover:text-secondary transition-colors" />
            <span className="text-xs font-semibold group-hover:text-secondary">Guest NGO</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-soft via-background to-secondary-soft p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse-soft" />
      <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[120px] animate-pulse-soft" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_transparent_0%,_hsl(var(--background))_100%)] opacity-40" />

      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-all hover:-translate-x-1">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Return to Landing Page</span>
        </Link>

        {mode === "forgot" && renderForgotPassword()}
        {mode === "reset" && renderResetPassword()}
        {(mode === "signin" || mode === "signup") && renderAuthForm()}

        <p className="mt-8 text-center text-xs text-muted-foreground/60">
          &copy; 2024 SkillBridge. All rights reserved. Professional volunteering made simple.
        </p>
      </div>
    </div>
  );
}
