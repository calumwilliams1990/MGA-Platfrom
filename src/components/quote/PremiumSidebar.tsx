import { Card } from "@/components/ui/card";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface PremiumSidebarProps {
  premium: number;
  referralStatus: {
    required: boolean;
    reasons: string[];
  };
}

export function PremiumSidebar({ premium, referralStatus }: PremiumSidebarProps) {
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

        <p className="text-xs text-muted-foreground">
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
