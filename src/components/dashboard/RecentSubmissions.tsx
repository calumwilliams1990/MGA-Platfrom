import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Submission {
  id: string;
  name: string;
  product: string;
  reference: string;
  status: "quoted" | "pending" | "submitted" | "bound";
  time: string;
}

const submissions: Submission[] = [
  {
    id: "1",
    name: "Johnson Manufacturing",
    product: "Commercial Property",
    reference: "#S-2024-0234",
    status: "quoted",
    time: "2 minutes ago",
  },
  {
    id: "2",
    name: "ABC Corp",
    product: "General Liability",
    reference: "#S-2024-0189",
    status: "pending",
    time: "8 hours ago",
  },
  {
    id: "3",
    name: "Tech Startup Inc.",
    product: "Workers Comp",
    reference: "#S-2024-0156",
    status: "submitted",
    time: "Yesterday",
  },
];

const statusConfig = {
  quoted: { label: "Quoted", className: "bg-success text-success-foreground" },
  pending: { label: "Pending", className: "bg-insurance-urgent text-white" },
  submitted: { label: "Submitted", className: "bg-primary text-primary-foreground" },
  bound: { label: "Bound", className: "bg-success text-success-foreground" },
};

export function RecentSubmissions() {
  return (
    <Card className="p-5">
      <h2 className="font-semibold text-lg mb-1">Recently Accessed</h2>
      <p className="text-sm text-muted-foreground mb-4">Your recent submissions</p>
      <div className="space-y-3">
        {submissions.map((submission) => (
          <div
            key={submission.id}
            className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{submission.name}</p>
                <p className="text-xs text-muted-foreground">{submission.product}</p>
                <p className="text-xs text-muted-foreground mt-1">{submission.reference}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge className={cn("text-xs", statusConfig[submission.status].className)}>
                  {statusConfig[submission.status].label}
                </Badge>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {submission.time}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Button variant="ghost" className="w-full mt-4 gap-2">
        View All Submissions
        <ChevronRight className="h-4 w-4" />
      </Button>
    </Card>
  );
}
