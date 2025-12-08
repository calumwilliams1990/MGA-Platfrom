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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StepCoverageProps {
  quoteData: QuoteData;
  updateQuoteData: (updates: Partial<QuoteData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const policyLimits = [
  { value: 1000000, label: "$1,000,000" },
  { value: 2000000, label: "$2,000,000" },
  { value: 5000000, label: "$5,000,000" },
  { value: 10000000, label: "$10,000,000" },
  { value: 25000000, label: "$25,000,000" },
  { value: 50000000, label: "$50,000,000" },
  { value: 100000000, label: "$100,000,000" },
];

const deductibles = [
  { value: 0, label: "$0" },
  { value: 5000, label: "$5,000" },
  { value: 10000, label: "$10,000" },
  { value: 25000, label: "$25,000" },
  { value: 50000, label: "$50,000" },
  { value: 100000, label: "$100,000" },
];

export function StepCoverage({
  quoteData,
  updateQuoteData,
  onNext,
  onBack,
}: StepCoverageProps) {
  const isValid = quoteData.inceptionDate !== "" && quoteData.expiryDate !== "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">Coverage Details</h2>
        <Tooltip>
          <TooltipTrigger>
            <Info className="h-4 w-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Define the coverage limits and policy period</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <p className="text-muted-foreground">
        Configure the policy limits and coverage period
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Terrorism Liability Limit</Label>
          <Select
            value={quoteData.policyLimit.toString()}
            onValueChange={(value) =>
              updateQuoteData({ policyLimit: parseInt(value) })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select limit" />
            </SelectTrigger>
            <SelectContent>
              {policyLimits.map((limit) => (
                <SelectItem key={limit.value} value={limit.value.toString()}>
                  {limit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Deductible</Label>
          <Select
            value={quoteData.deductible.toString()}
            onValueChange={(value) =>
              updateQuoteData({ deductible: parseInt(value) })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select deductible" />
            </SelectTrigger>
            <SelectContent>
              {deductibles.map((ded) => (
                <SelectItem key={ded.value} value={ded.value.toString()}>
                  {ded.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="inceptionDate">Inception Date</Label>
          <Input
            id="inceptionDate"
            type="date"
            value={quoteData.inceptionDate}
            onChange={(e) => updateQuoteData({ inceptionDate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <Input
            id="expiryDate"
            type="date"
            value={quoteData.expiryDate}
            onChange={(e) => updateQuoteData({ expiryDate: e.target.value })}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid}>
          Continue
        </Button>
      </div>
    </div>
  );
}
