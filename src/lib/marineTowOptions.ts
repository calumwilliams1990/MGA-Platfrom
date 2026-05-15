// Reference data extracted from "Product Book - Marine Tow.xlsx"
// Used by the Marine Tow questionnaire for dropdowns and referral/decline rules.

/**
 * Reconcile a calculated premium against an optional broker target price.
 *  - If no target is set, return the calculated premium.
 *  - If target >= calculated, match the target (no upper limit).
 *  - If target is up to 10% below calculated, match the target.
 *  - If target is more than 10% below calculated, ignore target.
 */
export function applyTargetPrice(
  calculated: number,
  target: number | null | undefined,
): number {
  if (!target || target <= 0 || !Number.isFinite(target)) return calculated;
  if (target >= calculated) return target;
  if (target >= calculated * 0.9) return target;
  return calculated;
}

export const COUNTRIES: string[] = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo (Democratic Republic of the)","Congo (Republic of the)","Costa Rica","Croatia","Cuba","Cyprus","Czechia","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Korea (North)","Korea (South)","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Macedonia","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia (inc. Crimea)","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City (Holy See)","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

// Excluded / declined countries — auto-decline if used as policyholder address,
// flag, departure or delivery country.
export const DECLINE_COUNTRIES: string[] = [
  "Afghanistan","Belarus","Cuba","Iran","Korea (North)","Russia (inc. Crimea)","Venezuela",
];

// Referral countries — UW review required if used as policyholder address,
// flag, departure or delivery country.
export const REFER_COUNTRIES: string[] = [
  "Burundi","Cambodia","Central African Republic","China","Congo (Democratic Republic of the)","Egypt","Guinea","Guinea-Bissau","Haiti","Honduras","Iraq","Ivory Coast","Lebanon","Liberia","Libya","Myanmar","Nicaragua","Sierra Leone","Somalia","South Sudan","Sudan","Syria","Tunisia","Ukraine","Yemen","Zimbabwe",
];

export const PI_PROVIDERS: string[] = [
  "The American Steamship Owners Mutual P&I Association",
  "Aurora P&I",
  "Britannia P&I Club",
  "Charterers P&I Club",
  "China P&I Club",
  "Gard P&I Club",
  "Hydor A/S",
  "Japan P&I Club",
  "Korea P&I Club",
  "The Japan Ship Owners' Mutual P&I Association",
  "London P&I Club",
  "Noord Nederlandsche P&I Club",
  "North P&I Club",
  "NorthStandard",
  "Shipowners' Club",
  "Skuld P&I Club",
  "Standard Club",
  "Steamship Mutual P&I Club",
  "Swedish Club",
  "The American Club",
  "Türk P&I",
  "UK P&I Club",
  "UK Defence Club",
  "West of England P&I Club",
];

export const MWS_SURVEYORS: string[] = [
  "ABL Group",
  "DNV / Noble Denton",
  "Global Maritime",
  "GreenShift Group",
  "Maritime Shipping Bureau",
  "MatthewsDaniel a BV Group Company",
  "Nordic Maritime Solutions Oceans Marine Ltd.",
  "RINA",
  "Solis Marine",
  "StreamTec Solutions",
  "TCIS",
  "TMC Marine a BV Group Company",
  "TÜV Rheinland",
  "Waves Group",
  "WNV Warranty Services",
  "Other",
];

export const LIMIT_OPTIONS: { label: string; value: number }[] = [
  { label: "$5m",   value: 5_000_000 },
  { label: "$10m",  value: 10_000_000 },
  { label: "$25m",  value: 25_000_000 },
  { label: "$50m",  value: 50_000_000 },
  { label: "$75m",  value: 75_000_000 },
  { label: "$100m", value: 100_000_000 },
];

export function deductibleForLimit(limit: number): number {
  if (limit <= 25_000_000) return 25_000;
  if (limit <= 50_000_000) return 50_000;
  return 75_000;
}
