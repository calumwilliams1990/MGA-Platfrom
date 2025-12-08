import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  client: string;
  reference: string;
  time: string;
  urgent?: boolean;
  unread?: boolean;
}

const activities: ActivityItem[] = [
  {
    id: "1",
    title: "New Email-Initiated Quote",
    description: "Quote request received via email for Commercial Property Insurance",
    client: "Johnson Manufacturing",
    reference: "#Q-2024-1289",
    time: "2 minutes ago",
    urgent: true,
    unread: true,
  },
  {
    id: "2",
    title: "Underwriter Response Received",
    description: "Liberty Mutual has provided a quote for General Liability",
    client: "Johnson Manufacturing",
    reference: "#Q-2024-1289",
    time: "1 hour ago",
    unread: true,
  },
  {
    id: "3",
    title: "Underwriter Response Received",
    description: "Workers Compensation submission for Tech Startup Inc.",
    client: "Johnson Manufacturing",
    reference: "#Q-2024-1289",
    time: "5 hours ago",
    urgent: true,
    unread: true,
  },
];

export function ActivityFeed() {
  return (
    <Card className="flex-1">
      <div className="flex items-center justify-between p-5 border-b">
        <div>
          <h2 className="font-semibold text-lg">Activity Feed</h2>
          <p className="text-sm text-muted-foreground">Recent updates and actions</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Select
        </Button>
      </div>
      <div className="divide-y">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="p-5 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{activity.title}</h3>
                  {activity.urgent && (
                    <Badge className="bg-insurance-urgent text-white">
                      Urgent
                    </Badge>
                  )}
                  {activity.unread && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {activity.description}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Client: {activity.client}</span>
                  <span className="text-muted-foreground/50">|</span>
                  <span>{activity.reference}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {activity.time}
                </span>
                <Button variant="link" size="sm" className="h-auto p-0 gap-1">
                  View Details
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
