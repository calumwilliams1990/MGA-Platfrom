import { useCallback } from "react";
import { Info, ChevronLeft, Upload, X, FileText } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  updateQuoteData: (updates: Partial<QuoteData> | ((prev: QuoteData) => Partial<QuoteData>)) => void;
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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    updateQuoteData({
      priorLossDocuments: [...quoteData.priorLossDocuments, ...acceptedFiles],
    });
  }, [quoteData.priorLossDocuments, updateQuoteData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
  });

  const removeDocument = (index: number) => {
    const newDocs = quoteData.priorLossDocuments.filter((_, i) => i !== index);
    updateQuoteData({ priorLossDocuments: newDocs });
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
            <div className="space-y-4 pt-2">
              <p className="text-xs text-insurance-referred">
                This will refer to an underwriter for further review. Please ensure this is only for perils covered under this policy and provide as much additional information as possible.
              </p>

              {/* Prior Loss Amount */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="priorLossAmount">Loss Amount</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total value of all prior terrorism-related losses</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="priorLossAmount"
                  placeholder="$0"
                  value={quoteData.priorLossAmount ? formatCurrency(quoteData.priorLossAmount) : ""}
                  onChange={(e) =>
                    updateQuoteData({ priorLossAmount: parseCurrency(e.target.value) })
                  }
                />
              </div>
              
              {/* Prior Loss Details */}
              <div className="space-y-2">
                <Label htmlFor="priorLossDetails">Loss Details</Label>
                <Textarea
                  id="priorLossDetails"
                  placeholder="Please provide details about prior losses including dates, amounts, and circumstances..."
                  value={quoteData.priorLossDetails}
                  onChange={(e) => updateQuoteData({ priorLossDetails: e.target.value })}
                  rows={4}
                />
              </div>

              {/* Document Upload */}
              <div className="space-y-2">
                <Label>Supporting Documents</Label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">
                    {isDragActive ? "Drop files here" : "Drag & drop files or click to upload"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOC, DOCX, PNG, JPG accepted
                  </p>
                </div>

                {/* Uploaded Files List */}
                {quoteData.priorLossDocuments.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {quoteData.priorLossDocuments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeDocument(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
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
