import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, LogOut, Sun, Moon, Waves, Anchor, CircleDot, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "neutral" | "ocean" | "deep-ocean";

const THEMES: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: "light",      label: "theme.light",     icon: <Sun className="w-4 h-4" /> },
  { value: "dark",       label: "theme.dark",       icon: <Moon className="w-4 h-4" /> },
  { value: "neutral",    label: "theme.neutral",    icon: <CircleDot className="w-4 h-4" /> },
  { value: "ocean",      label: "theme.ocean",      icon: <Waves className="w-4 h-4" /> },
  { value: "deep-ocean", label: "theme.deep-ocean", icon: <Anchor className="w-4 h-4" /> },
];

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  if (theme === "dark" || theme === "deep-ocean") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  localStorage.setItem("sbi_theme", theme);
}

const LANGS = [
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "zh", label: "中文" },
  { code: "ko", label: "한국어" },
] as const;

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout, isDemo } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const [, setLocation] = useLocation();
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("sbi_theme") as Theme) || "light");

  useEffect(() => { applyTheme(theme); }, [theme]);

  const handleLogout = () => { logout(); setLocation("/login"); };
  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U"
    : "D";
  const currentTheme = THEMES.find(t => t.value === theme);

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-3 md:px-5 z-10 flex-shrink-0 gap-3">
      {/* Left */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="w-5 h-5" />
        </Button>
        {isDemo && (
          <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-md text-xs font-semibold border border-amber-500/20 select-none">
            DEMO
          </span>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1">
        {/* Theme picker */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Тема">
              {currentTheme?.icon}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Тема</p>
            {THEMES.map((th) => (
              <DropdownMenuItem key={th.value} onClick={() => setTheme(th.value)}
                className={cn("gap-2 cursor-pointer", theme === th.value && "bg-accent")}>
                {th.icon}
                <span>{t(th.label)}</span>
                {theme === th.value && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Language picker */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 font-mono text-xs font-bold uppercase">
              {language}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Язык</p>
            {LANGS.map((l) => (
              <DropdownMenuItem key={l.code} onClick={() => setLanguage(l.code as any)}
                className={cn("gap-2 cursor-pointer", language === l.code && "bg-accent")}>
                <span className="font-mono text-xs font-bold text-muted-foreground">{l.code.toUpperCase()}</span>
                <span>{l.label}</span>
                {language === l.code && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-destructive rounded-full" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 px-1.5 gap-2 rounded-full">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:block max-w-24 truncate">
                {isDemo ? "Demo" : (user?.firstName || "User")}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52" align="end">
            <div className="px-3 py-2">
              <p className="font-semibold text-sm">
                {isDemo ? "Demo режим" : `${user?.firstName} ${user?.lastName}`}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {isDemo ? "Только для просмотра" : user?.email}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer gap-2">
              <LogOut className="h-4 w-4" />
              {isDemo ? "Выйти из демо" : "Выйти"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
