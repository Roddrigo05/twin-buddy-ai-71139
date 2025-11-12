import { NavLink, useLocation } from "react-router-dom";
import { 
  MessageSquare, 
  FileText, 
  Bell, 
  BarChart3, 
  Settings,
  Home,
  Smile,
  Target,
  Clock,
  Calendar,
  Bug
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useTranslation } from "@/contexts/UserSettingsContext";
import { useTheme } from "next-themes";
import logoDark from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";

export function AppSidebar() {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const location = useLocation();
  const { resolvedTheme } = useTheme();
  const isCollapsed = state === "collapsed";

  const items = [
    { title: t("dashboard"), url: "/dashboard", icon: Home },
    { title: t("chat"), url: "/chat", icon: MessageSquare },
    { title: t("notes"), url: "/notes", icon: FileText },
    { title: t("reminders"), url: "/reminders", icon: Bell },
    { title: t("moodJournal"), url: "/mood-journal", icon: Smile },
    { title: t("weeklyGoals"), url: "/weekly-goals", icon: Target },
    { title: t("routine"), url: "/routine", icon: Clock },
    { title: t("timeline"), url: "/timeline", icon: Calendar },
    { title: t("analytics"), url: "/analytics", icon: BarChart3 },
    { title: t("settings"), url: "/settings", icon: Settings },
    { title: t("reportBug"), url: "/report-bug", icon: Bug },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        <div className="flex items-center gap-2 px-4 py-6">
          <div className="flex h-10 w-10 items-center justify-center">
            <img 
              src={resolvedTheme === "dark" ? logoDark : logoLight} 
              alt="AI Twin Logo" 
              className="h-10 w-10 object-contain"
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sidebar-foreground">AI Twin</span>
              <span className="text-xs text-muted-foreground">{t("personalAssistant")}</span>
            </div>
          )}
        </div>

        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel>Menu</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
