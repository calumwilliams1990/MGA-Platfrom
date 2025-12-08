import { Info, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

interface StepUnderwritingProps {
  quoteData: QuoteData;
  updateQuoteData: (updates: Partial<QuoteData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const employeeRanges = [
  { value: "0-100", label: "0 - 100" },
  { value: "100-1000", label: "100 - 1,000" },
  { value: "1000-10000", label: "1,000 - 10,000" },
  { value: "10000+", label: "10,000+" },
];

export function StepUnderwriting({
  quoteData,
  updateQuoteData,
  onNext,
  onBack,
}: StepUnderwritingProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const parseCurrency = (value: string) => {
    return parseInt(value.replace(/[^0-9]/g, "")) || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">Underwriting Information</h2>
        <Tooltip>
          <TooltipTrigger>
            <Info className="h-4 w-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Additional information for underwriting assessment</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <p className="text-muted-foreground">
        Provide additional details for risk assessment
      </p>

      <div className="space-y-6">
        {/* Prior Losses */}
        <div className="space-y-3">
          <Label>Prior Terrorism-Related Losses?</Label>
          <RadioGroup
            value={quoteData.priorLosses ? "yes" : "no"}
            onValueChange={(value) =>
              updateQuoteData({ priorLosses: value === "yes" })
            }
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="no-losses" />
              <Label htmlFor="no-losses" className="font-normal cursor-pointer">
                No
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="yes-losses" />
              <Label htmlFor="yes-losses" className="font-normal cursor-pointer">
                Yes
              </Label>
            </div>
          </RadioGroup>
          {quoteData.priorLosses && (
            <p className="text-xs text-insurance-referred">
              Prior losses will result in a 25% premium load
            </p>
          )}
        </div>

        {/* Number of Employees */}
        <div className="space-y-2">
          <Label>Number of Employees</Label>
          <Select
            value={quoteData.numberOfEmployees}
            onValueChange={(value) =>
              updateQuoteData({ numberOfEmployees: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              {employeeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Annual Revenue */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="revenue">Annual Total Revenue</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Total annual revenue of the insured entity</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="revenue"
            placeholder="$0"
            value={quoteData.annualRevenue ? formatCurrency(quoteData.annualRevenue) : ""}
            onChange={(e) =>
              updateQuoteData({ annualRevenue: parseCurrency(e.target.value) })
            }
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext}>Continue</Button>
      </div>
    </div>
  );
}
