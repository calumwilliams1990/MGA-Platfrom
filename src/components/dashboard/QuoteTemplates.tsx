import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Briefcase, UtensilsCrossed, HardHat, FileText } from "lucide-react";

const templates = [
  {
    id: "1",
    name: "Small Business Package",
    tags: ["GL", "Property", "BOP"],
    activeCount: 45,
    icon: Briefcase,
  },
  {
    id: "2",
    name: "Restaurant Coverage",
    tags: ["GL", "Property", "Liquor"],
    activeCount: 28,
    icon: UtensilsCrossed,
  },
  {
    id: "3",
    name: "Contractor Bundle",
    tags: ["GL", "WC", "Auto"],
    activeCount: 15,
    icon: HardHat,
  },
  {
    id: "4",
    name: "Create a New Template",
    tags: ["GL", "Property", "BOP"],
    activeCount: 25,
    icon: FileText,
  },
];

export function QuoteTemplates() {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-lg">Saved Quote Templates</h2>
          <p className="text-sm text-muted-foreground">Pre-configured templates</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create a new Template
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <template.icon className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <h3 className="font-medium text-sm mb-2">{template.name}</h3>
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                    {tag}
                  </Badge>
                ))}
              </div>
              <span className="text-xs text-success font-medium">
                {template.activeCount} Active
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
