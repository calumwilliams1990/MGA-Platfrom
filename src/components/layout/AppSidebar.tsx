import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FileText,
  BarChart3,
  FileCheck,
  Settings,
  ChevronDown,
  LogOut,
  MoreVertical,
  ShieldCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Products",
    url: "/products",
    icon: Package,
    children: [
      { title: "Marine Tow", url: "/products/marine-tow" },
    ],
  },
  {
    title: "Documents",
    url: "/documents",
    icon: FileText,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
  },
  {
    title: "My Policies",
    url: "/policies",
    icon: FileCheck,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const isAdmin = useIsAdmin();
  const [productsOpen, setProductsOpen] = useState(
    location.pathname.startsWith("/products")
  );

  const isActive = (url: string) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar
      className="border-r border-app-sidebar-border bg-app-sidebar"
      collapsible="icon"
    >
      <div className="flex h-16 items-center px-4 border-b border-app-sidebar-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">LP</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-app-sidebar-foreground">
              Liability <span className="italic font-normal">Pro</span>
            </span>
          )}
        </Link>
      </div>

      <SidebarContent className="px-2 py-4 bg-app-sidebar">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {[
                ...mainNavItems,
                ...(isAdmin
                  ? [{ title: "Administrator", url: "/admin", icon: ShieldCheck } as const]
                  : []),
              ].map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.children ? (
                    <Collapsible
                      open={productsOpen}
                      onOpenChange={setProductsOpen}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          className={cn(
                            "w-full justify-between text-app-sidebar-foreground hover:bg-app-sidebar-accent",
                            isActive(item.url) &&
                              "bg-app-sidebar-accent text-app-sidebar-foreground"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="h-5 w-5" />
                            {!collapsed && <span>{item.title}</span>}
                          </div>
                          {!collapsed && (
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 transition-transform",
                                productsOpen && "rotate-180"
                              )}
                            />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {!collapsed && (
                        <CollapsibleContent className="pl-8 mt-1 space-y-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.url}
                              to={child.url}
                              className={cn(
                                "block py-2 px-3 rounded-md text-sm text-app-sidebar-foreground/70 hover:text-app-sidebar-foreground hover:bg-app-sidebar-accent transition-colors",
                                isActive(child.url) &&
                                  "bg-app-sidebar-accent text-app-sidebar-foreground"
                              )}
                            >
                              {child.title}
                            </Link>
                          ))}
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        "text-app-sidebar-foreground hover:bg-app-sidebar-accent",
                        isActive(item.url) &&
                          "bg-app-sidebar-accent text-app-sidebar-foreground"
                      )}
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-app-sidebar-border p-4 bg-app-sidebar">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback className="bg-app-sidebar-accent text-app-sidebar-foreground">
              CW
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-app-sidebar-foreground truncate">
                  Calum W
                </p>
                <p className="text-xs text-app-sidebar-foreground/60 truncate">
                  calum@test.com
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 hover:bg-app-sidebar-accent rounded">
                    <MoreVertical className="h-4 w-4 text-app-sidebar-foreground/60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
