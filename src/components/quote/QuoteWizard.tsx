import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
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
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card className="p-6">{renderStep()}</Card>
  );
}
