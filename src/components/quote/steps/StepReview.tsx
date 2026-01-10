import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Info, ChevronLeft, Cloud, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { QuoteData } from "@/pages/NewQuote";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";

interface StepReviewProps {
  quoteData: QuoteData;
  updateQuoteData: (updates: Partial<QuoteData> | ((prev: QuoteData) => Partial<QuoteData>)) => void;
  onBack: () => void;
  referralStatus: { required: boolean; reasons: string[] };
  netPremium: number;
}

export function StepReview({
  quoteData,
  updateQuoteData,
  onBack,
  referralStatus,
  netPremium,
}: StepReviewProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [supportingDocs, setSupportingDocs] = useState<File[]>([]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (files) => setSupportingDocs([...supportingDocs, ...files]),
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/csv": [".csv"],
      "image/*": [".jpg", ".jpeg", ".png"],
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleSubmit = () => {
    if (!quoteData.confirmed) {
      toast({
        title: "Confirmation Required",
        description: "Please confirm that all information is correct before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Navigate to Quote Summary page with all data
    navigate("/quote/summary", {
      state: {
        quoteData,
        netPremium,
        referralStatus,
      },
    });
  };

  const summaryItems = [
    { label: "Insured Name", value: quoteData.insuredName || "-" },
    { label: "Locations", value: `${quoteData.locations.length} locations` },
    { label: "Occupancy Type", value: quoteData.occupancyType || "-" },
    { label: "Underwriting Information", value: quoteData.priorLosses ? "Yes (Prior Losses)" : "No" },
    {
      label: "Policy Period",
      value: quoteData.inceptionDate && quoteData.expiryDate
        ? `${formatDate(quoteData.inceptionDate)} - ${formatDate(quoteData.expiryDate)}`
        : "-",
    },
    { label: "Number of Employees", value: quoteData.numberOfEmployees },
    { label: "Annual Total Revenue", value: formatCurrency(quoteData.annualRevenue) },
    { label: "Loss Limit", value: formatCurrency(quoteData.policyLimit) },
    { label: "Deductible", value: formatCurrency(quoteData.deductible) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">Review & Confirmation</h2>
        <Tooltip>
          <TooltipTrigger>
            <Info className="h-4 w-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Review your submission before finalizing</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <p className="text-muted-foreground">
        Review your submission and confirm accuracy
      </p>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 gap-y-3 gap-x-8 p-4 bg-muted/50 rounded-lg">
        {summaryItems.map((item) => (
          <div key={item.label} className="flex justify-between">
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <span className="text-sm font-medium">{item.value}</span>
          </div>
        ))}
      </div>

      {/* Referral Warning */}
      {referralStatus.required && (
        <div className="p-4 bg-insurance-referred/10 border border-insurance-referred/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-insurance-referred" />
            <span className="font-medium">Quote Will Require Underwriter Review</span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>This quote has conditions that require manual review</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-muted-foreground">
            {referralStatus.reasons[0]}
          </p>
        </div>
      )}

      {/* Confirmation Checkbox */}
      <div className="flex items-start space-x-3 p-4 border rounded-lg">
        <Checkbox
          id="confirm"
          checked={quoteData.confirmed}
          onCheckedChange={(checked) =>
            updateQuoteData({ confirmed: checked as boolean })
          }
        />
        <div>
          <Label htmlFor="confirm" className="font-medium cursor-pointer">
            I confirm that all information entered is correct to the best of my knowledge
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            This confirmation is required to proceed with quote submission
          </p>
        </div>
      </div>

      {/* Manual Referral Option */}
      <div className="space-y-3 p-4 border rounded-lg">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="manualReferral"
            checked={quoteData.manualReferral}
            onCheckedChange={(checked) =>
              updateQuoteData({ manualReferral: checked as boolean })
            }
          />
          <div>
            <Label htmlFor="manualReferral" className="font-medium cursor-pointer">
              Trigger automatic referral for policy
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Selecting this option will send the quote to underwriters for review regardless of instant quote eligibility
            </p>
          </div>
        </div>

        {quoteData.manualReferral && (
          <div className="space-y-2 mt-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="referralReason">Reason for Manual Referral</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Explain why this quote should be reviewed</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Textarea
              id="referralReason"
              placeholder="Type here..."
              value={quoteData.referralReason}
              onChange={(e) => updateQuoteData({ referralReason: e.target.value })}
              rows={3}
            />
          </div>
        )}
      </div>

      {/* Supporting Documentation */}
      <div className="space-y-3">
        <Label>Supporting Documentation (Optional)</Label>
        <div
          {...getRootProps()}
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <input {...getInputProps()} />
          <Cloud className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm mb-1">Upload any supporting documents</p>
          <p className="text-xs text-muted-foreground">
            Supported file formats PDF, DOC, CSV, JPG, PNG
          </p>
          <Button variant="outline" size="sm" className="mt-3">
            Upload Files
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={!quoteData.confirmed}>
          {referralStatus.required ? "Submit for Review" : "Generate Quote"}
        </Button>
      </div>
    </div>
  );
}
