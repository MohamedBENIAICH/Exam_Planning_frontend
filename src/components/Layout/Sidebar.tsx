import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Calendar,
  Home,
  Users,
  Building,
  Menu,
  User2,
  User,
  Clock,
  History,
  Settings,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fr } from "@/translations/fr";

const mainNavItems = [
  { path: "/", label: fr.navigation.dashboard, icon: Home },
  { path: "/exams", label: fr.navigation.exams, icon: Calendar },
  { path: "/past-exams", label: fr.navigation.pastExams, icon: History },
  { path: "/upcoming-exams", label: fr.navigation.upcomingExams, icon: Clock },
  { path: "/concours", label: fr.navigation.concours, icon: Calendar },
];

const settingsNavItems = [
  { path: "/classrooms", label: fr.navigation.classrooms, icon: Building },
  { path: "/professeurs", label: fr.navigation.professeurs, icon: User2 },
  { path: "/superviseurs", label: fr.navigation.superviseurs, icon: User },
  { path: "/formations", label: fr.navigation.formations, icon: Users },
  { path: "/filieres", label: fr.navigation.filieres, icon: Users },
  { path: "/modules", label: fr.navigation.modules, icon: Users },
];

const Sidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);

  return (
    <div
      className={cn(
        "h-screen bg-sidebar border-r border-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <h1 className="text-lg font-bold exam-scheduler-logo">
            Planificateur d'examens
          </h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 py-4">
        <ul className="space-y-2 px-2">
          {mainNavItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === item.path
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon
                  className={cn("h-5 w-5", collapsed ? "mx-auto" : "mr-3")}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            </li>
          ))}

          <li key="settings">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors justify-between",
                showSettings
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <div className="flex items-center">
                <Settings
                  className={cn("h-5 w-5", collapsed ? "mx-auto" : "mr-3")}
                />
                {!collapsed && <span>Paramètres</span>}
              </div>
              {!collapsed && (
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    showSettings ? "rotate-180" : "rotate-0"
                  )}
                />
              )}
            </button>
            {showSettings && !collapsed && (
              <ul className="ml-4 mt-2 space-y-1">
                {settingsNavItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        location.pathname === item.path
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4 mr-3" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
