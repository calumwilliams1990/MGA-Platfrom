import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, Check, Anchor, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type YesNo = "yes" | "no";
type TripType = "delivery_voyage" | "tow" | "demolition_voyage";
type Experience = "less_than_3" | "three_to_five" | "over_5";

interface MarineTowData {
  // Step 1
  insuredName: string;
  insuredCountry: string;
  limit: string;
  // Step 2
  grossTonnage: string;
  tripType: TripType | "";
  departureCountry: string;
  arrivalCountry: string;
  flagCountry: string;
  inceptionDate: Date | undefined;
  policyDurationDays: string;
  // Step 3
  yearsExperience: Experience | "";
  claimsLast5Years: YesNo;
  mwsSurveyor: string;
  vesselSurveyConfirmed: YesNo;
  singleVesselConfirmed: YesNo;
  // Step 4
  crewCoverRequired: YesNo;
  portCoverRequired: YesNo;
  knockForKnock: YesNo;
  towagePlanApproved: YesNo;
}

const initial: MarineTowData = {
  insuredName: "",
  insuredCountry: "",
  limit: "",
  grossTonnage: "",
  tripType: "",
  departureCountry: "",
  arrivalCountry: "",
  flagCountry: "",
  inceptionDate: undefined,
  policyDurationDays: "",
  yearsExperience: "",
  claimsLast5Years: "no",
  mwsSurveyor: "",
  vesselSurveyConfirmed: "yes",
  singleVesselConfirmed: "yes",
  crewCoverRequired: "no",
  portCoverRequired: "no",
  knockForKnock: "yes",
  towagePlanApproved: "yes",
};

const steps = [
  { id: 1, title: "Insured & Limits" },
  { id: 2, title: "Vessel & Voyage" },
  { id: 3, title: "Operator & Survey" },
  { id: 4, title: "Cover & Conditions" },
];

function YesNoField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: YesNo;
  onChange: (v: YesNo) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <RadioGroup
        id={id}
        value={value}
        onValueChange={(v) => onChange(v as YesNo)}
        className="flex gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="yes" id={`${id}-yes`} />
          <Label htmlFor={`${id}-yes`} className="font-normal">Yes</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="no" id={`${id}-no`} />
          <Label htmlFor={`${id}-no`} className="font-normal">No</Label>
        </div>
      </RadioGroup>
    </div>
  );
}

