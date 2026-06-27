import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, User, LogOut, Settings } from "lucide-react";

export function Topbar() {
  const { user, logout, isDemo } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const initials = user ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}` : "U";

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 md:px-6 z-10 flex-shrink-0">
      <div className="flex items-center gap-4">
        {isDemo && (
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-md text-sm font-medium border border-primary/20">
            {t("login.demo")}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 px-0 uppercase font-medium">
              {language}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLanguage("ru")}>Русский (ru)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage("en")}>English (en)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage("de")}>Deutsch (de)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage("fr")}>Français (fr)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage("zh")}>中文 (zh)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage("ko")}>한국어 (ko)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full"></span>
        </Button>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user.firstName} {user.lastName}</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex w-full items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" onClick={() => setLocation("/login")}>
            {t("login.submit")}
          </Button>
        )}
      </div>
    </header>
  );
}
