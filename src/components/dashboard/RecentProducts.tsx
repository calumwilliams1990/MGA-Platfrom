import { Card } from "@/components/ui/card";
import { Building2, Shield, Car, Users } from "lucide-react";

const products = [
  {
    id: "1",
    name: "Commercial Property",
    activeCount: 45,
    icon: Building2,
    color: "bg-orange-100 text-orange-600",
  },
  {
    id: "2",
    name: "General Liability",
    activeCount: 28,
    icon: Shield,
    color: "bg-green-100 text-green-600",
  },
  {
    id: "3",
    name: "Commercial Auto",
    activeCount: 36,
    icon: Car,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "4",
    name: "Workers Company",
    activeCount: 16,
    icon: Users,
    color: "bg-purple-100 text-purple-600",
  },
];

export function RecentProducts() {
  return (
    <Card className="p-5">
      <h2 className="font-semibold text-lg mb-1">Recent Products</h2>
      <p className="text-sm text-muted-foreground mb-4">Quick access to recent products</p>
      <div className="grid grid-cols-2 gap-3">
        {products.map((product) => (
          <button
            key={product.id}
            className="p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors text-left"
          >
            <div className={`h-10 w-10 rounded-lg ${product.color} flex items-center justify-center mb-3`}>
              <product.icon className="h-5 w-5" />
            </div>
            <p className="font-medium text-sm mb-1">{product.name}</p>
            <p className="text-xs text-muted-foreground">{product.activeCount} active</p>
          </button>
        ))}
      </div>
    </Card>
  );
}
