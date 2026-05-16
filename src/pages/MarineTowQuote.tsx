import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format, addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import {
  CalendarIcon,
  ChevronLeft,
  Check,
  Anchor,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  AlertTriangle,
  XCircle,
  Upload,
  Save,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/layout/AppHeader";
import { AddressLookup } from "@/components/marine-tow/AddressLookup";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  COUNTRIES,
  DECLINE_COUNTRIES,
  REFER_COUNTRIES,
  PI_PROVIDERS,
  MWS_SURVEYORS,
  LIMIT_OPTIONS,
  deductibleForLimit,
} from "@/lib/marineTowOptions";

const RATE_API_URL =
  "https://velonix-platform-production-deba.up.railway.app/api/v1/rate";

const US_STATE_CODES: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", "district of columbia": "DC",
  florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID", illinois: "IL",
  indiana: "IN", iowa: "IA", kansas: "KS", kentucky: "KY", louisiana: "LA",
  maine: "ME", maryland: "MD", massachusetts: "MA", michigan: "MI",
  minnesota: "MN", mississippi: "MS", missouri: "MO", montana: "MT",
  nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ",
  "new mexico": "NM", "new york": "NY", "north carolina": "NC",
  "north dakota": "ND", ohio: "OH", oklahoma: "OK", oregon: "OR",
  pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT",
  vermont: "VT", virginia: "VA", washington: "WA", "west virginia": "WV",
  wisconsin: "WI", wyoming: "WY",
};

function toStateCode(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";
  if (trimmed.length === 2) return trimmed.toUpperCase();
  return US_STATE_CODES[trimmed.toLowerCase()] ?? "";
}

function experienceToYears(e: Experience): number {
  if (e === "less_than_3") return 2;
  if (e === "three_to_five") return 4;
  if (e === "over_5") return 6;
  return 0;
}

type RateStatus = "quoted" | "referred" | "declined";
interface RateResponse {
  status: RateStatus;
  annual_premium?: number;
  rate?: number;
  rating_basis?: string;
  referral_reasons?: string[];
  decline_reasons?: string[];
  message?: string;
  [k: string]: unknown;
}

type YesNo = "yes" | "no" | "";
type TripType = "delivery_voyage" | "tow" | "demolition_voyage" | "";
type Experience = "less_than_3" | "three_to_five" | "over_5" | "";

interface MarineTowData {
  // 1. Cover Fundamentals
  inceptionDate: Date | undefined;
  expiryDate: Date | undefined;
  piProvider: string;
  setTargetPrice: YesNo;
  targetPrice: string;
  // 2. Policy Holder Details
  insuredName: string;
  address: string; // combined free-text address (used for non UK/US, and as a derived display elsewhere)
  addressStreet: string;
  addressCity: string;
  addressPostcode: string;
  addressState: string;
  insuredCountry: string;
  yearsExperience: Experience;
  individualExperience: Experience;
  claimsLast5Years: YesNo;
  claimsExplanation: string;
  // 3. Vessel Details
  vesselName: string;
  flagCountry: string;
  imoNumber: string;
  grossTonnage: string;
  vesselType: string;
  // 4. Voyage Details
  limit: string; // numeric value
  mwsSurveyor: string;
  departureCountry: string;
  deliveryCountry: string;
  tripType: TripType;
  crewCoverRequired: boolean;
  portCoverRequired: boolean;
  portCoverDetails: string;
  // 5. Attestations
  knockForKnock: boolean;
  towagePlanApproved: boolean;
  singleVessel: boolean;
  appropriatePlan: boolean;
  vesselSurveyConfirmed: boolean;
  cargoLiabilityExcluded: boolean;
  crewCoverExcluded: boolean;
  // 6. Declaration
  declarationConfirmed: boolean;
  triggerManualReferral: boolean;
  manualReferralNotes: string;
  supportingDocs: File[];
}

const initial: MarineTowData = {
  inceptionDate: undefined,
  expiryDate: undefined,
  piProvider: "",
  setTargetPrice: "",
  targetPrice: "",
  insuredName: "",
  address: "",
  addressStreet: "",
  addressCity: "",
  addressPostcode: "",
  addressState: "",
  insuredCountry: "",
  yearsExperience: "",
  individualExperience: "",
  claimsLast5Years: "",
  claimsExplanation: "",
  vesselName: "",
  flagCountry: "",
  imoNumber: "",
  grossTonnage: "",
  vesselType: "",
  limit: "",
  mwsSurveyor: "",
  departureCountry: "",
  deliveryCountry: "",
  tripType: "",
  crewCoverRequired: false,
  portCoverRequired: false,
  portCoverDetails: "",
  knockForKnock: false,
  towagePlanApproved: false,
  singleVessel: false,
  appropriatePlan: false,
  vesselSurveyConfirmed: false,
  cargoLiabilityExcluded: false,
  crewCoverExcluded: false,
  declarationConfirmed: false,
  triggerManualReferral: false,
  manualReferralNotes: "",
  supportingDocs: [],
};

