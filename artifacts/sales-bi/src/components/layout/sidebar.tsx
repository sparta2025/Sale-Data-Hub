import React from "react";
import { Link, useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import {
  LayoutDashboard,
  Database,
  Bot,
  Settings,
  LineChart,
  BarChart2,
  PieChart,
  Map as MapIcon,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { href: "/datasets", icon: Database, labelKey: "nav.datasets" },
  { href: "/agents", icon: Bot, labelKey: "nav.agents" },
];

const adminNavItems = [
  { href: "/admin", icon: Settings, labelKey: "nav.admin" },
];

const dashboardSubItems = [
  { href: "/dashboard/kpi", icon: LineChart, labelKey: "nav.kpi" },
  { href: "/dashboard/compare", icon: BarChart2, labelKey: "nav.compare" },
  { href: "/dashboard/forecast", icon: TrendingUp, labelKey: "nav.forecast" },
  { href: "/dashboard/scenario", icon: Settings, labelKey: "nav.scenario" },
  { href: "/dashboard/portfolio", icon: PieChart, labelKey: "nav.portfolio" },
  { href: "/dashboard/map", icon: MapIcon, labelKey: "nav.map" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { t } = useI18n();
  // TODO: Check if user is admin
  const isAdmin = true;

  const isDashboardRoute = location.startsWith("/dashboard");

  return (
    <aside className="w-64 border-r bg-sidebar flex-shrink-0 flex flex-col h-full hidden md:flex">
      <div className="h-14 border-b flex items-center px-4 font-bold text-lg text-sidebar-foreground">
        Sales BI Platform
      </div>
      
      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-2">
          {mainNavItems.map((item) => {
            const isActive = location === item.href || (item.href === "/dashboard" && isDashboardRoute && location === "/dashboard");
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}>
                <item.icon className="w-4 h-4" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        {isDashboardRoute && (
          <div className="mt-6">
            <div className="px-4 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
              Analysis Views
            </div>
            <nav className="space-y-1 px-2">
              {dashboardSubItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href} className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ml-4",
                    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}>
                    <item.icon className="w-4 h-4" />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {isAdmin && (
          <div className="mt-8">
            <div className="px-4 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2">
              Administration
            </div>
            <nav className="space-y-1 px-2">
              {adminNavItems.map((item) => {
                const isActive = location.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href} className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}>
                    <item.icon className="w-4 h-4" />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </aside>
  );
}
