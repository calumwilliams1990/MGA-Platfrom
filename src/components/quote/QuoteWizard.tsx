import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { QuoteData, Location } from "@/pages/NewQuote";
import { StepDocumentation } from "./steps/StepDocumentation";
import { StepPolicyholder } from "./steps/StepPolicyholder";
import { StepBusinessInfo } from "./steps/StepBusinessInfo";
import { StepCoverage } from "./steps/StepCoverage";
import { StepLocations } from "./steps/StepLocations";
import { StepUnderwriting } from "./steps/StepUnderwriting";
import { StepReview } from "./steps/StepReview";

interface QuoteWizardProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  quoteData: QuoteData;
  updateQuoteData: (updates: Partial<QuoteData>) => void;
  referralStatus: { required: boolean; reasons: string[] };
}

const steps = [
  { id: 1, title: "Documentation", optional: true },
  { id: 2, title: "Policyholder" },
  { id: 3, title: "Business Info" },
  { id: 4, title: "Coverage" },
  { id: 5, title: "Locations" },
  { id: 6, title: "Underwriting" },
  { id: 7, title: "Review" },
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
          <StepBusinessInfo
            quoteData={quoteData}
            updateQuoteData={updateQuoteData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 4:
        return (
          <StepCoverage
            quoteData={quoteData}
            updateQuoteData={updateQuoteData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 5:
        return (
          <StepLocations
            quoteData={quoteData}
            updateQuoteData={updateQuoteData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 6:
        return (
          <StepUnderwriting
            quoteData={quoteData}
            updateQuoteData={updateQuoteData}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      case 7:
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
    <div className="flex gap-6">
      {/* Step Sidebar */}
      <Card className="w-64 p-5 h-fit shrink-0 bg-primary/10 border-primary/20">
        <div className="space-y-1">
          {steps.map((step, index) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            const isUpcoming = step.id > currentStep;

            return (
              <div key={step.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors",
                      isCompleted &&
                        "bg-primary border-primary text-primary-foreground",
                      isCurrent &&
                        "bg-primary border-primary text-primary-foreground",
                      isUpcoming && "border-border text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "w-0.5 h-8 transition-colors",
                        isCompleted ? "bg-primary" : "bg-border"
                      )}
                    />
                  )}
                </div>
                <div className="pt-1">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCurrent && "text-foreground",
                      !isCurrent && "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </p>
                  {step.optional && (
                    <span className="text-xs text-muted-foreground">Opt</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Step Content */}
      <Card className="flex-1 p-6">{renderStep()}</Card>
    </div>
  );
}
