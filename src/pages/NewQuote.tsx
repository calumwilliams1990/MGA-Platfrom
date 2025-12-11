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
import { occupancyTypes } from "@/components/quote/steps/StepPolicyholder";
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

  const updateQuoteData = (updates: Partial<QuoteData> | ((prev: QuoteData) => Partial<QuoteData>)) => {
    setQuoteData((prev) => {
      const newUpdates = typeof updates === 'function' ? updates(prev) : updates;
      return { ...prev, ...newUpdates };
    });
  };

  // Calculate premium based on rating factors
  const calculatePremium = (): number => {
    // Get base rate from occupancy type (rates are in %)
    const selectedOccupancy = occupancyTypes.find(
      (o) => o.value === quoteData.occupancyType
    );
    const baseRatePercent = selectedOccupancy?.baseRate || 0.05; // Default 0.05%
    const baseRate = baseRatePercent / 100; // Convert to decimal

    // Calculate TIV from locations
    const totalTIV = quoteData.locations.reduce(
      (sum, loc) => sum + (loc.propertyValue || 0) + (loc.contentsValue || 0),
      0
    );

    // Use TIV if available, otherwise use policy limit
    let exposureBase = totalTIV;
    if (exposureBase === 0) {
      exposureBase = quoteData.policyLimit || 0;
    }

    // Base premium = exposure * rate
    let basePremium = exposureBase * baseRate;

    // Location count adjustment from rater (sliding scale)
    const locationCount = quoteData.locations.length;
    let locationAdjustment = 0;
    if (locationCount >= 2 && locationCount <= 10) {
      locationAdjustment = 0.05; // 5%
    } else if (locationCount >= 11 && locationCount <= 50) {
      locationAdjustment = 0.15; // 15%
    } else if (locationCount > 50) {
      locationAdjustment = 0.20; // 20%
    }
    const locationLoad = 1 + locationAdjustment;

    // Prior losses load (25% for yes per rater)
    const lossLoad = quoteData.priorLosses ? 1.25 : 1.0;

    // Calculate final premium
    const finalPremium = basePremium * locationLoad * lossLoad;

    // Ensure minimum premium of $500 if there's any exposure
    if (exposureBase > 0 && finalPremium < 500) {
      return 500;
    }

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

    // Check for referred locations (only Grade A ZIPs trigger referral)
    const gradeAReferrals = quoteData.locations.filter(
      (loc) => loc.riskGrade === "A"
    );

    if (gradeAReferrals.length > 0) {
      reasons.push(`${gradeAReferrals.length} location(s) in Grade A ZIP (high terror risk)`);
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
                { id: 3, title: "Locations" },
                { id: 4, title: "Underwriting" },
                { id: 5, title: "Coverage Details" },
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
