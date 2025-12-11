import { Info, ChevronLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

interface StepBusinessInfoProps {
  quoteData: QuoteData;
  updateQuoteData: (updates: Partial<QuoteData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const occupancyTypes = [
  { value: "office", label: "Offices", referral: false },
  { value: "retail", label: "Retail", referral: false },
  { value: "manufacturing", label: "Manufacturing / Industrial", referral: false },
  { value: "healthcare", label: "Healthcare", referral: false },
  { value: "construction", label: "Construction", referral: false },
  { value: "education", label: "Education", referral: true },
  { value: "utilities", label: "Energy / Utilities", referral: false },
  { value: "casino", label: "Casino", referral: false },
  { value: "hotel", label: "Hotel", referral: false },
  { value: "restaurant", label: "Restaurants", referral: false },
  { value: "infrastructure", label: "Infrastructure", referral: false },
  { value: "high-rise", label: "High Rise Buildings", referral: false },
  { value: "media", label: "Media / Telecoms", referral: false },
  { value: "residential", label: "Residential", referral: false },
  { value: "automotive", label: "Automotive", referral: true },
  { value: "arenas", label: "Arenas / Stadia / Venues", referral: true },
  { value: "political", label: "Politically Related Events / Organisations", referral: true },
  { value: "abortion-clinics", label: "Abortion / Family Planning Clinics", referral: true },
  { value: "security-defense", label: "Security Systems, Defence and Weapons", referral: true },
  { value: "mass-transportation", label: "Mass Transportation", referral: true },
  { value: "government", label: "Municipal / Government Buildings / Prisons & Courthouses", referral: true },
  { value: "embassies", label: "Embassies / Consulates", referral: true },
  { value: "police-military", label: "Police / Military", referral: true },
  { value: "religious", label: "Religious Institutions / Houses of Worship", referral: true },
  { value: "social-media", label: "Social Media", referral: true },
  { value: "other", label: "Other", referral: true },
];

export function StepBusinessInfo({
  quoteData,
  updateQuoteData,
  onNext,
  onBack,
}: StepBusinessInfoProps) {
  const isValid = quoteData.occupancyType !== "";

  const selectedOccupancy = occupancyTypes.find(
    (o) => o.value === quoteData.occupancyType
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">Business Information</h2>
        <Tooltip>
          <TooltipTrigger>
            <Info className="h-4 w-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Details about the insured's business operations</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <p className="text-muted-foreground">
        Tell us about the insured's business operations
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Occupancy Type</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Primary use of the insured property</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select
            value={quoteData.occupancyType}
            onValueChange={(value) => updateQuoteData({ occupancyType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select occupancy type" />
            </SelectTrigger>
            <SelectContent>
              {occupancyTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <span>{type.label}</span>
                    {type.referral && (
                      <AlertTriangle className="h-3.5 w-3.5 text-insurance-referred" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedOccupancy?.referral && (
            <p className="text-xs text-insurance-referred flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              This occupancy type will require underwriter review
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
