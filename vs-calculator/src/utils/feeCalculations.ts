export interface FeeRates {
  // `coaRate` is the Council of Architecture percentage of construction cost.
  // `useSqftTiers` enables the per-sqft headline pricing (residential practice);
  // when true the fee is the *higher* of the per-sqft and the COA-percentage
  // figure, so the headline reads cleanly while never undercutting COA.
  typologies: Record<string, { model: 'PERCENT' | 'SQM'; rate: number; min: number; useSqftTiers?: boolean }>;
  sqftFeeTiers: Array<{ minArea: number; rate: number }>;
  clientMultipliers: Record<string, number>;
  complexity: Record<string, number>;
  clientInvolvementMultipliers: Record<string, number>;
  premiumMultiplier: number;
  rushMultiplier: number;
  vizPrices: Record<string, number>;
  extraRender: Record<string, number>;
  conversionRates: Record<string, number>;
  profitMargin: number;
  taxRate: number;
  minimumFeeStudio: number;
}

export const defaultFeeRates: FeeRates = {
  typologies: {
    // COA scale: 7.5% individual house, 5% apartment/commercial.
    "Individual House": { model: "PERCENT", rate: 0.075, min: 20000, useSqftTiers: true },
    "Residential Block": { model: "PERCENT", rate: 0.05, min: 50000, useSqftTiers: true },
    "Commercial": { model: "PERCENT", rate: 0.05, min: 80000, useSqftTiers: false },
    "FF&E Procurement": { model: "PERCENT", rate: 0.10, min: 30000 },
    "Landscape - Detailed": { model: "SQM", rate: 150, min: 25000 },
  },
  // Per-sqft design-fee tiers on built-up area (larger projects get economies of
  // scale, so the rate steps down). Evaluated highest-minArea first.
  sqftFeeTiers: [
    { minArea: 3000, rate: 200 },
    { minArea: 1800, rate: 225 },
    { minArea: 0, rate: 250 },
  ],
  clientMultipliers: {
    "Friend/Family": 0.85,
    "Individual": 1.0,
    "Corporate": 1.15,
    "Developer": 1.10,
  },
  complexity: {
    "Simple": 0.9,
    "Standard": 1.0,
    "Premium": 1.2,
    "Luxury": 1.5,
  },
  clientInvolvementMultipliers: {
    "Minimal": 1.035,      // +2-5% (average 3.5%)
    "Low": 1.075,          // +5-10% (average 7.5%)
    "Moderate": 1.125,     // +10-15% (average 12.5%)
    "High": 1.175,         // +15-20% (average 17.5%)
    "Flexible": 1.10,      // Negotiated (average 10%)
  },
  premiumMultiplier: 1.0,
  rushMultiplier: 1.25,
  vizPrices: {
    "None": 0,
    "Standard": 25000,
    "Premium": 50000,
    "Luxury": 100000,
  },
  extraRender: {
    "Interior": 5000,
    "Exterior": 7500,
  },
  conversionRates: {
    "INR": 1,
    "USD": 83,
    "EUR": 90,
  },
  profitMargin: 0.15,
  taxRate: 0.18,
  minimumFeeStudio: 50000,
};

// Returns the per-sqft design-fee rate for a given built-up area.
export function sqftFeeRate(area: number, rates: FeeRates = defaultFeeRates): number {
  const tier = rates.sqftFeeTiers.find((t) => area >= t.minArea);
  return tier ? tier.rate : rates.sqftFeeTiers[rates.sqftFeeTiers.length - 1].rate;
}

export function calculateArchitectFee(
  projectType: string,
  constructionCost: number,
  area: number,
  clientType: string = "Individual",
  complexity: string = "Standard",
  includeFFE: boolean = false,
  includeLandscape: boolean = false,
  vizPackage: string = "Standard",
  isRush: boolean = false,
  currency: string = "INR",
  clientInvolvement: string = "Moderate",
  rates: FeeRates = defaultFeeRates
) {
  const typ = rates.typologies[projectType] || rates.typologies["Individual House"];
  const clientMult = rates.clientMultipliers[clientType] || 1;
  const complexityMult = rates.complexity[complexity] || 1;
  const involvementMult = rates.clientInvolvementMultipliers[clientInvolvement] || 1;
  const premiumMult = rates.premiumMultiplier;
  const rushMult = isRush ? rates.rushMultiplier : 1;

  // Hybrid pricing: the headline is the per-sqft tier where it applies, but the
  // COA percentage acts as a floor so premium/luxury builds (high construction
  // cost) are never undercharged. We take whichever base is larger.
  const percentBase = typ.model === "PERCENT" ? constructionCost * typ.rate : area * typ.rate;
  const perSqftRate = typ.useSqftTiers ? sqftFeeRate(area, rates) : 0;
  const sqftBase = perSqftRate * area;
  const rawFee = Math.max(percentBase, sqftBase);
  const feeBasis: 'sqft' | 'percent' = typ.useSqftTiers && sqftBase >= percentBase ? 'sqft' : 'percent';

  const feeAfterMultipliers = rawFee * clientMult * complexityMult * premiumMult * rushMult * involvementMult;
  const baseFee = Math.max(typ.min || 0, rates.minimumFeeStudio || 0, feeAfterMultipliers);

  const ffeFee = includeFFE ?
    Math.max(
      rates.typologies["FF&E Procurement"].min,
      constructionCost * 0.15 * rates.typologies["FF&E Procurement"].rate
    ) : 0;

  const landscapeFee = includeLandscape ?
    Math.max(
      rates.typologies["Landscape - Detailed"].min,
      area * rates.typologies["Landscape - Detailed"].rate
    ) : 0;

  const vizFee = rates.vizPrices[vizPackage] || 0;
  const overheadAllocation = 80000 / 3;

  // Calculate Client Involvement Factor adjustment
  const baseFeeBeforeCIF = rawFee * clientMult * complexityMult * premiumMult * rushMult;
  const cifAdjustment = baseFeeBeforeCIF * (involvementMult - 1);

  const subtotal = baseFee + ffeFee + landscapeFee + vizFee + overheadAllocation;
  const profit = Math.round(subtotal * rates.profitMargin);
  const tax = Math.round((subtotal + profit) * rates.taxRate);
  const totalFee = subtotal + profit + tax;

  const fx = rates.conversionRates[currency] || 1;
  const totalInCurrency = +(totalFee / fx).toFixed(2);

  return {
    baseFee,
    ffeFee,
    landscapeFee,
    vizFee,
    overheadAllocation,
    cifAdjustment: Math.round(cifAdjustment / fx),
    involvementMultiplier: involvementMult,
    profit,
    tax,
    totalFee: totalInCurrency,
    currency,
    feeBasis,
    perSqftRate,
  };
}
