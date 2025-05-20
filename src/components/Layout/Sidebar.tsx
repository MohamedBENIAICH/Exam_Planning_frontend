import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar, Home, Users, Building, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fr } from "@/translations/fr";

const navItems = [
  { path: "/", label: fr.navigation.dashboard, icon: Home },
  //{ path: "/students", label: fr.navigation.students, icon: Users },
  // { path: "/classrooms", label: fr.navigation.classrooms, icon: Building },
  { path: "/exams", label: fr.navigation.exams, icon: Calendar },
];

const Sidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);

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
          {navItems.map((item) => (
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
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
