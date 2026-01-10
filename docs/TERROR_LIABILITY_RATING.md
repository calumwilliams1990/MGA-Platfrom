# Terror Liability Rater - Rating Documentation

**Source:** Terror_Liability_Rater.xlsm  
**Last Updated:** January 2025

---

## Premium Calculation Formula

```
Base Premium = Policy Limit × Base Rate (from Occupancy Type)

Terror Liability Premium = Base Premium 
    × Loss Load Factor 
    × Number of Locations Load 
    × EL Employees Load 
    × Deductible Factor 
    × Revenue Load 
    × Policy Limit Factor 
    × Period Length Factor

EL Premium = Terror Liability Premium × 5% (if EL coverage selected)

Final Premium (Net) = Terror Liability Premium + EL Premium
Final Premium (Gross) = Final Premium (Net) / (1 - Commission Rate)
```

**Default Commission Rate:** 32.5%

---

## Input Field Mappings

| Quote Wizard Field | Rater Input | Rating Factor | Location in Rater |
|-------------------|-------------|---------------|-------------------|
| Business Type (Occupancy) | Occupancy Type | Base Rate % | Page 2, rows 344-370 |
| Prior Losses (Yes/No) | Prior Losses | Loss Load Factor | Page 2, rows 289-292 |
| Deductible Amount | Deductible | Deductible Factor | Page 2, rows 296-339 |
| Locations List | Number of Locations | Locations Load | Page 2, rows 365-415 |
| Number of Employees | EL number of employees | EL Employees Load | Page 2, rows 410-414 |
| Annual Revenue | Total Revenue/CV | Revenue Load | Page 2, rows 394-400 |
| Policy Limit | Policy Limit | Policy Limit Factor | Page 2, rows 404-407 |
| Inception/Expiry Dates | Period Length | Period Length Factor | Page 2, rows 417-422 |
| Location ZIP Codes | Zip/Postal Code | Risk Grade Lookup | Page 3+ (ZIP database) |

---

## Rating Tables

### 1. Occupancy Types & Base Rates

| Occupancy Type | Base Rate | Referral Required |
|----------------|-----------|-------------------|
| Casino | 0.08% | No |
| Construction | 0.02% | No |
| Energy / Utilities | 0.05% | No |
| Healthcare | 0.05% | No |
| Hotel | 0.08% | No |
| Infrastructure | 0.03% | No |
| Manufacturing / Industrial | 0.03% | No |
| High Rise Buildings | 0.04% | No |
| Offices | 0.03% | No |
| Residential | 0.05% | No |
| Restaurants | 0.08% | No |
| Retail | 0.10% | No |
| Media / Telecoms | 0.10% | No |
| Arenas / Stadia / Venues | 0.10% | **Yes** |
| Automotive | — | **Yes** |
| Politically Related Events | — | **Yes** |
| Abortion / Family Planning Clinics | — | **Yes** |
| Security Systems / Defence / Weapons | — | **Yes** |
| Mass Transportation | — | **Yes** |
| Municipal / Government / Prisons | — | **Yes** |
| Embassies / Consulates | — | **Yes** |
| Police / Military | — | **Yes** |
| Religious Institutions | — | **Yes** |
| Education | — | **Yes** |
| Social Media | — | **Yes** |
| Other | — | **Yes** |

---

### 2. Prior Losses Load

| Prior Losses | Load Factor |
|--------------|-------------|
| Yes | 125% (1.25) |
| No | 100% (1.00) |

---

### 3. Deductible Factor

**Formula:** Exponential sliding scale based on deductible as % of policy limit

```
Factor = a + b × exp(c × x)

Where:
- x = Deductible ÷ Policy Limit (as decimal, e.g., 0.05 = 5%)
- a = -0.005
- b = 0.105  
- c = -30.00
```

| Deductible % | Factor (v1.3) |
|--------------|---------------|
| 0.0% | 1.000 |
| 0.5% | 0.987 |
| 1.0% | 0.975 |
| 2.0% | 0.957 |
| 3.0% | 0.943 |
| 4.0% | 0.933 |
| 5.0% | 0.926 |
| 7.5% | 0.914 |
| 10.0% | 0.909 (minimum) |

---

### 4. Number of Locations Load

