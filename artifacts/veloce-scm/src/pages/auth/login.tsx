import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, GraduationCap, ChevronDown, ChevronUp } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showInstructor, setShowInstructor] = useState(false);
  const { login, isLoggingIn } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ data: { email, password } });
  };

  const fillInstructor = () => {
    setEmail("instructor@ggc.edu");
    setPassword("instructor123");
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-20 bg-muted/20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md space-y-4"
      >
        <Card className="glass-card border-0 shadow-2xl">
          <CardHeader className="space-y-2 text-center pt-8">
            <div className="w-12 h-12 rounded-xl bg-primary mx-auto flex items-center justify-center text-white font-display font-bold text-xl mb-4 shadow-lg shadow-primary/30">
              V
            </div>
            <CardTitle className="text-3xl font-display">Welcome back</CardTitle>
            <CardDescription className="text-base">
              Enter your credentials to access the simulation
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-background/50 focus:bg-background transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-background/50 focus:bg-background transition-colors"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register">
                <span className="text-primary font-semibold hover:underline cursor-pointer">
                  Register here
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Instructor Portal */}
        <Card className="border border-amber-200/60 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-800/40 shadow-sm">
          <button
            type="button"
            onClick={() => setShowInstructor(!showInstructor)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-amber-50/60 dark:hover:bg-amber-950/30 transition-colors rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Instructor Portal
              </span>
            </div>
            {showInstructor
              ? <ChevronUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              : <ChevronDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            }
          </button>

          {showInstructor && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="px-5 pb-5 space-y-3"
            >
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
                Instructors use the same login form above. Use your faculty credentials to access the gradebook and module settings.
              </p>
              <div className="rounded-lg bg-amber-100/60 dark:bg-amber-900/30 border border-amber-200/60 dark:border-amber-700/40 p-3 space-y-1.5 font-mono text-xs text-amber-900 dark:text-amber-200">
                <div className="flex justify-between">
                  <span className="text-amber-600 dark:text-amber-400">Email:</span>
                  <span>instructor@ggc.edu</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-600 dark:text-amber-400">Password:</span>
                  <span>instructor123</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillInstructor}
                className="w-full border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100/60 dark:hover:bg-amber-900/30 text-xs"
              >
                Fill in instructor credentials
              </Button>
            </motion.div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
