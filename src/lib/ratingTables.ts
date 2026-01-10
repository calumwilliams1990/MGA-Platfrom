/**
 * Terror Liability Rater - Rating Tables and Calculation Logic
 * Extracted from Terror_Liability_Rater.xlsm
 * 
 * PREMIUM CALCULATION FORMULA:
 * Base Premium = Policy Limit × Base Rate (from Occupancy Type)
 * 
 * Final Premium = Base Premium × Loss Load Factor × Number of Locations Load 
 *                 × EL Employees Load × Deductible Factor × Revenue Load 
 *                 × Policy Limit Factor × Period Length Factor
 * 
 * EL Premium = Base Premium × 5% (if EL coverage selected)
 * Final Premium = Terror Liability Premium + EL Premium
 */

// ============================================================================
// OCCUPANCY TYPES - Base Rate and Referral Status
// ============================================================================
export interface OccupancyType {
  value: string;
  label: string;
  baseRate: number; // Percentage (e.g., 0.08 = 0.08%)
  referral: boolean;
}

export const occupancyTypes: OccupancyType[] = [
  // Non-referral occupancies with rates
  { value: "casino", label: "Casino", baseRate: 0.08, referral: false },
  { value: "construction", label: "Construction", baseRate: 0.02, referral: false },
  { value: "energy_utilities", label: "Energy / Utilities", baseRate: 0.05, referral: false },
  { value: "healthcare", label: "Healthcare", baseRate: 0.05, referral: false },
  { value: "hotel", label: "Hotel", baseRate: 0.08, referral: false },
  { value: "infrastructure", label: "Infrastructure", baseRate: 0.03, referral: false },
  { value: "manufacturing", label: "Manufacturing / Industrial", baseRate: 0.03, referral: false },
  { value: "high_rise", label: "High Rise Buildings", baseRate: 0.04, referral: false },
  { value: "offices", label: "Offices", baseRate: 0.03, referral: false },
  { value: "residential", label: "Residential", baseRate: 0.05, referral: false },
  { value: "restaurants", label: "Restaurants", baseRate: 0.08, referral: false },
  { value: "retail", label: "Retail", baseRate: 0.10, referral: false },
  { value: "media_telecoms", label: "Media / Telecoms", baseRate: 0.10, referral: false },
  
  // Referral-only occupancies (no rate - requires underwriter)
  { value: "automotive", label: "Automotive", baseRate: 0, referral: true },
  { value: "arenas_stadia", label: "Arenas / Stadia / Venues", baseRate: 0.10, referral: true },
  { value: "political", label: "Politically Related Events / Organisations", baseRate: 0, referral: true },
  { value: "abortion_clinics", label: "Abortion / Family Planning Clinics", baseRate: 0, referral: true },
  { value: "security_defense", label: "Security Systems, Defence and Weapons Manufacturer", baseRate: 0, referral: true },
  { value: "mass_transportation", label: "Mass Transportation", baseRate: 0, referral: true },
  { value: "municipal_government", label: "Municipal / Government Buildings / Prisons & Courthouses", baseRate: 0, referral: true },
  { value: "embassies", label: "Embassies / Consulates", baseRate: 0, referral: true },
  { value: "police_military", label: "Police / Military", baseRate: 0, referral: true },
  { value: "religious", label: "Religious Institutions / Houses of Worship", baseRate: 0, referral: true },
  { value: "education", label: "Education", baseRate: 0, referral: true },
  { value: "social_media", label: "Social Media", baseRate: 0, referral: true },
  { value: "other", label: "Other", baseRate: 0, referral: true },
];

// ============================================================================
// PRIOR LOSSES - Load Factor
// ============================================================================
export const priorLossesLoad: Record<string, number> = {
  yes: 1.25, // 125% = 25% additional load
  no: 1.00,  // 100% = no additional load
};

