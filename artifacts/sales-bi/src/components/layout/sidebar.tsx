import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Database, Bot, Settings,
  LineChart, BarChart2, PieChart, Map as MapIcon,
  TrendingUp, ChevronDown, ChevronRight, BarChart3, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const mainNavItems = [
  { href: "/datasets", icon: Database, labelKey: "nav.datasets" },
  { href: "/agents", icon: Bot, labelKey: "nav.agents" },
];

const dashboardSubItems = [
  { href: "/dashboard", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { href: "/dashboard/kpi", icon: LineChart, labelKey: "nav.kpi" },
  { href: "/dashboard/compare", icon: BarChart2, labelKey: "nav.compare" },
  { href: "/dashboard/forecast", icon: TrendingUp, labelKey: "nav.forecast" },
  { href: "/dashboard/scenario", icon: Settings, labelKey: "nav.scenario" },
  { href: "/dashboard/portfolio", icon: PieChart, labelKey: "nav.portfolio" },
  { href: "/dashboard/map", icon: MapIcon, labelKey: "nav.map" },
];

const adminNavItems = [
  { href: "/admin", icon: Settings, labelKey: "nav.admin" },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  mobile?: boolean;
  collapsed?: boolean;
}

export function Sidebar({ open = true, onClose, mobile = false, collapsed = false }: SidebarProps) {
  const [location] = useLocation();
  const { t } = useI18n();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [dashOpen, setDashOpen] = useState(true);

  const isDashboardRoute = location.startsWith("/dashboard");

  function NavItem({ href, icon: Icon, labelKey, indent = false }: { href: string; icon: any; labelKey: string; indent?: boolean }) {
    const isActive = location === href;
    return (
      <Link href={href} onClick={mobile ? onClose : undefined}
        title={collapsed ? t(labelKey) : undefined}
        className={cn(
          "flex items-center gap-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150",
          collapsed ? "justify-center px-2" : "px-3",
          indent && !collapsed && "ml-3",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}>
        <Icon className={cn("flex-shrink-0", indent ? "w-3.5 h-3.5" : "w-4 h-4")} />
          {!collapsed && <span className="truncate">{t(labelKey)}</span>}
      </Link>
    );
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "h-14 border-b border-sidebar-border flex items-center flex-shrink-0",
        collapsed ? "justify-center px-2" : "justify-between px-4",
      )}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center flex-shrink-0"
            title={collapsed ? "Sales BI" : undefined}
          >
            <BarChart3 className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-bold text-sm text-sidebar-foreground">Sales BI</span>}
        </div>
        {mobile && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {/* Analytics section */}
        <div className="mb-1">
          <button
            onClick={() => setDashOpen(v => !v)}
            title={collapsed ? (t("nav.analytics") || "Аналитика") : undefined}
            className={cn(
              "w-full flex items-center gap-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150",
              collapsed ? "justify-center px-2" : "px-3",
              isDashboardRoute
                ? "text-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="flex-1 text-left">{t("nav.analytics") || "Аналитика"}</span>}
            {!collapsed && (dashOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
          </button>
          {(dashOpen || collapsed) && (
            <div className="mt-0.5 space-y-0.5">
              {dashboardSubItems.map((item) => (
                <NavItem key={item.href} {...item} indent />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-0.5">
          {mainNavItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>

        {/* Admin section */}
        {(isAdmin || true) && ( // Show admin link always for now
          <>
            <div className={cn("pt-3 pb-1", collapsed && "px-2")}>
              <p className={cn(
                "px-3 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-widest",
                collapsed && "h-px px-0 bg-sidebar-border text-[0px]",
              )}>
                Admin
              </p>
            </div>
            <div className="space-y-0.5">
              {adminNavItems.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer version */}
      <div className={cn(
        "py-3 border-t border-sidebar-border flex-shrink-0",
        collapsed ? "px-2" : "px-4",
      )}>
        {!collapsed && <p className="text-xs text-sidebar-foreground/30">v1.0.0 · Sales BI Platform</p>}
      </div>
    </div>
  );

  if (mobile) {
    return (
      <>
        {/* Overlay */}
        {open && (
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />
        )}
        {/* Drawer */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border md:hidden transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full"
        )}>
          {sidebarContent}
        </aside>
      </>
    );
  }

  return (
    <aside className={cn(
      "border-r border-sidebar-border bg-sidebar flex-shrink-0 hidden md:flex flex-col h-full transition-[width] duration-200",
      collapsed ? "w-16" : "w-60",
    )}>
      {sidebarContent}
    </aside>
  );
}