const steps = [
  { id: 1, title: "Policy Holder" },
  { id: 2, title: "Operator History" },
  { id: 3, title: "Cover Fundamentals" },
  { id: 4, title: "Vessel" },
  { id: 5, title: "Voyage" },
  { id: 6, title: "Attestations" },
  { id: 7, title: "Declaration" },
];

function CountrySelect({
  value,
  onChange,
  placeholder = "Select country",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {COUNTRIES.map((c) => (
          <SelectItem key={c} value={c}>
            {c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CountryFlag({ country }: { country: string }) {
  if (!country) return null;
  if (DECLINE_COUNTRIES.includes(country)) {
    return (
      <p className="text-xs text-destructive flex items-center gap-1">
        <XCircle className="h-3 w-3" /> Excluded country — will trigger a decline
      </p>
    );
  }
  if (REFER_COUNTRIES.includes(country)) {
    return (
      <p className="text-xs text-warning flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" /> Referral country — sent to UW review
      </p>
    );
  }
  return null;
}

export default function MarineTowQuote() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get("id");
  const [quoteId, setQuoteId] = useState<string | null>(initialId);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [hydrating, setHydrating] = useState(!!initialId);
  const [step, setStep] = useState(1);
  const [data, setData] = useState<MarineTowData>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [maxStepReached, setMaxStepReached] = useState(1);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);
  const [rateResult, setRateResult] = useState<RateResponse | null>(null);

  type SanctionMatch = { id: string; name: string; type: string; program: string; score: number };
  type SanctionsResult = { matchCount: number; matches: SanctionMatch[]; checkedAt: string };
  const SANCTIONS_THRESHOLD = 0.95;
  const [sanctions, setSanctions] = useState<SanctionsResult | null>(null);
  const [sanctionsLoading, setSanctionsLoading] = useState(false);
  const [sanctionsError, setSanctionsError] = useState<string | null>(null);

  const update = (u: Partial<MarineTowData>) =>
    setData((p) => ({ ...p, ...u }));

  const goToStep = (n: number) => {
    setStep(n);
    setMaxStepReached((m) => Math.max(m, n));
  };

  // Load existing draft when ?id= is present
  useEffect(() => {
    if (!initialId) return;
    (async () => {
      try {
        const { data: row, error } = await supabase
          .from("marine_tow_quotes")
          .select("payload")
          .eq("id", initialId)
          .maybeSingle();
        if (error) throw error;
        if (row?.payload) {
          const p = row.payload as Partial<MarineTowData> & {
            inceptionDate?: string;
            expiryDate?: string;
          };
          setData({
            ...initial,
            ...(p as object),
            inceptionDate: p.inceptionDate ? new Date(p.inceptionDate) : undefined,
            expiryDate: p.expiryDate ? new Date(p.expiryDate) : undefined,
            supportingDocs: [],
          } as MarineTowData);
        }
      } catch (e) {
        toast({
          title: "Error",
          description: "Failed to load saved quote.",
          variant: "destructive",
        });
      } finally {
        setHydrating(false);
      }
    })();
  }, [initialId, toast]);

  const saveDraft = async (opts: { silent?: boolean; redirect?: boolean } = {}) => {
    const { silent = false, redirect = true } = opts;
    if (silent) setAutoSaveStatus("saving");
    else setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Strip File objects from payload (not serializable)
      const { supportingDocs, ...rest } = data;
      const payload = {
        ...rest,
        inceptionDate: data.inceptionDate ? data.inceptionDate.toISOString() : null,
        expiryDate: data.expiryDate ? data.expiryDate.toISOString() : null,
      };

      const row = {
        insured_name: data.insuredName || null,
        vessel_name: data.vesselName || null,
        status: "draft",
        payload: JSON.parse(JSON.stringify(payload)),
      };

      if (quoteId) {
        const { error } = await supabase
          .from("marine_tow_quotes")
          .update(row)
          .eq("id", quoteId);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase
          .from("marine_tow_quotes")
          .insert([{ ...row, user_id: user.id }])
          .select("id")
          .single();
        if (error) throw error;
        if (inserted?.id) setQuoteId(inserted.id);
      }

      if (silent) {
        setAutoSaveStatus("saved");
      } else {
        toast({ title: "Quote saved", description: "Draft saved to My Policies." });
        if (redirect) navigate("/policies");
      }
    } catch (e) {
      if (silent) {
        setAutoSaveStatus("idle");
      } else {
        toast({
          title: "Error",
          description: "Failed to save quote. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      if (!silent) setSaving(false);
    }
  };

  // Auto-save with debounce
  useEffect(() => {
    if (hydrating || submitted) return;
    if (!quoteId && !data.insuredName && !data.vesselName) return;
    setAutoSaveStatus("saving");
    const t = setTimeout(() => {
      saveDraft({ silent: true, redirect: false });
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, hydrating, submitted]);

  const runSanctionsCheck = async () => {
    const name = data.insuredName.trim();
    if (name.length < 2) return;
    setSanctionsLoading(true);
    setSanctionsError(null);
    setSanctions(null);
    try {
      const { data: result, error } = await supabase.functions.invoke(
        "ofac-sanctions-check",
        { body: { name } },
      );
      if (error) throw error;
      setSanctions(result as SanctionsResult);
    } catch (e) {
      setSanctionsError(e instanceof Error ? e.message : "Check failed");
    } finally {
      setSanctionsLoading(false);
    }
  };

  const limitNum = Number(data.limit) || 0;
  const deductible = limitNum > 0 ? deductibleForLimit(limitNum) : 0;
  const isTow = data.tripType === "tow";
  const isVoyage =
    data.tripType === "delivery_voyage" ||
    data.tripType === "demolition_voyage";

  const policyDurationDays = useMemo(() => {
    if (!data.inceptionDate || !data.expiryDate) return 0;
    return differenceInCalendarDays(data.expiryDate, data.inceptionDate);
  }, [data.inceptionDate, data.expiryDate]);

  // ----- Live decline / referral evaluation -----
  const declineReasons: string[] = [];
  const referralReasons: string[] = [];

  for (const [label, country] of [
    ["Insured address country", data.insuredCountry],
    ["Vessel flag", data.flagCountry],
    ["Departure country", data.departureCountry],
    ["Delivery country", data.deliveryCountry],
  ] as const) {
    if (country && DECLINE_COUNTRIES.includes(country)) {
      declineReasons.push(`${label}: ${country} is excluded`);
    } else if (country && REFER_COUNTRIES.includes(country)) {
      referralReasons.push(`${label}: ${country} requires UW review`);
    }
  }
  const strongSanctionsMatches =
    sanctions?.matches.filter((m) => m.score >= SANCTIONS_THRESHOLD) ?? [];
  if (strongSanctionsMatches.length > 0) {
    declineReasons.push(
      `OFAC sanctions match (${strongSanctionsMatches.length}) on insured name`,
    );
  }
  if (data.inceptionDate && data.inceptionDate < startOfDay(new Date())) {
    referralReasons.push("Inception date is in the past");
  }
  if (policyDurationDays > 90) {
    referralReasons.push(`Policy duration (${policyDurationDays} days) exceeds 90`);
  }
  if (data.yearsExperience === "less_than_3") {
    if (data.individualExperience === "less_than_3") {
      declineReasons.push(
        "Individual controlling the tow has less than 3 years experience",
      );
    }
  }
  if (data.claimsLast5Years === "yes") {
    referralReasons.push("Claims or circumstances in last 5 years");
  }
  if (data.mwsSurveyor === "Other") {
    referralReasons.push('MWS surveyor selected as "Other"');
  }
  if (data.portCoverRequired) {
    referralReasons.push("Port cover required");
  }
  // Attestation-based reasons only surface once the user has visited the
  // Attestations step (so we don't show "not confirmed" before the question
  // has even been asked).
  if (maxStepReached >= 6) {
    if (isTow) {
      if (!data.knockForKnock) referralReasons.push("Knock-for-knock not confirmed");
      if (!data.towagePlanApproved)
        referralReasons.push("Towage plan / MWS approval not confirmed");
      if (!data.singleVessel)
        referralReasons.push("Single vessel (no double tow) not confirmed");
    }
    if (isVoyage && !data.appropriatePlan) {
      referralReasons.push("Appropriate voyage plan not confirmed");
    }
    if (!data.vesselSurveyConfirmed)
      referralReasons.push("Vessel seaworthiness survey not confirmed");
    if (!data.cargoLiabilityExcluded)
      referralReasons.push("Cargo liability exclusion not confirmed");
    if (!data.crewCoverRequired && !data.crewCoverExcluded)
      referralReasons.push("Crew cover exclusion not confirmed");
  }
  if (data.triggerManualReferral)
    referralReasons.push("Manual referral triggered");

  const stepValid = (): boolean => {
    switch (step) {
      case 1:
        return (
          data.insuredCountry !== "" &&
          !DECLINE_COUNTRIES.includes(data.insuredCountry) &&
          data.insuredName.trim() !== "" &&
          (
            data.insuredCountry === "United Kingdom" ||
            data.insuredCountry === "United States"
              ? data.addressStreet.trim() !== "" &&
                data.addressCity.trim() !== "" &&
                data.addressPostcode.trim() !== ""
              : data.address.trim() !== ""
          )
        );
      case 2:
        return (
          data.yearsExperience !== "" &&
          (data.yearsExperience !== "less_than_3" ||
            data.individualExperience !== "") &&
          data.claimsLast5Years !== "" &&
          (data.claimsLast5Years === "no" ||
            data.claimsExplanation.trim() !== "")
        );
      case 3:
        return (
          !!data.inceptionDate &&
          !!data.expiryDate &&
          policyDurationDays > 0 &&
          data.piProvider !== "" &&
          data.setTargetPrice !== "" &&
          (data.setTargetPrice === "no" ||
            (data.setTargetPrice === "yes" && Number(data.targetPrice) > 0))
        );
      case 4:
        return (
          data.vesselName.trim() !== "" &&
          data.flagCountry !== "" &&
          data.grossTonnage !== "" &&
          Number(data.grossTonnage) > 0 &&
          data.vesselType.trim() !== ""
        );
      case 5:
        return (
          data.limit !== "" &&
          data.departureCountry !== "" &&
          data.deliveryCountry !== "" &&
          data.tripType !== "" &&
          (isTow ? data.mwsSurveyor !== "" : true) &&
          (!data.portCoverRequired || data.portCoverDetails.trim() !== "")
        );
      case 6:
        return true; // attestations are advisory; unticked → referral, not block
      case 7:
        return (
          data.declarationConfirmed &&
          (!data.triggerManualReferral ||
            data.manualReferralNotes.trim() !== "")
        );
      default:
        return false;
    }
  };

  const handleSubmit = () => {
    if (declineReasons.length > 0) {
      toast({
        title: "Cannot submit — risk declined",
        description: declineReasons[0],
        variant: "destructive",
      });
      return;
    }
    const inception = data.inceptionDate
      ? format(data.inceptionDate, "yyyy-MM-dd")
      : "";
    const expiry = data.expiryDate
      ? format(data.expiryDate, "yyyy-MM-dd")
      : "";

    const payload = {
      line_of_business: "marine_tow",
      cover_fundamentals: {
        inception_date: inception,
        expiry_date: expiry,
        policy_duration_days: policyDurationDays,
        pi_provider: data.piProvider,
        target_price: data.setTargetPrice === "yes" ? Number(data.targetPrice) : null,
      },
      policyholder: {
        insured_name: data.insuredName,
        address: data.address,
        country: data.insuredCountry,
        years_experience: data.yearsExperience,
        claims_last_5_years: data.claimsLast5Years === "yes",
        claims_explanation: data.claimsExplanation || null,
      },
      vessel: {
        name: data.vesselName,
        flag: data.flagCountry,
        imo_number: data.imoNumber || null,
        gross_tonnage: Number(data.grossTonnage),
        vessel_type: data.vesselType,
      },
      voyage: {
        limit: limitNum,
        deductible,
        mws_surveyor: data.mwsSurveyor || null,
        departure_country: data.departureCountry,
        delivery_country: data.deliveryCountry,
        trip_type: data.tripType,
        crew_cover_required: data.crewCoverRequired,
        port_cover_required: data.portCoverRequired,
        port_cover_details: data.portCoverDetails || null,
      },
      attestations: {
        knock_for_knock: data.knockForKnock,
        towage_plan_approved: data.towagePlanApproved,
        single_vessel: data.singleVessel,
        appropriate_plan: data.appropriatePlan,
        vessel_survey_confirmed: data.vesselSurveyConfirmed,
        cargo_liability_excluded: data.cargoLiabilityExcluded,
        crew_cover_excluded: data.crewCoverExcluded,
      },
      declaration: {
        confirmed: data.declarationConfirmed,
        manual_referral: data.triggerManualReferral,
        manual_referral_notes: data.manualReferralNotes || null,
        supporting_doc_count: data.supportingDocs.length,
      },
      referral_required: referralReasons.length > 0,
      referral_reasons: referralReasons,
    };

    console.log("Marine Tow rate payload:", payload);
    setSubmitted(true);
    toast({
      title:
        referralReasons.length > 0
          ? "Quote submitted — referred to underwriter"
          : "Quote submitted",
      description:
        referralReasons.length > 0
          ? `${referralReasons.length} referral reason${referralReasons.length > 1 ? "s" : ""}`
          : "Payload logged to console.",
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
                {referralReasons.length > 0
                  ? "Sent to underwriter for review."
                  : "The Marine Tow quote payload has been logged. Rate API wiring coming next."}
              </p>
              {referralReasons.length > 0 && (
                <div className="text-left rounded-md border border-warning/40 bg-warning/5 p-3">
                  <p className="text-sm font-medium text-warning mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" /> Referral reasons
                  </p>
                  <ul className="text-xs space-y-1 list-disc pl-5">
                    {referralReasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
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
                    setSanctions(null);
                    setMaxStepReached(1);
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
                      onClick={() => goToStep(s.id)}
                      className="flex flex-col items-center group"
                    >
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all",
                          (completed || current) &&
                            "bg-primary border-primary text-primary-foreground",
                          !completed &&
                            !current &&
                            "border-border bg-card text-muted-foreground group-hover:border-primary/50",
                        )}
                      >
                        {completed ? <Check className="h-4 w-4" /> : s.id}
                      </div>
                      <span
                        className={cn(
                          "text-[10px] mt-1 text-center whitespace-nowrap",
                          current
                            ? "text-sidebar-foreground font-medium"
                            : "text-sidebar-foreground/60",
                        )}
                      >
                        {s.title}
                      </span>
                    </button>
                    {i < steps.length - 1 && (
                      <div
                        className={cn(
                          "flex-1 h-0.5 mx-2",
                          completed ? "bg-primary" : "bg-border",
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live decline / referral banner */}
          {(declineReasons.length > 0 || referralReasons.length > 0) && (
            <div
              className={cn(
                "rounded-md border p-3 mb-4 space-y-1 text-sidebar-foreground",
                declineReasons.length > 0
                  ? "border-destructive/50 bg-destructive/5"
                  : "border-warning/40 bg-warning/5",
              )}
            >
              <p
                className="text-sm font-medium flex items-center gap-1 text-sidebar-foreground"
              >
                {declineReasons.length > 0 ? (
                  <XCircle className="h-4 w-4 text-destructive" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-warning" />
                )}
                {declineReasons.length > 0
                  ? "Decline triggered"
                  : `${referralReasons.length} referral reason${referralReasons.length > 1 ? "s" : ""}`}
              </p>
              <ul className="text-xs list-disc pl-5 text-sidebar-foreground">
                {[...declineReasons, ...referralReasons].map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          <Card className="p-6">
            {/* ============ STEP 3: COVER FUNDAMENTALS ============ */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Cover Fundamentals</h2>
                  <p className="text-muted-foreground text-sm">
                    Inception, expiry, P&amp;I provider and target price.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estimated inception date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !data.inceptionDate && "text-muted-foreground",
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
                          onSelect={(d) => {
                            if (d) {
                              update({
                                inceptionDate: d,
                                expiryDate: addDays(d, 30),
                              });
                            } else {
                              update({ inceptionDate: undefined });
                            }
                          }}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">
                      Cannot be backdated — past dates trigger referral.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Estimated expiry date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !data.expiryDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {data.expiryDate
                            ? format(data.expiryDate, "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={data.expiryDate}
                          onSelect={(d) => update({ expiryDate: d })}
                          disabled={(d) =>
                            data.inceptionDate
                              ? d < data.inceptionDate ||
                                d > addDays(data.inceptionDate, 365)
                              : false
                          }
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">
                      Max 90 days cover. Longer periods refer to UW.
                      {policyDurationDays > 0 &&
                        ` Currently: ${policyDurationDays} days.`}
                    </p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>P&amp;I provider</Label>
                    <Select
                      value={data.piProvider}
                      onValueChange={(v) => update({ piProvider: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select P&I provider" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {PI_PROVIDERS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Do you wish to set a target price?</Label>
                    <RadioGroup
                      value={data.setTargetPrice}
                      onValueChange={(v) =>
                        update({ setTargetPrice: v as YesNo })
                      }
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="tp-yes" />
                        <Label htmlFor="tp-yes" className="font-normal">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="tp-no" />
                        <Label htmlFor="tp-no" className="font-normal">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  {data.setTargetPrice === "yes" && (
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="targetPrice">Target price (USD)</Label>
                      <Input
                        id="targetPrice"
                        type="number"
                        min={0}
                        value={data.targetPrice}
                        onChange={(e) => update({ targetPrice: e.target.value })}
                        placeholder="e.g. 50000"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============ STEP 1: POLICY HOLDER ============ */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Policy Holder Details</h2>
                  <p className="text-muted-foreground text-sm">
                    Insured identity, location and claims history.
                  </p>
                </div>
                <div className="space-y-4">
                  {/* 1. Address country FIRST — gates the rest of the step */}
                  <div className="space-y-2">
                    <Label>Address country</Label>
                    <CountrySelect
                      value={data.insuredCountry}
                      onChange={(v) => {
                        update({
                          insuredCountry: v,
                          // Reset structured address when country changes
                          addressStreet: "",
                          addressCity: "",
                          addressPostcode: "",
                          addressState: "",
                          address: "",
                        });
                      }}
                    />
                    <CountryFlag country={data.insuredCountry} />
                    {data.insuredCountry &&
                      DECLINE_COUNTRIES.includes(data.insuredCountry) && (
                        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                          <div className="text-sm">
                            <p className="font-medium text-destructive">
                              {data.insuredCountry} is a sanctioned country — cover cannot be offered.
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Please choose a different country to continue.
                            </p>
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Remaining fields gated on a non-declined country selection */}
                  {data.insuredCountry &&
                    !DECLINE_COUNTRIES.includes(data.insuredCountry) && (
                  <>
                  <div className="space-y-2">
                    <Label htmlFor="insuredName">Named insured</Label>
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
                    <p className="text-xs text-muted-foreground">
                      You can add additional insureds post-bind.
                    </p>
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
                    {sanctions && !sanctionsLoading && strongSanctionsMatches.length === 0 && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        No high-confidence OFAC matches found
                      </p>
                    )}
                    {sanctions && !sanctionsLoading && strongSanctionsMatches.length > 0 && (
                      <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 space-y-2">
                        <p className="text-sm font-medium text-destructive flex items-center gap-1">
                          <ShieldAlert className="h-4 w-4" />
                          {strongSanctionsMatches.length} high-confidence OFAC match
                          {strongSanctionsMatches.length > 1 ? "es" : ""} (≥95%) — review required
                        </p>
                        <ul className="text-xs space-y-1">
                          {strongSanctionsMatches.slice(0, 5).map((m, i) => (
                            <li key={i} className="flex justify-between gap-2">
                              <span className="truncate">
                                <span className="font-medium">{m.name}</span>
                                <span className="text-muted-foreground">
                                  {" "}· {m.type || "—"}
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
                  {/* Address — autocomplete for UK/US, free text otherwise */}
                  {(data.insuredCountry === "United Kingdom" ||
                    data.insuredCountry === "United States") ? (
                    <AddressLookup
                      countryCode={
                        data.insuredCountry === "United Kingdom" ? "gb" : "us"
                      }
                      street={data.addressStreet}
                      city={data.addressCity}
                      postcode={data.addressPostcode}
                      onChange={(p) =>
                        update({
                          addressStreet: p.street,
                          addressCity: p.city,
                          addressPostcode: p.postcode,
                          addressState: p.state ?? "",
                          address: [p.street, p.city, p.postcode]
                            .filter(Boolean)
                            .join(", "),
                        })
                      }
                    />
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="address">Full address</Label>
                      <Textarea
                        id="address"
                        value={data.address}
                        onChange={(e) => update({ address: e.target.value })}
                        placeholder="Street, city, region, postcode"
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        Address autocomplete is available for UK and US addresses only.
                      </p>
                    </div>
                  )}
                  </>
                  )}
                </div>
              </div>
            )}

            {/* ============ STEP 2: OPERATOR HISTORY ============ */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Operator History</h2>
                  <p className="text-muted-foreground text-sm">
                    Operating experience and claims history.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Years of experience (operating company)</Label>
                    <RadioGroup
                      value={data.yearsExperience}
                      onValueChange={(v) =>
                        update({ yearsExperience: v as Experience })
                      }
                      className="flex flex-col gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="less_than_3" id="yx-1" />
                        <Label htmlFor="yx-1" className="font-normal">Less than 3 years</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="three_to_five" id="yx-2" />
                        <Label htmlFor="yx-2" className="font-normal">3 – 5 years</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="over_5" id="yx-3" />
                        <Label htmlFor="yx-3" className="font-normal">Over 5 years</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  {data.yearsExperience === "less_than_3" && (
                    <div className="space-y-2">
                      <Label>
                        How many years of experience does the individual
                        controlling the tow have in the industry?
                      </Label>
                      <Select
                        value={data.individualExperience}
                        onValueChange={(v) =>
                          update({ individualExperience: v as Experience })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select experience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="less_than_3">Less than 3 years</SelectItem>
                          <SelectItem value="three_to_five">3 – 5 years</SelectItem>
                          <SelectItem value="over_5">Over 5 years</SelectItem>
                        </SelectContent>
                      </Select>
                      {data.individualExperience === "less_than_3" && (
                        <p className="text-sm text-destructive">
                          Risk declined: individual controlling the tow must
                          have at least 3 years of industry experience.
                        </p>
                      )}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Claims or circumstances in last 5 years?</Label>
                    <p className="text-xs text-muted-foreground">
                      We only need claims that would have been covered under this policy.
                    </p>
                    <RadioGroup
                      value={data.claimsLast5Years}
                      onValueChange={(v) =>
                        update({ claimsLast5Years: v as YesNo })
                      }
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="cl-yes" />
                        <Label htmlFor="cl-yes" className="font-normal">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="cl-no" />
                        <Label htmlFor="cl-no" className="font-normal">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  {data.claimsLast5Years === "yes" && (
                    <div className="space-y-2">
                      <Label htmlFor="claimsExp">Please explain</Label>
                      <Textarea
                        id="claimsExp"
                        value={data.claimsExplanation}
                        onChange={(e) =>
                          update({ claimsExplanation: e.target.value })
                        }
                        placeholder="Detail for underwriters"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============ STEP 4: VESSEL DETAILS ============ */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Vessel Details</h2>
                  <p className="text-muted-foreground text-sm">
                    The vessel that will be towed.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="vesselName">Vessel name</Label>
                    <Input
                      id="vesselName"
                      value={data.vesselName}
                      onChange={(e) => update({ vesselName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Flag</Label>
                    <CountrySelect
                      value={data.flagCountry}
                      onChange={(v) => update({ flagCountry: v })}
                    />
                    <CountryFlag country={data.flagCountry} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imoNumber">IMO # (optional)</Label>
                    <Input
                      id="imoNumber"
                      value={data.imoNumber}
                      onChange={(e) => update({ imoNumber: e.target.value })}
                      placeholder="7-digit IMO number"
                    />
                  </div>
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
                    <Label htmlFor="vesselType">Vessel type</Label>
                    <Input
                      id="vesselType"
                      value={data.vesselType}
                      onChange={(e) => update({ vesselType: e.target.value })}
                      placeholder="e.g. Bulk Carrier"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ============ STEP 5: VOYAGE DETAILS ============ */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Voyage Details</h2>
                  <p className="text-muted-foreground text-sm">
                    Limits, route and trip type.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Limit required</Label>
                    <Select
                      value={data.limit}
                      onValueChange={(v) => update({ limit: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select limit" />
                      </SelectTrigger>
                      <SelectContent>
                        {LIMIT_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={String(o.value)}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Deductible</Label>
                    <Input
                      value={
                        deductible
                          ? `$${deductible.toLocaleString()}`
                          : "Set limit to view deductible"
                      }
                      readOnly
                      className="bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Trip type</Label>
                    <Select
                      value={data.tripType}
                      onValueChange={(v) => update({ tripType: v as TripType })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select trip type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="delivery_voyage">Delivery voyage</SelectItem>
                        <SelectItem value="tow">Tow</SelectItem>
                        <SelectItem value="demolition_voyage">Demolition voyage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {isTow && (
                    <div className="space-y-2">
                      <Label>Marine warranty surveyor</Label>
                      <Select
                        value={data.mwsSurveyor}
                        onValueChange={(v) => update({ mwsSurveyor: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select MWS" />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {MWS_SURVEYORS.map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {data.mwsSurveyor === "Other" && (
                        <p className="text-xs text-warning">
                          "Other" surveyor will refer to UW.
                        </p>
                      )}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Departure country</Label>
                    <CountrySelect
                      value={data.departureCountry}
                      onChange={(v) => update({ departureCountry: v })}
                    />
                    <CountryFlag country={data.departureCountry} />
                  </div>
                  <div className="space-y-2">
                    <Label>Delivery country</Label>
                    <CountrySelect
                      value={data.deliveryCountry}
                      onChange={(v) => update({ deliveryCountry: v })}
                    />
                    <CountryFlag country={data.deliveryCountry} />
                  </div>
                  {isVoyage && (
                    <div className="md:col-span-2 flex items-start space-x-2">
                      <Checkbox
                        id="crewCover"
                        checked={data.crewCoverRequired}
                        onCheckedChange={(c) =>
                          update({ crewCoverRequired: !!c })
                        }
                      />
                      <div className="space-y-1 leading-none">
                        <Label htmlFor="crewCover" className="font-normal">
                          Crew cover required
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Available for voyage trip types only.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="md:col-span-2 flex items-start space-x-2">
                    <Checkbox
                      id="portCover"
                      checked={data.portCoverRequired}
                      onCheckedChange={(c) =>
                        update({ portCoverRequired: !!c })
                      }
                    />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor="portCover" className="font-normal">
                        Port cover required
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Ticking will refer the quote to UW.
                      </p>
                    </div>
                  </div>
                  {data.portCoverRequired && (
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="portDetails">Port cover details</Label>
                      <Textarea
                        id="portDetails"
                        value={data.portCoverDetails}
                        onChange={(e) =>
                          update({ portCoverDetails: e.target.value })
                        }
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============ STEP 6: ATTESTATIONS ============ */}
            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Attestations</h2>
                  <p className="text-muted-foreground text-sm">
                    Confirm operating conditions. Unticked items refer to UW.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    const updates: Partial<MarineTowData> = {
                      vesselSurveyConfirmed: true,
                      cargoLiabilityExcluded: true,
                    };
                    if (isTow) {
                      updates.knockForKnock = true;
                      updates.towagePlanApproved = true;
                      updates.singleVessel = true;
                    }
                    if (isVoyage) {
                      updates.appropriatePlan = true;
                    }
                    if (!data.crewCoverRequired) {
                      updates.crewCoverExcluded = true;
                    }
                    update(updates);
                  }}
                >
                  <Check className="h-4 w-4" />
                  Agree All
                </Button>
                <div className="space-y-3">
                  {isTow && (
                    <>
                      <AttestRow
                        id="kfk"
                        checked={data.knockForKnock}
                        onChange={(c) => update({ knockForKnock: c })}
                        label="Towage contract is on a knock-for-knock basis"
                      />
                      <AttestRow
                        id="tpa"
                        checked={data.towagePlanApproved}
                        onChange={(c) => update({ towagePlanApproved: c })}
                        label="Towage plan and survey have been approved by the accepted MWS prior to commencement of the tow, and all recommendations (including weather window) will be complied with at all times"
                      />
                      <AttestRow
                        id="sv"
                        checked={data.singleVessel}
                        onChange={(c) => update({ singleVessel: c })}
                        label="Tow is for a single vessel (no double tow)"
                      />
                    </>
                  )}
                  {isVoyage && (
                    <AttestRow
                      id="ap"
                      checked={data.appropriatePlan}
                      onChange={(c) => update({ appropriatePlan: c })}
                      label="An appropriate plan including suitable weather window has been undertaken ahead of the voyage and can be evidenced"
                    />
                  )}
                  <AttestRow
                    id="vsc"
                    checked={data.vesselSurveyConfirmed}
                    onChange={(c) => update({ vesselSurveyConfirmed: c })}
                    label="A survey of the vessel's seaworthiness will be completed prior to commencement of the tow"
                  />
                  <AttestRow
                    id="cle"
                    checked={data.cargoLiabilityExcluded}
                    onChange={(c) => update({ cargoLiabilityExcluded: c })}
                    label="Cover for cargo liabilities is excluded"
                  />
                  {!data.crewCoverRequired && (
                    <AttestRow
                      id="cce"
                      checked={data.crewCoverExcluded}
                      onChange={(c) => update({ crewCoverExcluded: c })}
                      label="Cover for Crew is excluded"
                    />
                  )}
                  {!isTow && !isVoyage && (
                    <p className="text-xs text-muted-foreground">
                      Select a trip type on the Voyage step to see trip-specific attestations.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ============ STEP 7: DECLARATION ============ */}
            {step === 7 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Declaration</h2>
                  <p className="text-muted-foreground text-sm">
                    Final confirmations before submission.
                  </p>
                </div>
                <div className="space-y-4">
                  <AttestRow
                    id="decl"
                    checked={data.declarationConfirmed}
                    onChange={(c) => update({ declarationConfirmed: c })}
                    label="I confirm that there are no known or reported incidents that may give rise to a claim other than those declared to underwriters during the OPAL quote process"
                    required
                  />
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="manualRef"
                      checked={data.triggerManualReferral}
                      onCheckedChange={(c) =>
                        update({ triggerManualReferral: !!c })
                      }
                    />
                    <div className="space-y-1 leading-none">
                      <Label htmlFor="manualRef" className="font-normal">
                        Trigger automatic referral to underwriter
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Selecting this option will send the quote to UW for review.
                      </p>
                    </div>
                  </div>
                  {data.triggerManualReferral && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="refNotes">Manual referral details</Label>
                        <Textarea
                          id="refNotes"
                          value={data.manualReferralNotes}
                          onChange={(e) =>
                            update({ manualReferralNotes: e.target.value })
                          }
                          placeholder="Provide context for the underwriter"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Supporting documentation</Label>
                        <label
                          htmlFor="docs"
                          className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground cursor-pointer hover:border-primary/50"
                        >
                          <Upload className="h-4 w-4" />
                          {data.supportingDocs.length > 0
                            ? `${data.supportingDocs.length} file(s) selected`
                            : "Click to attach files"}
                        </label>
                        <input
                          id="docs"
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) =>
                            update({
                              supportingDocs: Array.from(e.target.files || []),
                            })
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6">
              <Button
                variant="ghost"
                onClick={() => goToStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {autoSaveStatus === "saving" && "Saving…"}
                  {autoSaveStatus === "saved" && "Saved"}
                </span>
                <Button
                  variant="outline"
                  onClick={() => saveDraft()}
                  disabled={saving}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save & Exit"}
                </Button>
                {step < steps.length ? (
                <Button
                  onClick={() => goToStep(step + 1)}
                  disabled={!stepValid() || declineReasons.length > 0}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!stepValid() || declineReasons.length > 0}
                >
                  Generate Quote
                </Button>
              )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function AttestRow({
  id,
  checked,
  onChange,
  label,
  required,
}: {
  id: string;
  checked: boolean;
  onChange: (c: boolean) => void;
  label: string;
  required?: boolean;
}) {
  return (
    <div className="flex items-start space-x-2 rounded-md border border-border/60 p-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(c) => onChange(!!c)}
      />
      <Label htmlFor={id} className="font-normal text-sm leading-snug">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
    </div>
  );
}