// ============================================================================
// DEDUCTIBLE FACTOR - Exponential curve formula
// Formula: a + b * exp(c * x) where x is deductible as % of policy limit
// Parameters: a = -0.005, b = 0.105, c = -30.00, Min = 0, Max = 0.1
// Result is a discount factor (lower deductible % = higher factor closer to 1)
// ============================================================================
export function calculateDeductibleFactor(deductible: number, policyLimit: number): number {
  if (policyLimit === 0) return 1;
  
  const deductiblePercent = deductible / policyLimit;
  
  // Clamp to valid range (0% to 10%)
  const x = Math.min(Math.max(deductiblePercent, 0), 0.10);
  
  // Exponential curve parameters
  const a = -0.005;
  const b = 0.105;
  const c = -30.00;
  
  // Calculate adjustment (this gives values from ~0.10 at 0% to ~0 at 10%)
  const adjustment = a + b * Math.exp(c * x);
  
  // v1.3 load: base deductible 0% = factor 1.0, higher deductibles get discount
  // Factor = 1 - (1 - (1 + adjustment)) = adjustment + 1... simplified to lookup
  // Using the v1.3 new load column from the rater
  const v13LoadTable: Record<number, number> = {
    0.000: 1.000,
    0.003: 0.993,
    0.005: 0.987,
    0.008: 0.981,
    0.010: 0.975,
    0.013: 0.970,
    0.015: 0.965,
    0.018: 0.961,
    0.020: 0.957,
    0.023: 0.953,
    0.025: 0.950,
    0.028: 0.946,
    0.030: 0.943,
    0.033: 0.940,
    0.035: 0.938,
    0.038: 0.935,
    0.040: 0.933,
    0.043: 0.931,
    0.045: 0.929,
    0.048: 0.927,
    0.050: 0.926,
    0.100: 0.909,
  };
  
  // Find closest match or interpolate
  const keys = Object.keys(v13LoadTable).map(Number).sort((a, b) => a - b);
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (x >= keys[i] && x <= keys[i + 1]) {
      const ratio = (x - keys[i]) / (keys[i + 1] - keys[i]);
      return v13LoadTable[keys[i]] + ratio * (v13LoadTable[keys[i + 1]] - v13LoadTable[keys[i]]);
    }
  }
  
  return x <= 0 ? 1.0 : 0.909;
}

// ============================================================================
// NUMBER OF LOCATIONS - Load Factor
// Linear scale: 1% per location for locations 1-20, then 0.25% per additional
// ============================================================================
export function calculateLocationsLoad(numberOfLocations: number): number {
  if (numberOfLocations <= 0) return 1.0;
  if (numberOfLocations === 1) return 1.0; // 0% adjustment
  
  // Locations 2-20: 1% each
  // Locations 21+: 0.25% each (capped at some point)
  let adjustment = 0;
  
  if (numberOfLocations <= 20) {
    adjustment = (numberOfLocations - 1) * 0.01;
  } else {
    adjustment = 0.19 + (numberOfLocations - 20) * 0.0025;
  }
  
  // Cap at 30%
  adjustment = Math.min(adjustment, 0.30);
  
  return 1 + adjustment;
}

// Detailed location adjustments from rater (for reference)
export const locationAdjustmentsTable: Record<number, number> = {
  1: 0.00, 2: 0.01, 3: 0.02, 4: 0.03, 5: 0.04,
  6: 0.05, 7: 0.06, 8: 0.07, 9: 0.08, 10: 0.09,
  11: 0.093, 12: 0.096, 13: 0.099, 14: 0.102, 15: 0.105,
  16: 0.108, 17: 0.111, 18: 0.114, 19: 0.117, 20: 0.12,
  21: 0.123, 22: 0.126, 23: 0.129, 24: 0.132, 25: 0.135,
  26: 0.138, 27: 0.141, 28: 0.144, 29: 0.147, 30: 0.15,
  31: 0.1525, 32: 0.155, 33: 0.1575, 34: 0.16, 35: 0.1625,
  36: 0.165, 37: 0.1675, 38: 0.17, 39: 0.1725, 40: 0.175,
  41: 0.1775, 42: 0.18, 43: 0.1825, 44: 0.185, 45: 0.1875,
  46: 0.19, 47: 0.1925, 48: 0.195, 49: 0.1975, 50: 0.20,
};

export function getLocationLoadFromTable(numberOfLocations: number): number {
  if (numberOfLocations <= 0) return 1.0;
  
  const adjustment = locationAdjustmentsTable[numberOfLocations] ?? 
    (numberOfLocations > 50 ? 0.20 : 0);
    
  return 1 + adjustment;
}

