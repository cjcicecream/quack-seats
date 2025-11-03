import { Home, LayoutDashboard, LayoutGrid, Users, ClipboardList, LogOut } from "lucide-react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

export function TeacherSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const { classId } = useParams();
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const mainItems = [
    { title: "Home", url: "/", icon: Home },
    { title: "Dashboard", url: "/teacher/dashboard", icon: LayoutDashboard },
  ];

  const classItems = classId
    ? [
        { title: "Settings", url: `/teacher/class/${classId}/settings`, icon: LayoutDashboard },
        { title: "Table Layout", url: `/teacher/class/${classId}/layout`, icon: LayoutGrid },
        { title: "Preferences", url: `/teacher/class/${classId}/preferences`, icon: ClipboardList },
        { title: "Seating Chart", url: `/teacher/class/${classId}/chart`, icon: Users },
      ]
    : [];

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-primary/10 text-primary font-medium hover:bg-primary/20"
      : "hover:bg-muted/50";

  return (
    <Sidebar
      className={isCollapsed ? "w-14" : "w-60"}
      collapsible="icon"
    >
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Class Navigation */}
        {classItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Class Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {classItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavCls}>
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Logout */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  {!isCollapsed && <span>Logout</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
