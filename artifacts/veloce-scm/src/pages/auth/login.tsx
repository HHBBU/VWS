import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoggingIn } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ data: { email, password } });
  };

  return (
    <div className="flex-1 flex min-h-full">
      {/* Left panel — hero image (hidden on mobile) */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden flex-col items-center justify-end">
        <img
          src={`${import.meta.env.BASE_URL}img/hero-login.png`}
          alt="Global supply chain network"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="relative z-10 p-10 text-white w-full">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-2">SCM 4330 · Georgia Gwinnett College</p>
          <h2 className="text-3xl font-bold leading-tight mb-3">Veloce Wear<br />Supply Chain Simulation</h2>
          <p className="text-white/70 text-sm max-w-xs leading-relaxed">
            Make real sourcing, production, and distribution decisions as a supply chain manager for a global fashion brand.
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
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
      </motion.div>
      </div>
    </div>
  );
}
