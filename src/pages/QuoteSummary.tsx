import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Send, CheckCircle, AlertTriangle, Percent } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { QuoteData, Location } from "./NewQuote";

interface QuoteSummaryState {
  quoteData: QuoteData;
  netPremium: number;
  referralStatus: { required: boolean; reasons: string[] };
}

export default function QuoteSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [brokeragePercent, setBrokeragePercent] = useState(25);
  const [saving, setSaving] = useState(false);

  const state = location.state as QuoteSummaryState | null;

  useEffect(() => {
    if (!state) {
      navigate("/quote/new");
    }
  }, [state, navigate]);

  if (!state) {
    return null;
  }

  const { quoteData, netPremium, referralStatus } = state;

  // Normalize locations in case this screen is loaded from persisted/non-typed state
  const normalizedLocations: Location[] = Array.isArray((quoteData as any).locations)
    ? ((quoteData as any).locations as Location[])
    : typeof (quoteData as any).locations === "string"
      ? ((): Location[] => {
          try {
            const parsed = JSON.parse((quoteData as any).locations);
            return Array.isArray(parsed) ? (parsed as Location[]) : [];
          } catch {
            return [];
          }
        })()
      : (quoteData as any).locations && typeof (quoteData as any).locations === "object"
        ? (Object.values((quoteData as any).locations) as Location[])
        : [];

  const brokerageAmount = Math.round(netPremium * (brokeragePercent / 100));
  const grossPremium = netPremium + brokerageAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleBindQuote = async () => {
    setSaving(true);
    try {
      const policyData = {
        status: referralStatus.required ? "referred" : "quoted",
        insured_name: quoteData.insuredName || null,
        mailing_address: quoteData.mailingAddress || null,
        occupancy_type: quoteData.occupancyType || null,
        policy_limit: quoteData.policyLimit || null,
        deductible: quoteData.deductible || null,
        inception_date: quoteData.inceptionDate || null,
        expiry_date: quoteData.expiryDate || null,
        prior_losses: quoteData.priorLosses,
        prior_loss_amount: quoteData.priorLossAmount || null,
        prior_loss_details: quoteData.priorLossDetails || null,
        number_of_employees: quoteData.numberOfEmployees || null,
        annual_revenue: quoteData.annualRevenue || null,
        confirmed: quoteData.confirmed,
        manual_referral: quoteData.manualReferral,
        referral_reason: quoteData.referralReason || null,
        locations: JSON.parse(JSON.stringify(normalizedLocations)),
        estimated_premium: grossPremium || null,
        referral_required: referralStatus.required,
        referral_reasons: referralStatus.reasons,
      };

      const { error } = await supabase.from("policies").insert([policyData]);

      if (error) throw error;

      toast({
        title: referralStatus.required ? "Quote Submitted for Review" : "Quote Bound",
        description: referralStatus.required
          ? "Your quote has been sent to underwriters for review."
          : "Your quote has been successfully bound.",
      });

      navigate("/policies");
    } catch (error) {
      console.error("Error saving quote:", error);
      toast({
        title: "Error",
        description: "Failed to save quote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const locationCount = normalizedLocations.length;

  const summaryItems = [
    { label: "Insured Name", value: quoteData.insuredName || "-" },
    { label: "Mailing Address", value: quoteData.mailingAddress || "-" },
    { label: "Business Type", value: quoteData.occupancyType || "-" },
    { label: "Number of Locations", value: locationCount.toString() },
    {
      label: "Policy Period",
      value: quoteData.inceptionDate && quoteData.expiryDate
        ? `${formatDate(quoteData.inceptionDate)} - ${formatDate(quoteData.expiryDate)}`
        : "-",
    },
    { label: "Number of Employees", value: quoteData.numberOfEmployees },
    { label: "Annual Revenue", value: formatCurrency(quoteData.annualRevenue) },
    { label: "Policy Limit", value: formatCurrency(quoteData.policyLimit) },
    { label: "Deductible", value: formatCurrency(quoteData.deductible) },
    { label: "Prior Losses", value: quoteData.priorLosses ? "Yes" : "No" },
  ];

  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "New Quote", href: "/quote/new" },
          { label: "Quote Summary" },
        ]}
      />
      <div className="flex-1 overflow-auto bg-sidebar">
        <div className="p-6 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-sidebar-foreground">Quote Summary</h1>
              <p className="text-sidebar-foreground/70">
                Review your terrorism liability quote
              </p>
            </div>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => navigate("/quote/new", { state: { quoteData: { ...quoteData, locations: normalizedLocations } } })}
            >
              <ArrowLeft className="h-4 w-4" />
              Edit Quote
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Quote Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Summary Card */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Quote Details</h2>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  {summaryItems.map((item) => (
                    <div key={item.label} className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Locations Card */}
              {normalizedLocations.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Locations ({normalizedLocations.length})</h2>
                  <div className="space-y-3">
                    {normalizedLocations.map((loc, index) => (
                      <div key={loc.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{loc.name || loc.address}</p>
                          <p className="text-xs text-muted-foreground">
                            {loc.address} • {loc.county}, {loc.state} {loc.zipCode}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            loc.riskGrade === "A" ? "bg-red-100 text-red-700" :
                            loc.riskGrade === "B" ? "bg-orange-100 text-orange-700" :
                            loc.riskGrade === "C" ? "bg-yellow-100 text-yellow-700" :
                            loc.riskGrade === "D" ? "bg-blue-100 text-blue-700" :
                            "bg-green-100 text-green-700"
                          }`}>
                            Grade {loc.riskGrade}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Referral Status */}
              {referralStatus.required && (
                <Card className="p-6 border-insurance-referred/30 bg-insurance-referred/5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-insurance-referred" />
                    <h2 className="text-lg font-semibold">Requires Underwriter Review</h2>
                  </div>
                  <div className="space-y-2">
                    {referralStatus.reasons.map((reason, index) => (
                      <div key={index} className="text-sm bg-insurance-referred/10 text-insurance-referred px-3 py-2 rounded">
                        {reason}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column - Premium & Brokerage */}
            <div className="space-y-6">
              {/* Premium Card */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Premium Breakdown</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net Premium</span>
                    <span className="font-medium">{formatCurrency(netPremium)}</span>
                  </div>
                  
                  <Separator />
                  
                  {/* Brokerage Slider */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        Brokerage
                      </Label>
                      <span className="text-sm font-medium">{brokeragePercent}%</span>
                    </div>
                    <Slider
                      value={[brokeragePercent]}
                      onValueChange={(value) => setBrokeragePercent(value[0])}
                      min={0}
                      max={25}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Adjust brokerage from 0% to 25%
                    </p>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Brokerage Amount</span>
                    <span className="font-medium">{formatCurrency(brokerageAmount)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Gross Premium</span>
                    <span className="font-bold text-primary">{formatCurrency(grossPremium)}</span>
                  </div>
                </div>
              </Card>

              {/* Status Card */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  {referralStatus.required ? (
                    <>
                      <AlertTriangle className="h-5 w-5 text-insurance-referred" />
                      <span className="font-medium text-insurance-referred">Referral Required</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span className="font-medium text-success">Instant Quote</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {referralStatus.required
                    ? "This quote will be submitted to underwriters for review."
                    : "This quote is eligible for instant binding."}
                </p>
              </Card>

              {/* Actions */}
              <div className="space-y-3">
                <Button 
                  className="w-full gap-2" 
                  size="lg"
                  onClick={handleBindQuote}
                  disabled={saving}
                >
                  {referralStatus.required ? (
                    <>
                      <Send className="h-4 w-4" />
                      {saving ? "Submitting..." : "Submit for Review"}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      {saving ? "Binding..." : "Bind Quote"}
                    </>
                  )}
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  Download Quote PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
