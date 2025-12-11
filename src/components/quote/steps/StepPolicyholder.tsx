import { Info, ChevronLeft, AlertTriangle } from "lucide-react";
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

interface StepPolicyholderProps {
  quoteData: QuoteData;
  updateQuoteData: (updates: Partial<QuoteData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const occupancyTypes = [
  { value: "abortion-clinics", label: "Abortion / Family Planning Clinics", referral: true, baseRate: 0.50 },
  { value: "arenas", label: "Arenas / Stadia / Venues", referral: true, baseRate: 0.50 },
  { value: "automotive", label: "Automotive", referral: true, baseRate: 0.50 },
  { value: "casino", label: "Casino", referral: false, baseRate: 0.08 },
  { value: "construction", label: "Construction", referral: false, baseRate: 0.02 },
  { value: "education", label: "Education", referral: true, baseRate: 0.50 },
  { value: "embassies", label: "Embassies / Consulates", referral: true, baseRate: 0.50 },
  { value: "utilities", label: "Energy / Utilities", referral: false, baseRate: 0.05 },
  { value: "healthcare", label: "Healthcare", referral: false, baseRate: 0.05 },
  { value: "high-rise", label: "High Rise Buildings", referral: false, baseRate: 0.04 },
  { value: "hotel", label: "Hotel", referral: false, baseRate: 0.08 },
  { value: "infrastructure", label: "Infrastructure", referral: false, baseRate: 0.03 },
  { value: "manufacturing", label: "Manufacturing / Industrial", referral: false, baseRate: 0.03 },
  { value: "mass-transportation", label: "Mass Transportation", referral: true, baseRate: 0.50 },
  { value: "media", label: "Media / Telecoms", referral: false, baseRate: 0.10 },
  { value: "government", label: "Municipal / Government Buildings / Prisons & Courthouses", referral: true, baseRate: 0.50 },
  { value: "office", label: "Offices", referral: false, baseRate: 0.03 },
  { value: "other", label: "Other", referral: true, baseRate: 0.50 },
  { value: "police-military", label: "Police / Military", referral: true, baseRate: 0.50 },
  { value: "political", label: "Politically Related Events / Organisations", referral: true, baseRate: 0.50 },
  { value: "religious", label: "Religious Institutions / Houses of Worship", referral: true, baseRate: 0.50 },
  { value: "residential", label: "Residential", referral: false, baseRate: 0.05 },
  { value: "restaurant", label: "Restaurants", referral: false, baseRate: 0.08 },
  { value: "retail", label: "Retail", referral: false, baseRate: 0.10 },
  { value: "security-defense", label: "Security Systems, Defence and Weapons", referral: true, baseRate: 0.50 },
  { value: "social-media", label: "Social Media", referral: true, baseRate: 0.50 },
];

export function StepPolicyholder({
  quoteData,
  updateQuoteData,
  onNext,
  onBack,
}: StepPolicyholderProps) {
  const isValid = quoteData.insuredName.trim() !== "" && quoteData.mailingAddress.trim() !== "" && quoteData.occupancyType !== "";

  const selectedOccupancy = occupancyTypes.find(
    (o) => o.value === quoteData.occupancyType
  );

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

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Business Type</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Primary type of the insured business</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select
            value={quoteData.occupancyType}
            onValueChange={(value) => updateQuoteData({ occupancyType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select business type" />
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
              This business type will require underwriter review
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
