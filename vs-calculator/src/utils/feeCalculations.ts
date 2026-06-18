export interface FeeRates {
  typologies: Record<string, { model: 'PERCENT' | 'SQM'; rate: number; min: number }>;
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
    "Individual House": { model: "PERCENT", rate: 0.08, min: 20000 },
    "Residential Block": { model: "PERCENT", rate: 0.05, min: 50000 },
    "Commercial": { model: "PERCENT", rate: 0.04, min: 80000 },
    "FF&E Procurement": { model: "PERCENT", rate: 0.10, min: 30000 },
    "Landscape - Detailed": { model: "SQM", rate: 150, min: 25000 },
  },
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

  let rawFee = typ.model === "PERCENT" ?
    constructionCost * typ.rate :
    area * typ.rate;

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
    currency
  };
}
