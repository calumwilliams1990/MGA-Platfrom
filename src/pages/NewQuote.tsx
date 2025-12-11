import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Save } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { QuoteWizard } from "@/components/quote/QuoteWizard";
import { PremiumSidebar } from "@/components/quote/PremiumSidebar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
export interface QuoteData {
  // Step 1 - Documentation
  documents: File[];
  
  // Step 2 - Policyholder
  insuredName: string;
  mailingAddress: string;
  
  // Step 3 - Business Info
  occupancyType: string;
  manufacturingWeapons?: boolean;
  
  // Step 4 - Coverage
  policyLimit: number;
  deductible: number;
  inceptionDate: string;
  expiryDate: string;
  
  // Step 5 - Locations
  locations: Location[];
  
  // Step 6 - Underwriting
  priorLosses: boolean;
  priorLossDetails: string;
  priorLossDocuments: File[];
  numberOfEmployees: string;
  annualRevenue: number;
  
  // Step 7 - Review
  confirmed: boolean;
  manualReferral: boolean;
  referralReason: string;
}

export interface Location {
  id: string;
  address: string;
  name?: string;
  zipCode: string;
  state: string;
  county: string;
  riskGrade: "A" | "B" | "C" | "D" | "E";
  type: string;
  status: "accepted" | "referred" | "declined" | "missing";
  propertyValue?: number;
  contentsValue?: number;
}

const initialQuoteData: QuoteData = {
  documents: [],
  insuredName: "",
  mailingAddress: "",
  occupancyType: "",
  policyLimit: 1000000,
  deductible: 0,
  inceptionDate: "",
  expiryDate: "",
  locations: [],
  priorLosses: false,
  priorLossDetails: "",
  priorLossDocuments: [],
  numberOfEmployees: "0-100",
  annualRevenue: 0,
  confirmed: false,
  manualReferral: false,
  referralReason: "",
};

