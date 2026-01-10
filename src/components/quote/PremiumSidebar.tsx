import { Card } from "@/components/ui/card";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface PremiumSidebarProps {
  premium: number;
  referralStatus: {
    required: boolean;
    reasons: string[];
  };
}

const DEFAULT_BROKERAGE_PERCENT = 25;

export function PremiumSidebar({ premium, referralStatus }: PremiumSidebarProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate brokerage (premium passed is the net premium)
  const netPremium = premium;
  const brokerageAmount = Math.round(netPremium * (DEFAULT_BROKERAGE_PERCENT / 100));
  const grossPremium = netPremium + brokerageAmount;

  return (
    <div className="space-y-4">
      {/* Premium Estimate Card */}
      <Card className="p-5">
        <h3 className="font-semibold text-lg mb-3">Premium Estimate</h3>
        
        {premium > 0 ? (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Net Premium</span>
              <span className="font-medium">{formatCurrency(netPremium)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Brokerage ({DEFAULT_BROKERAGE_PERCENT}%)</span>
              <span className="font-medium">{formatCurrency(brokerageAmount)}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between">
              <span className="font-semibold">Gross Premium</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(grossPremium)}</span>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Brokerage adjustable on final quote (0-25%)
            </p>
          </div>
        ) : (
          <div>
            <p className="text-3xl font-bold mb-1">$0</p>
            <p className="text-sm text-muted-foreground">
              Enter coverage details to see premium estimate
            </p>
          </div>
        )}
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
