import { Check, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { QuoteData, Location } from "@/pages/NewQuote";
import { StepDocumentation } from "./steps/StepDocumentation";
import { StepPolicyholder } from "./steps/StepPolicyholder";
import { StepCoverage } from "./steps/StepCoverage";
import { StepLocations } from "./steps/StepLocations";
import { StepUnderwriting } from "./steps/StepUnderwriting";
import { StepReview } from "./steps/StepReview";

interface QuoteWizardProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  quoteData: QuoteData;
  updateQuoteData: (updates: Partial<QuoteData> | ((prev: QuoteData) => Partial<QuoteData>)) => void;
  referralStatus: { required: boolean; reasons: string[] };
  netPremium: number;
  onSave?: () => void;
  saving?: boolean;
}

const steps = [
  { id: 1, title: "Documentation", optional: true },
  { id: 2, title: "Policyholder" },
  { id: 3, title: "Locations" },
  { id: 4, title: "Underwriting" },
  { id: 5, title: "Coverage Details" },
  { id: 6, title: "Review" },
];

export function QuoteWizard({
  currentStep,
  setCurrentStep,
  quoteData,
  updateQuoteData,
  referralStatus,
  netPremium,
  onSave,
  saving,
}: QuoteWizardProps) {
  const goToNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepDocumentation
            quoteData={quoteData}
            updateQuoteData={updateQuoteData}
            onNext={goToNextStep}
            onSkip={goToNextStep}
          />
        );
      case 2:
        return (
          <StepPolicyholder
            quoteData={quoteData}
            updateQuoteData={updateQuoteData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 3:
        return (
          <StepLocations
            quoteData={quoteData}
            updateQuoteData={updateQuoteData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 4:
        return (
          <StepUnderwriting
            quoteData={quoteData}
            updateQuoteData={updateQuoteData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 5:
        return (
          <StepCoverage
            quoteData={quoteData}
            updateQuoteData={updateQuoteData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 6:
        return (
          <StepReview
            quoteData={quoteData}
            updateQuoteData={updateQuoteData}
            onBack={goToPreviousStep}
            referralStatus={referralStatus}
            netPremium={netPremium}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card className="p-6 space-y-4">
      {renderStep()}
      {onSave && currentStep < 6 && (
        <div className="flex justify-end border-t pt-4">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={onSave}
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save progress"}
          </Button>
        </div>
      )}
    </Card>
  );
}
