import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: string;
  };
  className?: string;
}

export default function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  className 
}: KPICardProps) {
  return (
    <Card className={cn("hover-elevate", className)} data-testid={`kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
        {trend && (
          <div className="flex items-center pt-1">
            <span className={cn(
              "text-xs font-medium",
              trend.direction === "up" && "text-status-approved",
              trend.direction === "down" && "text-status-rejected",
              trend.direction === "neutral" && "text-muted-foreground"
            )}>
              {trend.direction === "up" && "↑ "}
              {trend.direction === "down" && "↓ "}
              {trend.value}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}