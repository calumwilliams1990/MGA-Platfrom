import { Card } from "@/components/ui/card";
import { ChevronDown, CheckCircle, AlertTriangle } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface PremiumSidebarProps {
  premium: number;
  referralStatus: {
    required: boolean;
    reasons: string[];
  };
}

export function PremiumSidebar({ premium, referralStatus }: PremiumSidebarProps) {
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Premium Estimate Card */}
      <Card className="p-5">
        <h3 className="font-semibold text-lg mb-1">Premium Estimate</h3>
        <p className="text-3xl font-bold mb-1">
          {premium > 0 ? formatCurrency(premium) : "$0"}
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          {premium > 0 ? "Estimated Annual Premium" : "Enter coverage details to see premium estimate"}
        </p>

        {premium > 0 && (
          <Collapsible open={breakdownOpen} onOpenChange={setBreakdownOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium hover:text-primary transition-colors">
              View Breakdown
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  breakdownOpen && "rotate-180"
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Base Premium</span>
                <span>{formatCurrency(premium * 0.7)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Occupancy Load</span>
                <span>{formatCurrency(premium * 0.15)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Location Load</span>
                <span>{formatCurrency(premium * 0.1)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Loss History</span>
                <span>{formatCurrency(premium * 0.05)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Total</span>
                <span>{formatCurrency(premium)}</span>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        <p className="text-xs text-muted-foreground mt-4">
          Premium updates in real-time as you complete the form
        </p>
      </Card>

      {/* Referral Status Card */}
      <Card className="p-5">
        <h3 className="font-semibold text-lg mb-3">Referral Status</h3>
        
        {referralStatus.required ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-insurance-referred">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Will Require Review</span>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">
                Referral Reasons ({referralStatus.reasons.length})
              </p>
              <div className="space-y-1">
                {referralStatus.reasons.map((reason, index) => (
                  <div
                    key={index}
                    className="text-xs bg-insurance-referred/10 text-insurance-referred px-2 py-1 rounded"
                  >
                    {reason}
                  </div>
                ))}
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Quote will be submitted to underwriters for review
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Instant Quote Available</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Your quote meets all criteria for instant issuance
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
