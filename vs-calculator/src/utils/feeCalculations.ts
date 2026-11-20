export type ArchitectFeeModel = "percentage" | "perSqft" | "fixed";

export interface ArchitectFeeInput {
  model: ArchitectFeeModel;
  constructionCost: number;
  builtUpArea: number;
  percentage?: number;
  ratePerSqFt?: number;
  fixedFee?: number;
  useCoaIndividualHouseScale?: boolean;
  includeCoaDocumentationCharge?: boolean;
  addGst?: boolean;
  gstRate?: number;
}

export interface ArchitectFeeBreakdown {
  professionalFee: number;
  documentationFee: number;
  subtotal: number;
  gst: number;
  total: number;
}

/**
 * Transparent homeowner comparison calculator.
 * COA's published 7.5% individual-house scale is an optional comparison
 * scenario, not represented as a universal statutory minimum.
 * The 10% documentation/communication charge is included only when the
 * appointment adopts or expressly incorporates that scale.
 */
export function calculateArchitectFee(input: ArchitectFeeInput): ArchitectFeeBreakdown {
  const cost = Math.max(0, Number(input.constructionCost) || 0);
  const area = Math.max(0, Number(input.builtUpArea) || 0);
  const professionalFee = input.useCoaIndividualHouseScale
    ? cost * 0.075
    : input.model === "percentage"
      ? cost * Math.max(0, Number(input.percentage) || 0) / 100
      : input.model === "perSqft"
        ? area * Math.max(0, Number(input.ratePerSqFt) || 0)
        : Math.max(0, Number(input.fixedFee) || 0);
  const documentationFee = input.useCoaIndividualHouseScale && input.includeCoaDocumentationCharge
    ? professionalFee * 0.10
    : 0;
  const subtotal = professionalFee + documentationFee;
  const gst = input.addGst ? subtotal * Math.max(0, Number(input.gstRate ?? 18) || 0) / 100 : 0;
  return { professionalFee, documentationFee, subtotal, gst, total: subtotal + gst };
}
