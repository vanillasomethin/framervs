/**
 * FSI (Floor Space Index) Rules for Indian Cities
 *
 * FSI = Total Built-up Area / Plot Area
 * These rules vary by city and are based on local municipal regulations
 */

export interface FSIRule {
  city: string;
  residential: {
    minFSI: number;
    maxFSI: number;
    typical: number; // Most common FSI for residential projects
  };
  notes?: string;
}

// FSI rules database for major Indian cities
export const FSI_RULES: Record<string, FSIRule> = {
  // Maharashtra
  "Mumbai": {
    city: "Mumbai",
    residential: { minFSI: 1.0, maxFSI: 3.0, typical: 1.33 },
    notes: "FSI varies by zone. Island City: 1.33, Suburbs: 1.0-2.0, Transit-Oriented Development: up to 3.0"
  },
  "Pune": {
    city: "Pune",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
    notes: "PMC allows 1.5 basic + incentive FSI"
  },
  "Nagpur": {
    city: "Nagpur",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },
  "Nashik": {
    city: "Nashik",
    residential: { minFSI: 1.0, maxFSI: 1.8, typical: 1.5 },
  },
  "Aurangabad": {
    city: "Aurangabad",
    residential: { minFSI: 1.0, maxFSI: 1.8, typical: 1.5 },
  },

  // Delhi NCR
  "Delhi": {
    city: "Delhi",
    residential: { minFSI: 1.2, maxFSI: 3.5, typical: 2.0 },
    notes: "Master Plan 2021: Basic 2.0, can go up to 3.5 in certain zones"
  },
  "Gurgaon": {
    city: "Gurgaon",
    residential: { minFSI: 1.0, maxFSI: 2.25, typical: 1.75 },
  },
  "Noida": {
    city: "Noida",
    residential: { minFSI: 1.0, maxFSI: 2.5, typical: 1.75 },
  },
  "Faridabad": {
    city: "Faridabad",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },
  "Ghaziabad": {
    city: "Ghaziabad",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },

  // Karnataka
  "Bangalore": {
    city: "Bangalore",
    residential: { minFSI: 1.5, maxFSI: 2.5, typical: 2.0 },
    notes: "BBMP allows 1.75-2.5 depending on road width and zone"
  },
  "Mysore": {
    city: "Mysore",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },
  "Mangalore": {
    city: "Mangalore",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },
  "Hubli": {
    city: "Hubli",
    residential: { minFSI: 1.0, maxFSI: 1.75, typical: 1.5 },
  },
  "Belgaum": {
    city: "Belgaum",
    residential: { minFSI: 1.0, maxFSI: 1.75, typical: 1.5 },
  },

  // Tamil Nadu
  "Chennai": {
    city: "Chennai",
    residential: { minFSI: 1.5, maxFSI: 2.0, typical: 1.8 },
    notes: "CMDA allows 1.5-2.0 depending on plot size and location"
  },
  "Coimbatore": {
    city: "Coimbatore",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },
  "Madurai": {
    city: "Madurai",
    residential: { minFSI: 1.0, maxFSI: 1.8, typical: 1.5 },
  },
  "Tiruchirappalli": {
    city: "Tiruchirappalli",
    residential: { minFSI: 1.0, maxFSI: 1.8, typical: 1.5 },
  },
  "Salem": {
    city: "Salem",
    residential: { minFSI: 1.0, maxFSI: 1.8, typical: 1.5 },
  },

  // Telangana & Andhra Pradesh
  "Hyderabad": {
    city: "Hyderabad",
    residential: { minFSI: 1.0, maxFSI: 2.5, typical: 2.0 },
    notes: "GHMC allows up to 2.5 with incentives"
  },
  "Vijayawada": {
    city: "Vijayawada",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },
  "Visakhapatnam": {
    city: "Visakhapatnam",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },
  "Warangal": {
    city: "Warangal",
    residential: { minFSI: 1.0, maxFSI: 1.8, typical: 1.5 },
  },

  // Gujarat
  "Ahmedabad": {
    city: "Ahmedabad",
    residential: { minFSI: 1.2, maxFSI: 2.7, typical: 1.8 },
    notes: "AMC allows 1.8 basic + incentive FSI up to 2.7"
  },
  "Surat": {
    city: "Surat",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.6 },
  },
  "Vadodara": {
    city: "Vadodara",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },
  "Rajkot": {
    city: "Rajkot",
    residential: { minFSI: 1.0, maxFSI: 1.8, typical: 1.5 },
  },
  "Gandhinagar": {
    city: "Gandhinagar",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },

  // Rajasthan
  "Jaipur": {
    city: "Jaipur",
    residential: { minFSI: 1.0, maxFSI: 2.5, typical: 1.8 },
    notes: "JDA allows up to 2.5 on wider roads"
  },
  "Jodhpur": {
    city: "Jodhpur",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },
  "Udaipur": {
    city: "Udaipur",
    residential: { minFSI: 1.0, maxFSI: 1.8, typical: 1.5 },
  },
  "Kota": {
    city: "Kota",
    residential: { minFSI: 1.0, maxFSI: 1.8, typical: 1.5 },
  },

  // Kerala
  "Kochi": {
    city: "Kochi",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },
  "Thiruvananthapuram": {
    city: "Thiruvananthapuram",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },
  "Kozhikode": {
    city: "Kozhikode",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },
  "Thrissur": {
    city: "Thrissur",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },

  // West Bengal
  "Kolkata": {
    city: "Kolkata",
    residential: { minFSI: 1.0, maxFSI: 2.75, typical: 2.0 },
    notes: "KMC allows higher FSI in certain zones"
  },
  "Siliguri": {
    city: "Siliguri",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },
  "Durgapur": {
    city: "Durgapur",
    residential: { minFSI: 1.0, maxFSI: 1.8, typical: 1.5 },
  },

  // Madhya Pradesh
  "Indore": {
    city: "Indore",
    residential: { minFSI: 1.0, maxFSI: 2.5, typical: 2.0 },
  },
  "Bhopal": {
    city: "Bhopal",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },
  "Jabalpur": {
    city: "Jabalpur",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },
  "Gwalior": {
    city: "Gwalior",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },

  // Punjab & Chandigarh
  "Chandigarh": {
    city: "Chandigarh",
    residential: { minFSI: 1.0, maxFSI: 1.5, typical: 1.25 },
    notes: "Planned city with strict FAR controls"
  },
  "Ludhiana": {
    city: "Ludhiana",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },
  "Amritsar": {
    city: "Amritsar",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },
  "Jalandhar": {
    city: "Jalandhar",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },

  // Uttar Pradesh
  "Lucknow": {
    city: "Lucknow",
    residential: { minFSI: 1.0, maxFSI: 2.5, typical: 1.8 },
  },
  "Kanpur": {
    city: "Kanpur",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },
  "Agra": {
    city: "Agra",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },
  "Varanasi": {
    city: "Varanasi",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },
  "Meerut": {
    city: "Meerut",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },

  // Bihar
  "Patna": {
    city: "Patna",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },
  "Gaya": {
    city: "Gaya",
    residential: { minFSI: 1.0, maxFSI: 1.8, typical: 1.5 },
  },

  // Odisha
  "Bhubaneswar": {
    city: "Bhubaneswar",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },
  "Cuttack": {
    city: "Cuttack",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },

  // Chhattisgarh
  "Raipur": {
    city: "Raipur",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },

  // Uttarakhand
  "Dehradun": {
    city: "Dehradun",
    residential: { minFSI: 0.8, maxFSI: 1.75, typical: 1.25 },
    notes: "Hill station with lower FSI limits"
  },

  // Jammu & Kashmir
  "Srinagar": {
    city: "Srinagar",
    residential: { minFSI: 0.8, maxFSI: 1.5, typical: 1.2 },
    notes: "Hilly terrain with restricted development"
  },
  "Jammu": {
    city: "Jammu",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },

  // Goa
  "Panaji": {
    city: "Panaji",
    residential: { minFSI: 1.0, maxFSI: 1.5, typical: 1.2 },
    notes: "Coastal regulations apply"
  },

  // Assam
  "Guwahati": {
    city: "Guwahati",
    residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  },
};

