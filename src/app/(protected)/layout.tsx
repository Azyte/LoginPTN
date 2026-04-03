"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useTheme } from "@/providers/theme-provider";
import {
  LayoutDashboard, BookOpen, ClipboardList, BarChart3, Bot, Users,
  FileText, HardDrive, Lightbulb, GraduationCap, User, Settings,
  LogOut, Menu, X, ChevronLeft, Moon, Sun, Bell
} from "lucide-react";
import { getInitials } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bank-soal", label: "Bank Soal", icon: BookOpen },
  { href: "/tryout", label: "Tryout", icon: ClipboardList },
  { href: "/analytics", label: "Analitik", icon: BarChart3 },
  { href: "/ai-assistant", label: "AI Assistant", icon: Bot },
  { href: "/study-groups", label: "Study Groups", icon: Users },
  { href: "/pdf-workspace", label: "PDF Workspace", icon: FileText },
  { href: "/study-drive", label: "Study Drive", icon: HardDrive },
  { href: "/tips-strategi", label: "Tips & Strategi", icon: Lightbulb },
  { href: "/score-check", label: "Cek Peluang PTN", icon: GraduationCap },
];

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { profile, signOut, loading } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl animated-gradient flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl animated-gradient flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && <span className="text-lg font-bold gradient-text">LoginPTN</span>}
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden lg:flex w-7 h-7 items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${!sidebarOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`sidebar-link ${isActive ? "active" : ""}`}
              title={!sidebarOpen ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-border/50 space-y-1">
        <Link
          href="/profile"
          onClick={() => setMobileOpen(false)}
          className={`sidebar-link ${pathname === "/profile" ? "active" : ""}`}
        >
          <User className="w-5 h-5 shrink-0" />
          {sidebarOpen && <span>Profil</span>}
        </Link>
        <Link
          href="/settings"
          onClick={() => setMobileOpen(false)}
          className={`sidebar-link ${pathname === "/settings" ? "active" : ""}`}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {sidebarOpen && <span>Pengaturan</span>}
        </Link>
        <button onClick={signOut} className="sidebar-link w-full text-destructive hover:text-destructive">
          <LogOut className="w-5 h-5 shrink-0" />
          {sidebarOpen && <span>Keluar</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-border/50 bg-card fixed top-0 left-0 h-full z-40 transition-all duration-300 ${
          sidebarOpen ? "w-[260px]" : "w-[72px]"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-[280px] h-full bg-card border-r border-border/50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "lg:ml-[260px]" : "lg:ml-[72px]"}`}>
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/50">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl hover:bg-secondary"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="w-9 h-9 rounded-xl hover:bg-secondary flex items-center justify-center text-muted-foreground"
              >
                {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <button className="w-9 h-9 rounded-xl hover:bg-secondary flex items-center justify-center text-muted-foreground relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
              </button>

              <Link href="/profile" className="flex items-center gap-2 pl-3 border-l border-border/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                  {profile?.name ? getInitials(profile.name) : "?"}
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium leading-none">{profile?.name || "User"}</div>
                  <div className="text-xs text-muted-foreground capitalize">{profile?.role || "student"}</div>
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
