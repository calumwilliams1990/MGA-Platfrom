import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  priorLossAmount: number;
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
  priorLossAmount: 0,
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
  const [searchParams] = useSearchParams();
  const policyId = searchParams.get("id");
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [quoteData, setQuoteData] = useState<QuoteData>(initialQuoteData);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!policyId);

  // Load existing policy data if editing
  useEffect(() => {
    const loadPolicy = async () => {
      if (!policyId) return;
      
      try {
        const { data, error } = await supabase
          .from("policies")
          .select("*")
          .eq("id", policyId)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setQuoteData({
            documents: [],
            insuredName: data.insured_name || "",
            mailingAddress: data.mailing_address || "",
            occupancyType: data.occupancy_type || "",
            policyLimit: data.policy_limit || 1000000,
            deductible: data.deductible || 0,
            inceptionDate: data.inception_date || "",
            expiryDate: data.expiry_date || "",
            locations: (data.locations as unknown as Location[]) || [],
            priorLosses: data.prior_losses || false,
            priorLossAmount: (data as any).prior_loss_amount || 0,
            priorLossDetails: data.prior_loss_details || "",
            priorLossDocuments: [],
            numberOfEmployees: data.number_of_employees || "0-100",
            annualRevenue: data.annual_revenue || 0,
            confirmed: data.confirmed || false,
            manualReferral: data.manual_referral || false,
            referralReason: data.referral_reason || "",
          });
        }
      } catch (error) {
        console.error("Error loading policy:", error);
        toast({
          title: "Error",
          description: "Failed to load policy data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPolicy();
  }, [policyId, toast]);

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
    const baseRatePercent = selectedOccupancy?.baseRate || 0.50; // Default 0.50% for referral types
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

    // Deductible factor from rater (exponential sliding scale)
    // Formula: factor = a + b * exp(c * deductiblePercent)
    // Parameters: a = -0.005, b = 0.105, c = -30
    // Deductible as % of exposure: 0% = 1.0, 10% = 0.909 (max 10% discount)
    const deductible = quoteData.deductible || 0;
    let deductibleFactor = 1.0;
    if (exposureBase > 0 && deductible > 0) {
      const deductiblePercent = deductible / exposureBase; // As decimal (e.g., 0.05 for 5%)
      const a = -0.005;
      const b = 0.105;
      const c = -30;
      // Calculate factor and clamp between 0.9 and 1.0
      deductibleFactor = Math.max(0.9, Math.min(1.0, a + b * Math.exp(c * deductiblePercent)));
    }
    basePremium = basePremium * deductibleFactor;

    // Policy limit factor - DISCOUNT scale from rater (linear interpolation)
    // $0 = 0% discount, $125M = 10% discount, $250M = 20% discount
    const policyLimit = quoteData.policyLimit || 0;
    let limitDiscount = 0;
    if (policyLimit >= 250000000) {
      limitDiscount = 0.20; // 20% max discount
    } else if (policyLimit > 0) {
      // Linear scale: 10% per $125M
      limitDiscount = (policyLimit / 125000000) * 0.10;
    }
    const limitFactor = 1 - limitDiscount;
    basePremium = basePremium * limitFactor;

    // Location count adjustment from rater (continuous sliding scale)
    // 1 location = 0%, 2-10 = (n-1)*1%, 11+ = 9% + (n-10)*0.3%, capped at 20%
    const locationCount = quoteData.locations.length;
    let locationAdjustment = 0;
    if (locationCount <= 1) {
      locationAdjustment = 0;
    } else if (locationCount <= 10) {
      // 1% per location starting from location 2
      locationAdjustment = (locationCount - 1) * 0.01;
    } else {
      // 9% base (for first 10) + 0.3% per location after 10, capped at 20%
      locationAdjustment = Math.min(0.09 + (locationCount - 10) * 0.003, 0.20);
    }
    const locationLoad = 1 + locationAdjustment;

    // Prior losses load
    let lossLoad = 1.0;
    if (quoteData.priorLosses) {
      lossLoad = 1.25; // 25% load for prior losses
    }

    // Employee count adjustment from rater
    // 0-100 = 5%, 100-1000 = 10%, 1000-10000 = 15%, 10000+ = 20%
    let employeeAdjustment = 0.05; // Default 5% for 0-100
    switch (quoteData.numberOfEmployees) {
      case "0-100":
        employeeAdjustment = 0.05;
        break;
      case "100-1000":
        employeeAdjustment = 0.10;
        break;
      case "1000-10000":
        employeeAdjustment = 0.15;
        break;
      case "10000+":
        employeeAdjustment = 0.20;
        break;
    }
    const employeeLoad = 1 + employeeAdjustment;

    // Revenue adjustment from rater (discrete bands)
    // <$250M = 0%, $250M-$500M = 5%, $500M-$1B = 10%, $1B-$2.5B = 20%, $2.5B-$5B = 35%, $5B+ = 55%
    let revenueAdjustment = 0;
    const revenue = quoteData.annualRevenue || 0;
    if (revenue >= 5000000000) {
      revenueAdjustment = 0.55;
    } else if (revenue >= 2500000000) {
      revenueAdjustment = 0.35;
    } else if (revenue >= 1000000000) {
      revenueAdjustment = 0.20;
    } else if (revenue >= 500000000) {
      revenueAdjustment = 0.10;
    } else if (revenue >= 250000000) {
      revenueAdjustment = 0.05;
    }
    const revenueLoad = 1 + revenueAdjustment;

    // Calculate period length factor (pro-rate from 12-month base with multi-year discounts)
    // 0-12 months: 0% discount, 12-24 months: 5%, 24-36 months: 10%, 36-48 months: 20%
    let periodFactor = 1.0;
    let periodDiscount = 0;
    if (quoteData.inceptionDate && quoteData.expiryDate) {
      const inception = new Date(quoteData.inceptionDate);
      const expiry = new Date(quoteData.expiryDate);
      const diffMs = expiry.getTime() - inception.getTime();
      const periodMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44); // Average days per month
      
      // Pro-rate based on period length (12 months = 1.0)
      periodFactor = periodMonths / 12;
      
      // Apply multi-year discount
      if (periodMonths > 36) {
        periodDiscount = 0.20;
      } else if (periodMonths > 24) {
        periodDiscount = 0.10;
      } else if (periodMonths > 12) {
        periodDiscount = 0.05;
      }
    }
    const periodLoad = periodFactor * (1 - periodDiscount);

    // Calculate intermediate premium before loss amount adjustment
    let finalPremium = basePremium * locationLoad * lossLoad * employeeLoad * revenueLoad * periodLoad;

    // Special rule: losses under $10,000 apply minimum 50% load or $5,000 (whichever is higher)
    if (quoteData.priorLosses && quoteData.priorLossAmount > 0 && quoteData.priorLossAmount < 10000) {
      const fiftyPercentLoad = finalPremium * 0.5;
      const lossLoadAmount = Math.max(fiftyPercentLoad, 5000);
      finalPremium += lossLoadAmount;
    }

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

      const policyData = {
        status: "draft",
        insured_name: quoteData.insuredName || null,
        mailing_address: quoteData.mailingAddress || null,
        occupancy_type: quoteData.occupancyType || null,
        policy_limit: quoteData.policyLimit || null,
        deductible: quoteData.deductible || null,
        inception_date: quoteData.inceptionDate || null,
        expiry_date: quoteData.expiryDate || null,
        prior_losses: quoteData.priorLosses,
        prior_loss_amount: quoteData.priorLossAmount || null,
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
      };

      let error;
      
      if (policyId) {
        // Update existing policy
        const result = await supabase
          .from("policies")
          .update(policyData)
          .eq("id", policyId);
        error = result.error;
      } else {
        // Insert new policy
        const result = await supabase.from("policies").insert([policyData]);
        error = result.error;
      }

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
