import { useState } from "react";
import { Info, ChevronLeft } from "lucide-react";
import { addYears, format } from "date-fns";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface StepCoverageProps {
  quoteData: QuoteData;
  updateQuoteData: (updates: Partial<QuoteData> | ((prev: QuoteData) => Partial<QuoteData>)) => void;
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
  { value: 250000000, label: "$250,000,000" },
];

const deductibles = [
  { value: 0, label: "$0" },
  { value: 5000, label: "$5,000" },
  { value: 10000, label: "$10,000" },
  { value: 25000, label: "$25,000" },
  { value: 50000, label: "$50,000" },
  { value: 100000, label: "$100,000" },
];

const MAX_LOSS_LIMIT = 250000000;

export function StepCoverage({
  quoteData,
  updateQuoteData,
  onNext,
  onBack,
}: StepCoverageProps) {
  const [lossLimitOpen, setLossLimitOpen] = useState(false);
  const [deductibleOpen, setDeductibleOpen] = useState(false);
  const [customLimitInput, setCustomLimitInput] = useState("");
  const [customDeductibleInput, setCustomDeductibleInput] = useState("");

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

  const maxDeductible = Math.min(quoteData.policyLimit * 0.1, 2500000);

  const handleCustomLimitChange = (value: string) => {
    setCustomLimitInput(value);
    const parsed = parseCurrency(value);
    if (parsed > 0 && parsed <= MAX_LOSS_LIMIT) {
      updateQuoteData({ policyLimit: parsed });
    }
  };

  const handleSelectLimit = (value: number) => {
    updateQuoteData({ policyLimit: value });
    setCustomLimitInput("");
    setLossLimitOpen(false);
  };

  const handleCustomDeductibleChange = (value: string) => {
    setCustomDeductibleInput(value);
    const parsed = parseCurrency(value);
    if (parsed >= 0) {
      updateQuoteData({ deductible: parsed });
    }
  };

  const handleSelectDeductible = (value: number) => {
    updateQuoteData({ deductible: value });
    setCustomDeductibleInput("");
    setDeductibleOpen(false);
  };

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
          <Label htmlFor="inceptionDate">Inception Date</Label>
          <Input
            id="inceptionDate"
            type="date"
            value={quoteData.inceptionDate}
            onChange={(e) => {
              const inceptionDate = e.target.value;
              const expiryDate = inceptionDate 
                ? format(addYears(new Date(inceptionDate), 1), "yyyy-MM-dd")
                : "";
              updateQuoteData({ inceptionDate, expiryDate });
            }}
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

        <div className="space-y-2">
          <div className="flex items-center gap-2 h-5">
            <Label>Loss Limit</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Select a preset or type a custom amount up to $250,000,000</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Popover open={lossLimitOpen} onOpenChange={setLossLimitOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between font-normal h-10"
              >
                {quoteData.policyLimit ? formatCurrency(quoteData.policyLimit) : "Select limit"}
                <span className="text-muted-foreground text-xs ml-2">▼</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover" align="start">
              <div className="p-2 border-b">
                <Input
                  placeholder="Type custom amount (max $250M)"
                  value={customLimitInput}
                  onChange={(e) => handleCustomLimitChange(e.target.value)}
                  className="h-9"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Or select from common limits below
                </p>
              </div>
              <div className="max-h-48 overflow-y-auto p-1">
                {policyLimits.map((limit) => (
                  <button
                    key={limit.value}
                    onClick={() => handleSelectLimit(limit.value)}
                    className="w-full text-left px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    {limit.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <div className="h-5 flex items-center">
            <Label>Deductible</Label>
          </div>
          <Popover open={deductibleOpen} onOpenChange={setDeductibleOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between font-normal h-10"
              >
                {formatCurrency(quoteData.deductible)}
                <span className="text-muted-foreground text-xs ml-2">▼</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover" align="start">
              <div className="p-2 border-b">
                <Input
                  placeholder="Type custom amount"
                  value={customDeductibleInput}
                  onChange={(e) => handleCustomDeductibleChange(e.target.value)}
                  className="h-9"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Or select from common options below
                </p>
              </div>
              <div className="max-h-48 overflow-y-auto p-1">
                {deductibles.map((ded) => (
                  <button
                    key={ded.value}
                    onClick={() => handleSelectDeductible(ded.value)}
                    className="w-full text-left px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    {ded.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          {quoteData.deductible > maxDeductible && (
            <p className="text-sm text-warning">
              The deductible cannot be more than 10% of the loss limit or $2,500,000, whichever is lower
            </p>
          )}
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
