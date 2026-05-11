import { Link } from "react-router-dom";
import { Search, Plus, RefreshCw, Bell, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AppHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  showActions?: boolean;
}

export function AppHeader({ breadcrumbs = [], showActions = true }: AppHeaderProps) {
  const { signOut, user } = useAuth();
  const isAdmin = useIsAdmin();
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-2" />
        
        {breadcrumbs.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((item, index) => (
                <BreadcrumbItem key={index}>
                  {index > 0 && <BreadcrumbSeparator />}
                  {item.href ? (
                    <BreadcrumbLink asChild>
                      <Link to={item.href}>{item.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>

      {showActions && (
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Type here to search"
              className="w-64 pl-9 bg-secondary/50"
            />
          </div>
          
          <Button asChild>
            <Link to="/quote/new">
              <Plus className="mr-2 h-4 w-4" />
              New Quote
            </Link>
          </Button>
          
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            View Renewals
          </Button>
          
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              3
            </span>
          </Button>

          {isAdmin && (
            <Badge variant="default" className="uppercase tracking-wide">
              Admin
            </Badge>
          )}

          {user && (
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>
      )}
    </header>
  );
}