| # of Locations | Adjustment |
|----------------|------------|
| 1 | 0% |
| 2 | 1% |
| 3 | 2% |
| 4 | 3% |
| 5 | 4% |
| 6 | 5% |
| 7 | 6% |
| 8 | 7% |
| 9 | 8% |
| 10 | 9% |
| 11 | 9.3% |
| 12 | 9.6% |
| 13 | 9.9% |
| 14 | 10.2% |
| 15 | 10.5% |
| 20 | 12.0% |
| 30 | 15.0% |
| 40 | 17.5% |
| 50+ | 20.0% (max) |

**Load Factor = 1 + Adjustment**

---

### 5. Employee Count Load (EL Cover)

| Employee Range | Adjustment | Load Factor |
|----------------|------------|-------------|
| 0 - 100 | 5% | 1.05 |
| 100 - 1,000 | 10% | 1.10 |
| 1,000 - 10,000 | 15% | 1.15 |
| 10,000+ | 20% | 1.20 |

---

### 6. Revenue / Construction Value Load

| Revenue Range | Adjustment | Load Factor |
|---------------|------------|-------------|
| < $250M | 0% | 1.00 |
| $250M - $500M | 5% | 1.05 |
| $500M - $1B | 10% | 1.10 |
| $1B - $2.5B | 20% | 1.20 |
| $2.5B - $5B | 35% | 1.35 |
| $5B+ | 55% | 1.55 |

---

### 7. Policy Limit Discount

**Formula:** Linear scale with $1.25B scaling factor

```
Discount = Policy Limit ÷ $1,250,000,000
Discount = min(Discount, 0.20)  // Cap at 20%
Factor = 1 - Discount
```

| Policy Limit | Discount | Factor |
|--------------|----------|--------|
| $0 | 0% | 1.00 |
| $10M | 0.8% | 0.992 |
| $25M | 2% | 0.98 |
| $50M | 4% | 0.96 |
| $100M | 8% | 0.92 |
| $125M | 10% | 0.90 |
| $250M+ | 20% | 0.80 |

---

### 8. Policy Period Factor

| Period Length | Discount | Notes |
|---------------|----------|-------|
| 0-12 months | 0% | Pro-rated by months/12 |
| 12-24 months | 5% | |
| 24-36 months | 10% | |
| 36-48 months | 20% | |

**Formula:**
```
Period Factor = (Months ÷ 12) × (1 - Period Discount)
```

---

### 9. Risk Grades (ZIP Code Lookup)

| Grade | Description | Notes |
|-------|-------------|-------|
| A | Highest Risk | Referral required |
| B | High Risk | Acceptable |
| C | Moderate Risk | Acceptable |
| D | Low Risk | Acceptable |
| E | Lowest Risk | Acceptable |

Risk grades are looked up from the ZIP code database (Page 3+ in rater).

---

## Maximum Limits

### Construction Occupancy
| Period | Max Limit |
|--------|-----------|
| 0-24 months | $250M |
| 24-36 months | $208M |
| 36-48 months | $165M |

### All Other Occupancies
| Period | Max Limit |
|--------|-----------|
| 0-24 months | $100M |
| > 24 months | **REFER** |

---

## Example Calculation

**Inputs:**
- Policy Limit: $10,000,000
- Occupancy: Residential (0.05%)
- Deductible: $0 (0%)
- Locations: 13
- Employees: 0-100
- Revenue: $7,100,000
- Period: 12 months
- Prior Losses: No

**Calculation:**
```
Base Premium = $10,000,000 × 0.0005 = $5,000

Factors:
- Loss Load: 1.000 (no prior losses)
- Locations Load: 1.099 (13 locations = 9.9%)
- EL Employees Load: 1.050 (0-100 employees)
- Deductible Factor: 1.000 (0% deductible)
- Revenue Load: 1.000 (< $250M)
- Policy Limit Factor: 0.992 ($10M / $1.25B = 0.8% discount)
- Period Factor: 1.000 (12 months, no discount)

Terror Liability Premium = $5,000 × 1.000 × 1.099 × 1.050 × 1.000 × 1.000 × 0.992 × 1.000
                        = $5,733 (Net)

With 32.5% commission:
Gross Premium = $5,733 / 0.675 = $8,494
```

---

## Code Implementation

The rating tables are implemented in:
- **`src/lib/ratingTables.ts`** - All rating tables and calculation functions
- **`src/pages/NewQuote.tsx`** - Premium calculation in `calculatePremium()` function

---

## Referral Triggers

1. **Occupancy Type** - Certain occupancies automatically trigger referral
2. **Risk Grade A** - Any location in a Grade A ZIP code
3. **Manual Referral** - Broker-triggered referral
4. **Period > 24 months** - Non-construction occupancies with >24 month period
