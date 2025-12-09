import { Info, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuoteData } from "@/pages/NewQuote";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StepPolicyholderProps {
  quoteData: QuoteData;
  updateQuoteData: (updates: Partial<QuoteData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepPolicyholder({
  quoteData,
  updateQuoteData,
  onNext,
  onBack,
}: StepPolicyholderProps) {
  const isValid = quoteData.insuredName.trim() !== "" && quoteData.mailingAddress.trim() !== "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">Policyholder Details</h2>
        <Tooltip>
          <TooltipTrigger>
            <Info className="h-4 w-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Information about the insured party</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <p className="text-muted-foreground">
        Information about the insured party
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="insuredName">Insured Name</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Legal name of the insured entity</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="insuredName"
            placeholder="Write insured person name..."
            value={quoteData.insuredName}
            onChange={(e) => updateQuoteData({ insuredName: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="mailingAddress">Mailing Address</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Primary mailing address for correspondence</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="mailingAddress"
            placeholder="Write mailing address..."
            value={quoteData.mailingAddress}
            onChange={(e) => updateQuoteData({ mailingAddress: e.target.value })}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  );
}