// ============================================================================
// EMPLOYEE COUNT (EL Cover) - Load Factor
// ============================================================================
export const employeeCountLoad: Record<string, number> = {
  "0-100": 1.05,      // 5% load
  "100-1000": 1.10,   // 10% load
  "1000-10000": 1.15, // 15% load
  "10000+": 1.20,     // 20% load
};

// ============================================================================
// REVENUE / CONSTRUCTION VALUE - Load Factor
// ============================================================================
export interface RevenueThreshold {
  label: string;
  minValue: number;
  adjustment: number; // Percentage adjustment
}

export const revenueThresholds: RevenueThreshold[] = [
  { label: "< USD250m", minValue: 0, adjustment: 0 },
  { label: "USD250m-USD500m", minValue: 250_000_000, adjustment: 0.05 },
  { label: "USD500m-USD1bn", minValue: 500_000_000, adjustment: 0.10 },
  { label: "USD1bn-USD2.5bn", minValue: 1_000_000_000, adjustment: 0.20 },
  { label: "USD2.5bn-USD5bn", minValue: 2_500_000_000, adjustment: 0.35 },
  { label: "USD5bn+", minValue: 5_000_000_000, adjustment: 0.55 },
];

export function calculateRevenueLoad(revenue: number): number {
  // Find the appropriate tier (highest tier that revenue meets or exceeds)
  let adjustment = 0;
  
  for (const threshold of revenueThresholds) {
    if (revenue >= threshold.minValue) {
      adjustment = threshold.adjustment;
    }
  }
  
  return 1 + adjustment;
}

// ============================================================================
// POLICY LIMIT - Discount Factor
// Higher limits get discount: $125M = 10%, $250M = 20%
// ============================================================================
export function calculatePolicyLimitFactor(policyLimit: number): number {
  const scalingFactor = 1_250_000_000; // $1.25B scaling factor
  
  if (policyLimit <= 0) return 1.0;
  
  // Discount = limit / scaling factor, capped at 20%
  const discount = Math.min(policyLimit / scalingFactor, 0.20);
  
  return 1 - discount;
}

// ============================================================================
// POLICY PERIOD LENGTH - Factor
// Discount for shorter periods, slight load for longer
// ============================================================================
export function calculatePeriodFactor(inceptionDate: Date, expiryDate: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const days = Math.round((expiryDate.getTime() - inceptionDate.getTime()) / msPerDay);
  const months = days / 30.44; // Average days per month
  
  // From rater: Discount Factor = 0.005555556 per month deviation from 12
  // 0-12 months: 0% discount (factor = 1.0 scaled by months/12)
  // 12-24 months: 5% discount (pro-rated for coverage)
  // 24-36 months: 10% discount
  // 36-48 months: 20% discount
  
  if (months <= 12) {
    return months / 12; // Pro-rate for partial year
  } else if (months <= 24) {
    return 1 - 0.05 * ((months - 12) / 12);
  } else if (months <= 36) {
    return 0.95 - 0.05 * ((months - 24) / 12);
  } else if (months <= 48) {
    return 0.90 - 0.10 * ((months - 36) / 12);
  }
  
  return 0.80; // 48+ months gets 20% discount (minimum)
}

// ============================================================================
// RISK GRADES - For ZIP code lookup
// ============================================================================
export type RiskGrade = "A" | "B" | "C" | "D" | "E";

export const riskGradeDescriptions: Record<RiskGrade, string> = {
  A: "Highest Risk",
  B: "High Risk",
  C: "Moderate Risk",
  D: "Low Risk",
  E: "Lowest Risk",
};

// Risk grade loads (if applicable - may be used for location-based adjustments)
export const riskGradeLoads: Record<RiskGrade, number> = {
  A: 1.50,  // 50% additional load
  B: 1.25,  // 25% additional load
  C: 1.10,  // 10% additional load
  D: 1.00,  // No adjustment
  E: 0.90,  // 10% discount
};

// ============================================================================
// MAX LIMITS - Policy constraints
// ============================================================================
export const maxLimits = {
  construction: {
    "0-24": 250_000_000,   // $250M for 0-24 months
    "24-36": 208_000_000,  // $208M for 24-36 months
    "36-48": 165_000_000,  // $165M for 36-48 months
  },
  other: {
    "0-24": 100_000_000,   // $100M for 0-24 months
    ">24": "REFER",        // Refer for longer periods
  },
};

