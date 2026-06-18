import { ProjectEstimate, ComponentOption } from "@/types/estimator";

/**
 * Format currency in Indian format
 */
export const formatCurrency = (amount: number, showDecimals: boolean = false): string => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: 0
  });

  return formatter.format(amount).replace('₹', '₹');
};

/**
 * Format large amounts in Lakhs/Crores
 */
export const formatIndianCurrency = (amount: number): string => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
};

/**
 * Convert square feet to square meters
 */
export const sqftToSqm = (sqft: number): number => {
  return sqft * 0.092903;
};

/**
 * Convert square meters to square feet
 */
export const sqmToSqft = (sqm: number): number => {
  return sqm * 10.764;
};

/**
 * Validate estimate for accuracy
 */
export const validateEstimate = (estimate: ProjectEstimate) => {
  const warnings: string[] = [];
  const errors: string[] = [];
  const suggestions: string[] = [];
  
  if (estimate.area > 0) {
    const maxArea = estimate.areaUnit === "sqft" ? 50000 : 4645;
    if (estimate.area > maxArea) {
      warnings.push("Very large project area. Custom estimation recommended.");
    }
  }
  
  const qualityLevels: ComponentOption[] = [
    estimate.civilQuality,
    estimate.plumbing,
    estimate.electrical,
  ];
  
  const hasLuxury = qualityLevels.some(q => q === "luxury");
  const hasStandard = qualityLevels.some(q => q === "standard");
  
  if (hasLuxury && hasStandard) {
    suggestions.push("Consider upgrading standard components for consistency.");
  }
  
  const isValid = errors.length === 0;
  
  return {
    isValid,
    warnings,
    errors,
    suggestions,
  };
};

/**
 * Calculate percentage of total
 */
export const calculatePercentage = (part: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
};

/**
 * Get quality level label
 */
export const getQualityLabel = (level: ComponentOption): string => {
  const labels: Record<ComponentOption, string> = {
    none: "Not Required",
    standard: "Standard",
    premium: "Premium",
    luxury: "Luxury",
  };
  return labels[level];
};

/**
 * Check if component is included
 */
export const isComponentIncluded = (value: ComponentOption | undefined): boolean => {
  return !!(value && value !== "none");
};

/**
 * Generate estimate summary text
 */
export const generateEstimateSummary = (estimate: ProjectEstimate): string => {
  const costPerUnit = estimate.totalCost / estimate.area;
  
  return `${estimate.projectType} project in ${estimate.city}, ${estimate.state}
Area: ${estimate.area} ${estimate.areaUnit}
Estimated Cost: ${formatCurrency(estimate.totalCost)}
Cost per ${estimate.areaUnit}: ${formatCurrency(costPerUnit)}
Timeline: ${estimate.timeline.totalMonths} months`;
};
