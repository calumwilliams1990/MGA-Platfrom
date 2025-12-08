import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: ReactNode;
  iconColor?: string;
  title: string;
  value: string | number;
  badge?: {
    text: string;
    variant: "success" | "warning" | "info";
  };
  subtitle: string;
  trend?: {
    value: string;
    positive: boolean;
  };
}

export function StatCard({
  icon,
  iconColor = "bg-primary",
  title,
  value,
  badge,
  subtitle,
  trend,
}: StatCardProps) {
  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
            iconColor
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold">{value}</span>
            {trend && (
              <span
                className={cn(
                  "text-xs font-medium px-1.5 py-0.5 rounded",
                  trend.positive
                    ? "text-success bg-success/10"
                    : "text-destructive bg-destructive/10"
                )}
              >
                {trend.positive ? "↑" : "↓"} {trend.value}
              </span>
            )}
            {badge && (
              <span
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  badge.variant === "success" && "bg-success/10 text-success",
                  badge.variant === "warning" && "bg-warning/10 text-warning",
                  badge.variant === "info" && "bg-primary/10 text-primary"
                )}
              >
                {badge.text}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        </div>
      </div>
    </Card>
  );
}
