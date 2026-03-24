import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, User, BookOpen, GraduationCap, LayoutDashboard, Settings, Activity } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const publicLinks = [
    { href: "/about", label: "About", icon: BookOpen },
    { href: "/intro", label: "Introduction", icon: Activity },
  ];

  const studentLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/module/M1", label: "Module 1", icon: BookOpen },
    { href: "/module/M2", label: "Module 2", icon: BookOpen },
    { href: "/module/M3", label: "Module 3", icon: BookOpen },
  ];

  const instructorLinks = [
    { href: "/instructor/gradebook", label: "Gradebook", icon: GraduationCap },
    { href: "/instructor/settings", label: "Settings", icon: Settings },
  ];

  const navLinks = isAuthenticated 
    ? (user?.role === 'instructor' ? instructorLinks : studentLinks)
    : publicLinks;

  const NavItems = ({ mobile = false }) => (
    <>
      {navLinks.map((link) => {
        const isActive = location === link.href || location.startsWith(`${link.href}/`);
        const Icon = link.icon;
        return (
          <Link key={link.href} href={link.href} onClick={() => mobile && setIsMobileMenuOpen(false)}>
            <span className={`
              flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
              ${isActive 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }
              ${mobile ? "w-full text-base py-3" : ""}
            `}>
              <Icon className="w-4 h-4" />
              {link.label}
            </span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6 md:gap-10">
            <Link href={isAuthenticated ? (user?.role === 'instructor' ? "/instructor/gradebook" : "/dashboard") : "/"}>
              <span className="flex items-center gap-2 cursor-pointer group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all">
                  V
                </div>
                <span className="font-display font-bold text-xl tracking-tight hidden sm:inline-block">
                  Veloce<span className="text-primary">Wear</span>
                </span>
              </span>
            </Link>
            
            <nav className="hidden md:flex gap-1">
              <NavItems />
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="w-24 h-9 bg-muted rounded-md animate-pulse" />
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 rounded-full pl-3 pr-4 border border-border/50 hover:bg-secondary flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium truncate max-w-[100px] sm:max-w-[150px]">
                      {user?.name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none font-display">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-muted-foreground">
                    Role: <span className="ml-1 font-medium text-foreground capitalize">{user?.role}</span>
                  </DropdownMenuItem>
                  {user?.section && (
                    <DropdownMenuItem className="text-muted-foreground">
                      Section: <span className="ml-1 font-medium text-foreground">{user?.section}</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" className="font-medium hover:bg-primary/5 hover:text-primary">
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="font-medium shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:-translate-y-0.5">
                    Register
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-80 p-0 border-l-border/50">
                <SheetHeader className="p-6 border-b border-border/50 bg-muted/30">
                  <SheetTitle className="font-display font-bold text-left flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white text-sm">V</div>
                    VeloceWear
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-1 p-4">
                  <NavItems mobile />
                  
                  {!isAuthenticated && (
                    <div className="flex flex-col gap-2 mt-6 pt-6 border-t border-border/50">
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full justify-start">Log in</Button>
                      </Link>
                      <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full justify-start">Register</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex-1 flex flex-col"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-border/40 py-8 md:py-12 bg-muted/20">
        <div className="container mx-auto px-4 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">V</div>
            <span className="font-display font-semibold text-muted-foreground">VeloceWear Simulation</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Hasan Uvet, Associate Professor of Supply Chain Management. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