export default function NewQuote() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [quoteData, setQuoteData] = useState<QuoteData>(initialQuoteData);
  const [saving, setSaving] = useState(false);

  const updateQuoteData = (updates: Partial<QuoteData>) => {
    setQuoteData((prev) => ({ ...prev, ...updates }));
  };

  // Calculate premium based on rating factors
  const calculatePremium = (): number => {
    let basePremium = 0;
    const baseRate = 0.0005; // 0.05% base rate

    // Calculate TIV from locations
    const totalTIV = quoteData.locations.reduce(
      (sum, loc) => sum + (loc.propertyValue || 0) + (loc.contentsValue || 0),
      0
    );

    if (totalTIV > 0) {
      basePremium = totalTIV * baseRate;
    } else if (quoteData.annualRevenue > 0) {
      basePremium = quoteData.annualRevenue * baseRate;
    }

    // Occupancy type load
    const occupancyLoads: Record<string, number> = {
      office: 1.0,
      retail: 1.2,
      manufacturing: 1.1,
      warehouse: 0.9,
      hospitality: 1.15,
      healthcare: 1.1,
      construction: 0.8,
      education: 1.0,
    };
    const occupancyLoad = occupancyLoads[quoteData.occupancyType.toLowerCase()] || 1.0;

    // Location count load
    const locationCount = quoteData.locations.length;
    let locationLoad = 1.0;
    if (locationCount > 1) {
      locationLoad = 1 + Math.min(locationCount * 0.01, 0.3);
    }

    // Prior losses load
    const lossLoad = quoteData.priorLosses ? 1.25 : 1.0;

    // Calculate final premium
    const finalPremium = basePremium * occupancyLoad * locationLoad * lossLoad;

    return Math.round(finalPremium);
  };

  // Check if referral is needed
  const checkReferralStatus = (): { required: boolean; reasons: string[] } => {
    const reasons: string[] = [];

    // Check occupancy type
    const referralOccupancies = [
      "automotive",
      "arenas",
      "political",
      "abortion",
      "weapons",
      "transportation",
      "government",
      "military",
      "religious",
      "education",
      "social media",
    ];
    if (
      referralOccupancies.some((occ) =>
        quoteData.occupancyType.toLowerCase().includes(occ)
      )
    ) {
      reasons.push("Occupancy type requires underwriter review");
    }

    // Check for referred locations
    const referredLocations = quoteData.locations.filter(
      (loc) => loc.status === "referred"
    );
    if (referredLocations.length > 0) {
      reasons.push(`${referredLocations.length} location(s) require review`);
    }

    // Check manual referral
    if (quoteData.manualReferral) {
      reasons.push("Manual referral triggered by broker");
    }

    return {
      required: reasons.length > 0,
      reasons,
    };
  };

  const savePolicy = async () => {
    setSaving(true);
    try {
      const currentReferralStatus = checkReferralStatus();
      const currentPremium = calculatePremium();

      const { error } = await supabase.from("policies").insert([{
        status: "draft",
        insured_name: quoteData.insuredName || null,
        mailing_address: quoteData.mailingAddress || null,
        occupancy_type: quoteData.occupancyType || null,
        policy_limit: quoteData.policyLimit || null,
        deductible: quoteData.deductible || null,
        inception_date: quoteData.inceptionDate || null,
        expiry_date: quoteData.expiryDate || null,
        prior_losses: quoteData.priorLosses,
        prior_loss_details: quoteData.priorLossDetails || null,
        number_of_employees: quoteData.numberOfEmployees || null,
        annual_revenue: quoteData.annualRevenue || null,
        confirmed: quoteData.confirmed,
        manual_referral: quoteData.manualReferral,
        referral_reason: quoteData.referralReason || null,
        locations: JSON.parse(JSON.stringify(quoteData.locations)),
        estimated_premium: currentPremium || null,
        referral_required: currentReferralStatus.required,
        referral_reasons: currentReferralStatus.reasons,
      }]);

      if (error) throw error;

      toast({
        title: "Policy saved",
        description: "Your policy has been saved as a draft.",
      });

      navigate("/policies");
    } catch (error) {
      console.error("Error saving policy:", error);
      toast({
        title: "Error",
        description: "Failed to save policy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const referralStatus = checkReferralStatus();
  const premium = calculatePremium();

  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Products", href: "/products" },
          { label: "Terrorism Liability" },
        ]}
      />
      <div className="flex-1 overflow-auto bg-sidebar">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-sidebar-foreground">Terrorism Liability Quote</h1>
              <p className="text-sidebar-foreground/70">
                Complete the form to receive your quote
              </p>
            </div>
            <Button 
              variant="outline" 
              className="bg-card text-card-foreground border-sidebar-border hover:bg-card/90 gap-2"
              onClick={savePolicy}
              disabled={saving}
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save & Exit"}
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-sidebar-foreground/70">Step {currentStep} of 6</span>
              <span className="text-sm font-medium text-sidebar-foreground">{Math.round((currentStep / 6) * 100)}%</span>
            </div>
            <Progress value={(currentStep / 6) * 100} className="h-2" />
          </div>

          {/* Horizontal Step Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              {[
                { id: 1, title: "Documentation" },
                { id: 2, title: "Policyholder" },
                { id: 3, title: "Coverage Details" },
                { id: 4, title: "Locations" },
                { id: 5, title: "Underwriting" },
                { id: 6, title: "Review" },
              ].map((step, index) => {
                const isCompleted = step.id < currentStep;
                const isCurrent = step.id === currentStep;
                
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(step.id)}
                      className="flex flex-col items-center cursor-pointer group"
                    >
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all",
                          isCompleted && "bg-primary border-primary text-primary-foreground",
                          isCurrent && "bg-primary border-primary text-primary-foreground",
                          !isCompleted && !isCurrent && "border-border bg-card text-muted-foreground group-hover:border-primary/50"
                        )}
                      >
                        {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                      </div>
                      <span
                        className={cn(
                          "text-xs mt-1 text-center whitespace-nowrap transition-colors",
                          isCurrent ? "text-sidebar-foreground font-medium" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                        )}
                      >
                        {step.title}
                      </span>
                    </button>
                    {index < 5 && (
                      <div
                        className={cn(
                          "flex-1 h-0.5 mx-2 transition-colors",
                          isCompleted ? "bg-primary" : "bg-border"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Quote Wizard */}
            <div className="lg:col-span-3">
              <QuoteWizard
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                quoteData={quoteData}
                updateQuoteData={updateQuoteData}
                referralStatus={referralStatus}
              />
            </div>

            {/* Premium Sidebar */}
            <div className="lg:col-span-1">
              <PremiumSidebar
                premium={premium}
                referralStatus={referralStatus}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