export default function MarineTowQuote() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<MarineTowData>(initial);
  const [submitted, setSubmitted] = useState(false);

  const update = (u: Partial<MarineTowData>) =>
    setData((p) => ({ ...p, ...u }));

  const isTow = data.tripType === "tow";

  const stepValid = (): boolean => {
    switch (step) {
      case 1:
        return (
          data.insuredName.trim() !== "" &&
          data.insuredCountry.trim() !== "" &&
          data.limit !== "" &&
          Number(data.limit) > 0
        );
      case 2:
        return (
          data.grossTonnage !== "" &&
          Number(data.grossTonnage) > 0 &&
          data.tripType !== "" &&
          data.departureCountry.trim() !== "" &&
          data.arrivalCountry.trim() !== "" &&
          data.flagCountry.trim() !== "" &&
          !!data.inceptionDate &&
          data.policyDurationDays !== "" &&
          Number(data.policyDurationDays) > 0
        );
      case 3:
        return data.yearsExperience !== "" && data.mwsSurveyor.trim() !== "";
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = () => {
    const inception = data.inceptionDate
      ? format(data.inceptionDate, "yyyy-MM-dd")
      : "";
    const limit = Number(data.limit);

    const payload = {
      broker_id: "",
      insured_name: data.insuredName,
      state: "",
      naics_code: "483113",
      years_in_business: 0,
      line_of_business: "marine_tow",
      effective_date: inception,
      requested_limit: limit,
      deductible: 0,
      product_data: {
        limit,
        gross_tonnage: Number(data.grossTonnage),
        trip_type: data.tripType,
        policy_duration_days: Number(data.policyDurationDays),
        crew_cover_required: data.crewCoverRequired === "yes",
        port_cover_required: data.portCoverRequired === "yes",
        years_experience: data.yearsExperience,
        claims_last_5_years: data.claimsLast5Years === "yes",
        inception_date: inception,
        departure_country: data.departureCountry,
        arrival_country: data.arrivalCountry,
        flag_country: data.flagCountry,
        insured_country: data.insuredCountry,
        mws_surveyor: data.mwsSurveyor,
        knock_for_knock: data.knockForKnock === "yes",
        towage_plan_approved: data.towagePlanApproved === "yes",
        vessel_survey_confirmed: data.vesselSurveyConfirmed === "yes",
        single_vessel_confirmed: data.singleVesselConfirmed === "yes",
      },
    };

    console.log("Marine Tow rate payload:", payload);
    setSubmitted(true);
    toast({
      title: "Quote submitted",
      description: "Payload logged to console. Rate API wiring coming next.",
    });
  };

  if (submitted) {
    return (
      <>
        <AppHeader
          breadcrumbs={[
            { label: "Dashboard", href: "/" },
            { label: "Products" },
            { label: "Marine Tow" },
          ]}
        />
        <div className="flex-1 overflow-auto bg-sidebar">
          <div className="p-6 max-w-2xl mx-auto">
            <Card className="p-8 text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <Check className="h-6 w-6 text-success" />
              </div>
              <h1 className="text-2xl font-bold">Quote submitted</h1>
              <p className="text-muted-foreground">
                The Marine Tow quote payload has been logged to the browser
                console. The next iteration will POST it to the rate API.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubmitted(false);
                    setStep(1);
                  }}
                >
                  Edit quote
                </Button>
                <Button
                  onClick={() => {
                    setData(initial);
                    setSubmitted(false);
                    setStep(1);
                  }}
                >
                  New quote
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Products" },
          { label: "Marine Tow" },
        ]}
      />
      <div className="flex-1 overflow-auto bg-sidebar">
        <div className="p-6 max-w-3xl mx-auto">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Anchor className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-sidebar-foreground">
                Marine Tow Quote
              </h1>
              <p className="text-sidebar-foreground/70 text-sm">
                Provide voyage details to generate a Marine Tow quote
              </p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-sidebar-foreground/70">
                Step {step} of {steps.length}
              </span>
              <span className="text-sm font-medium text-sidebar-foreground">
                {Math.round((step / steps.length) * 100)}%
              </span>
            </div>
            <Progress value={(step / steps.length) * 100} className="h-2" />
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between">
              {steps.map((s, i) => {
                const completed = s.id < step;
                const current = s.id === step;
                return (
                  <div key={s.id} className="flex items-center flex-1">
                    <button
                      type="button"
                      onClick={() => setStep(s.id)}
                      className="flex flex-col items-center group"
                    >
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all",
                          (completed || current) &&
                            "bg-primary border-primary text-primary-foreground",
                          !completed &&
                            !current &&
                            "border-border bg-card text-muted-foreground group-hover:border-primary/50"
                        )}
                      >
                        {completed ? <Check className="h-4 w-4" /> : s.id}
                      </div>
                      <span
                        className={cn(
                          "text-xs mt-1 text-center whitespace-nowrap",
                          current
                            ? "text-sidebar-foreground font-medium"
                            : "text-sidebar-foreground/60"
                        )}
                      >
                        {s.title}
                      </span>
                    </button>
                    {i < steps.length - 1 && (
                      <div
                        className={cn(
                          "flex-1 h-0.5 mx-2",
                          completed ? "bg-primary" : "bg-border"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Card className="p-6">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Insured & Limits</h2>
                  <p className="text-muted-foreground text-sm">
                    Tell us who's insured and the limit they need.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="insuredName">Insured name</Label>
                    <Input
                      id="insuredName"
                      value={data.insuredName}
                      onChange={(e) => {
                        update({ insuredName: e.target.value });
                        setSanctions(null);
                        setSanctionsError(null);
                      }}
                      onBlur={runSanctionsCheck}
                      placeholder="e.g. Acme Marine Ltd"
                    />
                    {sanctionsLoading && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Running OFAC sanctions check...
                      </p>
                    )}
                    {sanctionsError && (
                      <p className="text-xs text-destructive">
                        Sanctions check failed: {sanctionsError}
                      </p>
                    )}
                    {sanctions && !sanctionsLoading && sanctions.matchCount === 0 && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        No OFAC matches found
                      </p>
                    )}
                    {sanctions && !sanctionsLoading && sanctions.matchCount > 0 && (
                      <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 space-y-2">
                        <p className="text-sm font-medium text-destructive flex items-center gap-1">
                          <ShieldAlert className="h-4 w-4" />
                          {sanctions.matchCount} potential OFAC match
                          {sanctions.matchCount > 1 ? "es" : ""} — review required
                        </p>
                        <ul className="text-xs space-y-1">
                          {sanctions.matches.slice(0, 5).map((m, i) => (
                            <li key={i} className="flex justify-between gap-2">
                              <span className="truncate">
                                <span className="font-medium">{m.name}</span>
                                <span className="text-muted-foreground">
                                  {" "}
                                  · {m.type || "—"}
                                  {m.program ? ` · ${m.program}` : ""}
                                </span>
                              </span>
                              <span className="text-muted-foreground shrink-0">
                                {Math.round(m.score * 100)}%
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insuredCountry">Insured country</Label>
                    <Input
                      id="insuredCountry"
                      value={data.insuredCountry}
                      onChange={(e) =>
                        update({ insuredCountry: e.target.value })
                      }
                      placeholder="e.g. United Kingdom"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="limit">Limit (USD)</Label>
                    <Input
                      id="limit"
                      type="number"
                      min={0}
                      value={data.limit}
                      onChange={(e) => update({ limit: e.target.value })}
                      placeholder="e.g. 25000000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Any value accepted — the rater will snap to the nearest
                      band ($5M / $10M / $25M / $50M / $75M / $100M).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Vessel & Voyage</h2>
                  <p className="text-muted-foreground text-sm">
                    Details of the vessel and the planned voyage.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grossTonnage">Gross tonnage</Label>
                    <Input
                      id="grossTonnage"
                      type="number"
                      min={0}
                      value={data.grossTonnage}
                      onChange={(e) =>
                        update({ grossTonnage: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Trip type</Label>
                    <Select
                      value={data.tripType}
                      onValueChange={(v) =>
                        update({ tripType: v as TripType })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select trip type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="delivery_voyage">
                          Delivery voyage
                        </SelectItem>
                        <SelectItem value="tow">Tow</SelectItem>
                        <SelectItem value="demolition_voyage">
                          Demolition voyage
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departureCountry">Departure country</Label>
                    <Input
                      id="departureCountry"
                      value={data.departureCountry}
                      onChange={(e) =>
                        update({ departureCountry: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="arrivalCountry">Arrival country</Label>
                    <Input
                      id="arrivalCountry"
                      value={data.arrivalCountry}
                      onChange={(e) =>
                        update({ arrivalCountry: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flagCountry">Flag country</Label>
                    <Input
                      id="flagCountry"
                      value={data.flagCountry}
                      onChange={(e) =>
                        update({ flagCountry: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Inception date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !data.inceptionDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {data.inceptionDate
                            ? format(data.inceptionDate, "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={data.inceptionDate}
                          onSelect={(d) => update({ inceptionDate: d })}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="policyDurationDays">
                      Policy duration (days)
                    </Label>
                    <Input
                      id="policyDurationDays"
                      type="number"
                      min={1}
                      value={data.policyDurationDays}
                      onChange={(e) =>
                        update({ policyDurationDays: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Operator & Survey</h2>
                  <p className="text-muted-foreground text-sm">
                    Operator track record and survey confirmations.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Years of experience</Label>
                    <Select
                      value={data.yearsExperience}
                      onValueChange={(v) =>
                        update({ yearsExperience: v as Experience })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="less_than_3">
                          Less than 3 years
                        </SelectItem>
                        <SelectItem value="three_to_five">
                          3 to 5 years
                        </SelectItem>
                        <SelectItem value="over_5">Over 5 years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <YesNoField
                    id="claimsLast5Years"
                    label="Claims in last 5 years?"
                    value={data.claimsLast5Years}
                    onChange={(v) => update({ claimsLast5Years: v })}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="mwsSurveyor">MWS surveyor</Label>
                    <Input
                      id="mwsSurveyor"
                      value={data.mwsSurveyor}
                      onChange={(e) =>
                        update({ mwsSurveyor: e.target.value })
                      }
                      placeholder="e.g. Matthews Daniel"
                    />
                    {data.mwsSurveyor.trim().toLowerCase() === "other" && (
                      <p className="text-xs text-warning">
                        "Other" surveyor will trigger a referral.
                      </p>
                    )}
                  </div>
                  <YesNoField
                    id="vesselSurveyConfirmed"
                    label="Vessel survey confirmed?"
                    value={data.vesselSurveyConfirmed}
                    onChange={(v) => update({ vesselSurveyConfirmed: v })}
                  />
                  <YesNoField
                    id="singleVesselConfirmed"
                    label="Single vessel confirmed? (tow trips)"
                    value={data.singleVesselConfirmed}
                    onChange={(v) => update({ singleVesselConfirmed: v })}
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Cover & Conditions</h2>
                  <p className="text-muted-foreground text-sm">
                    Optional covers and contractual conditions.
                  </p>
                </div>
                <div className="space-y-4">
                  <YesNoField
                    id="crewCoverRequired"
                    label="Crew cover required?"
                    value={data.crewCoverRequired}
                    onChange={(v) => update({ crewCoverRequired: v })}
                  />
                  <YesNoField
                    id="portCoverRequired"
                    label="Port cover required?"
                    value={data.portCoverRequired}
                    onChange={(v) => update({ portCoverRequired: v })}
                  />
                  <YesNoField
                    id="knockForKnock"
                    label="Knock-for-knock agreement in place? (tow trips)"
                    value={data.knockForKnock}
                    onChange={(v) => update({ knockForKnock: v })}
                  />
                  <YesNoField
                    id="towagePlanApproved"
                    label="Towage plan approved? (tow trips)"
                    value={data.towagePlanApproved}
                    onChange={(v) => update({ towagePlanApproved: v })}
                  />
                  {!isTow && (
                    <p className="text-xs text-muted-foreground">
                      Tow-specific fields apply only when trip type is "Tow".
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6">
              <Button
                variant="ghost"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              {step < steps.length ? (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!stepValid()}
                >
                  Continue
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!stepValid()}>
                  Generate Quote
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}