// Default FSI rule for cities not in the database
export const DEFAULT_FSI_RULE: FSIRule = {
  city: "Default",
  residential: { minFSI: 1.0, maxFSI: 2.0, typical: 1.5 },
  notes: "Using standard FSI rules. Please verify with local municipal authorities."
};

/**
 * Get FSI rule for a given city
 */
export function getFSIRule(city: string): FSIRule {
  return FSI_RULES[city] || DEFAULT_FSI_RULE;
}

/**
 * Calculate maximum built-up area based on plot area and city FSI
 */
export function calculateMaxBuiltUpArea(
  plotArea: number,
  city: string,
  areaUnit: "sqft" | "sqm"
): number {
  const fsiRule = getFSIRule(city);
  return plotArea * fsiRule.residential.maxFSI;
}

/**
 * Calculate typical built-up area based on plot area and city FSI
 */
export function calculateTypicalBuiltUpArea(
  plotArea: number,
  city: string,
  areaUnit: "sqft" | "sqm"
): number {
  const fsiRule = getFSIRule(city);
  return plotArea * fsiRule.residential.typical;
}

/**
 * Validate if the proposed built-up area is FSI compliant
 */
export function validateFSICompliance(
  plotArea: number,
  proposedBuiltUpArea: number,
  city: string
): {
  isCompliant: boolean;
  maxAllowed: number;
  fsiUsed: number;
  fsiMax: number;
  message: string;
} {
  const fsiRule = getFSIRule(city);
  const fsiUsed = proposedBuiltUpArea / plotArea;
  const maxAllowed = plotArea * fsiRule.residential.maxFSI;
  const isCompliant = fsiUsed <= fsiRule.residential.maxFSI;

  let message = "";
  if (!isCompliant) {
    message = `The proposed built-up area exceeds the maximum FSI of ${fsiRule.residential.maxFSI} for ${city}. Maximum allowed built-up area is ${Math.round(maxAllowed)} ${""}.`;
  } else {
    message = `FSI compliant. Using ${fsiUsed.toFixed(2)} out of ${fsiRule.residential.maxFSI} maximum FSI.`;
  }

  return {
    isCompliant,
    maxAllowed,
    fsiUsed,
    fsiMax: fsiRule.residential.maxFSI,
    message
  };
}

/**
 * Calculate built-up area per floor based on total built-up area and floor count
 */
export function calculateBuiltUpAreaPerFloor(
  totalBuiltUpArea: number,
  floorCount: number
): number {
  return totalBuiltUpArea / floorCount;
}

/**
 * Suggest maximum floors based on plot area and city FSI
 */
export function suggestMaxFloors(
  plotArea: number,
  city: string,
  typicalFloorArea?: number
): {
  maxFloors: number;
  recommendation: string;
} {
  const fsiRule = getFSIRule(city);
  const maxBuiltUpArea = plotArea * fsiRule.residential.maxFSI;

  // If typical floor area is provided, calculate max floors
  // Otherwise assume 70% of plot area as typical floor area (accounting for setbacks)
  const floorArea = typicalFloorArea || plotArea * 0.7;
  const maxFloors = Math.floor(maxBuiltUpArea / floorArea);

  let recommendation = `Based on FSI of ${fsiRule.residential.maxFSI} for ${city}, `;
  recommendation += `you can build up to ${maxFloors} floors with typical floor area of ${Math.round(floorArea)} sq.units.`;

  return {
    maxFloors,
    recommendation
  };
}