// ============================================================================
// COMMISSION
// ============================================================================
export const defaultCommissionRate = 0.325; // 32.5%

// ============================================================================
// COMPLETE PREMIUM CALCULATION
// ============================================================================
export interface PremiumCalculationInputs {
  policyLimit: number;
  occupancyType: string;
  deductible: number;
  priorLosses: boolean;
  numberOfLocations: number;
  numberOfEmployees: string;
  annualRevenue: number;
  inceptionDate: Date;
  expiryDate: Date;
  includeELCoverage?: boolean;
}

export interface PremiumBreakdown {
  basePremium: number;
  baseRate: number;
  lossLoadFactor: number;
  locationsLoadFactor: number;
  employeesLoadFactor: number;
  deductibleFactor: number;
  revenueLoadFactor: number;
  policyLimitFactor: number;
  periodFactor: number;
  terrorLiabilityPremium: number;
  elPremium: number;
  finalPremiumNet: number;
  finalPremiumGross: number;
  referralRequired: boolean;
  referralReasons: string[];
}

export function calculatePremium(inputs: PremiumCalculationInputs): PremiumBreakdown {
  const occupancy = occupancyTypes.find(o => o.value === inputs.occupancyType);
  
  const referralRequired = occupancy?.referral ?? false;
  const referralReasons: string[] = [];
  
  if (referralRequired) {
    referralReasons.push(`Occupancy type "${occupancy?.label}" requires referral`);
  }
  
  // If no occupancy selected or referral-only with no rate, return zero
  if (!occupancy || (occupancy.referral && occupancy.baseRate === 0)) {
    return {
      basePremium: 0,
      baseRate: 0,
      lossLoadFactor: 1,
      locationsLoadFactor: 1,
      employeesLoadFactor: 1,
      deductibleFactor: 1,
      revenueLoadFactor: 1,
      policyLimitFactor: 1,
      periodFactor: 1,
      terrorLiabilityPremium: 0,
      elPremium: 0,
      finalPremiumNet: 0,
      finalPremiumGross: 0,
      referralRequired,
      referralReasons,
    };
  }
  
  // Base Rate (as decimal, e.g., 0.08% = 0.0008)
  const baseRate = occupancy.baseRate / 100;
  
  // Base Premium = Policy Limit × Base Rate
  const basePremium = inputs.policyLimit * baseRate;
  
  // Calculate all factors
  const lossLoadFactor = inputs.priorLosses ? priorLossesLoad.yes : priorLossesLoad.no;
  const locationsLoadFactor = getLocationLoadFromTable(inputs.numberOfLocations);
  const employeesLoadFactor = employeeCountLoad[inputs.numberOfEmployees] ?? 1.05;
  const deductibleFactor = calculateDeductibleFactor(inputs.deductible, inputs.policyLimit);
  const revenueLoadFactor = calculateRevenueLoad(inputs.annualRevenue);
  const policyLimitFactor = calculatePolicyLimitFactor(inputs.policyLimit);
  const periodFactor = calculatePeriodFactor(inputs.inceptionDate, inputs.expiryDate);
  
  // Terror Liability Premium (Net)
  const terrorLiabilityPremium = basePremium 
    * lossLoadFactor 
    * locationsLoadFactor 
    * employeesLoadFactor 
    * deductibleFactor 
    * revenueLoadFactor 
    * policyLimitFactor 
    * periodFactor;
  
  // EL Premium = 5% of Terror Liability Premium
  const elPremium = inputs.includeELCoverage ? terrorLiabilityPremium * 0.05 : 0;
  
  // Final Premium
  const finalPremiumNet = terrorLiabilityPremium + elPremium;
  
  // Gross Premium (with commission)
  const finalPremiumGross = finalPremiumNet / (1 - defaultCommissionRate);
  
  return {
    basePremium,
    baseRate: occupancy.baseRate,
    lossLoadFactor,
    locationsLoadFactor,
    employeesLoadFactor,
    deductibleFactor,
    revenueLoadFactor,
    policyLimitFactor,
    periodFactor,
    terrorLiabilityPremium,
    elPremium,
    finalPremiumNet,
    finalPremiumGross,
    referralRequired,
    referralReasons,
  };
}
