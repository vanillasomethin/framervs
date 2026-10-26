import { CPWD_COST_INDEX } from "@/data/cpwdCostIndex";

/**
 * Location cost multiplier
 * ========================
 * Relative to a national baseline of ~₹2,100/sqft (multiplier 1.0).
 *
 *   multiplier = anchorMultiplier(state)
 *              × CPWD index(city) / CPWD index(anchor city)
 *              × NON_METRO_FACTOR            (unless the city is the anchor itself)
 *
 * 1. Market-rate cities (MARKET_MULTIPLIERS) are used as-is. These are calibrated
 *    against InfraLens 2026 standard rates (Mumbai 3150, Delhi 2835, Gurgaon 2730,
 *    Pune 2573, Bangalore 2520, Chennai 2363, Hyderabad 2205, Kolkata 2205,
 *    Ahmedabad 2153 ₹/sqft) and already include the metro demand premium.
 * 2. Every other city is priced off its state's anchor city, scaled by the CPWD
 *    Building Cost Index (material + labour cost by station, issued half-yearly).
 *    CPWD indices are only compared WITHIN a state's circular: across states they
 *    track government-work input costs, not market rates (e.g. CPWD puts Bangalore
 *    above Delhi while market rates put Delhi ~12% higher).
 * 3. NON_METRO_FACTOR strips the anchor's metro demand premium for other towns.
 *    0.92 = InfraLens Mangalore standard (₹2,324) / Bangalore (₹2,520), where CPWD
 *    rates the two stations almost equal (119 vs 118).
 * 4. Towns without their own CPWD station use their district's station
 *    (DISTRICT_STATION), else the state's median index.
 * 5. States with no market anchor start from DEFAULT_MULTIPLIER instead.
 * 6. The CPWD ratio is capped at 1 for anchored states: some circulars rate
 *    remote/hill stations (e.g. Madurai 125, Ooty 136 vs Chennai 113) above the
 *    metro, but market rates there don't exceed the metro's.
 */

export const DEFAULT_MULTIPLIER = 0.92;
export const NON_METRO_FACTOR = 0.92;

// Cities with direct market-rate data (InfraLens 2026 calibration)
export const MARKET_MULTIPLIERS: Record<string, number> = {
  // Tier 1 Cities - High cost
  "Mumbai": 1.50,
  "Navi Mumbai": 1.42,
  "Thane": 1.40,
  "Delhi": 1.35,
  "New Delhi": 1.35,
  "Gurgaon": 1.30,
  "Noida": 1.28,
  "Bangalore": 1.20,
  "Bengaluru": 1.20,
  "Pune": 1.22,
  "Hyderabad": 1.05,
  "Chennai": 1.13,
  "Kolkata": 1.05,

  // Tier 2 Cities - Medium cost
  "Ahmedabad": 1.03,
  "Surat": 1.00,
  "Jaipur": 1.05,
  "Kochi": 1.05,
  "Coimbatore": 1.00,
  "Indore": 1.00,
  "Chandigarh": 1.15,
  "Lucknow": 0.98,
  "Visakhapatnam": 0.95,
  "Nagpur": 0.98,
  "Vadodara": 1.00,
};

// The market-rate city each state's other towns are priced from. Mumbai is
// skipped for Maharashtra (its land-driven premium doesn't carry to other towns).
export const STATE_ANCHORS: Record<string, string> = {
  "Karnataka": "Bangalore",
  "Kerala": "Kochi",
  "Tamil Nadu": "Chennai",
  "Maharashtra": "Pune",
  "Telangana": "Hyderabad",
  "West Bengal": "Kolkata",
  "Gujarat": "Ahmedabad",
  "Madhya Pradesh": "Indore",
  "Uttar Pradesh": "Lucknow",
  "Andhra Pradesh": "Visakhapatnam",
  "Rajasthan": "Jaipur",
};

// Whole-city "states" where every locality takes the city rate with no
// non-metro discount.
const CITY_STATES: Record<string, string> = {
  "Delhi": "Delhi",
  "Chandigarh": "Chandigarh",
};

// Towns in the estimator's list mapped to the CPWD station covering their
// district, for Karnataka and Kerala (the core markets).
const DISTRICT_STATION: Record<string, string> = {
  // Dakshina Kannada → Mangalore
  "Puttur": "Mangalore", "Bantwal": "Mangalore", "Moodbidri": "Mangalore", "Ullal": "Mangalore",
  "Surathkal": "Mangalore", "Mulki": "Mangalore", "Belthangady": "Mangalore", "Sullia": "Mangalore",
  "Vitla": "Mangalore", "Dharmasthala": "Mangalore", "Subramanya": "Mangalore",
  // Udupi
  "Manipal": "Udupi", "Kundapura": "Udupi", "Karkala": "Udupi", "Kaup": "Udupi",
  "Brahmavar": "Udupi", "Byndoor": "Udupi",
  // Uttara Kannada → Karwar
  "Ankola": "Karwar", "Gokarna": "Karwar", "Sirsi": "Karwar", "Dandeli": "Karwar", "Yellapur": "Karwar",
  // Shivamogga
  "Bhadravati": "Shimoga", "Sagara": "Shimoga", "Shikaripura": "Shimoga", "Thirthahalli": "Shimoga",
  "Sorab": "Shimoga", "Hosanagara": "Shimoga",
  // Chikkamagaluru
  "Mudigere": "Chikmagalur", "Kadur": "Chikmagalur", "Tarikere": "Chikmagalur",
  // Kodagu
  "Virajpet": "Madikeri", "Somwarpet": "Madikeri",
  // Hassan
  "Sakleshpur": "Hassan", "Belur": "Hassan", "Arsikere": "Hassan", "Channarayapatna": "Hassan",
  "Holenarasipur": "Hassan",
  // Bengaluru Urban / Rural
  "Hosakote": "Bangalore", "Nelamangala": "Bangalore", "Anekal": "Bangalore", "Devanahalli": "Bangalore",
  "Doddaballapur": "Bangalore",

  // Kerala: Kasaragod district
  "Kanhangad": "Kasaragod", "Nileshwar": "Kasaragod", "Manjeshwar": "Kasaragod", "Uppala": "Kasaragod",
  "Kumbla": "Kasaragod", "Cheruvathur": "Kasaragod", "Trikaripur": "Kasaragod", "Bekal": "Kasaragod",
  "Badiadka": "Kasaragod",
  // Kannur
  "Payyanur": "Kannur", "Thalassery": "Kannur", "Taliparamba": "Kannur", "Iritty": "Kannur",
  "Mattannur": "Kannur", "Kuthuparamba": "Kannur", "Panoor": "Kannur", "Sreekandapuram": "Kannur",
  "Anthoor": "Kannur",
  // Kozhikode
  "Koyilandy": "Kozhikode", "Feroke": "Kozhikode", "Ramanattukara": "Kozhikode", "Mukkam": "Kozhikode",
  "Thamarassery": "Kozhikode", "Kunnamangalam": "Kozhikode", "Balussery": "Kozhikode", "Perambra": "Kozhikode",
  // Wayanad
  "Mananthavady": "Kalpetta", "Sulthan Bathery": "Kalpetta", "Vythiri": "Kalpetta", "Meppadi": "Kalpetta",
  // Malappuram
  "Manjeri": "Malappuram", "Tirur": "Malappuram", "Perinthalmanna": "Malappuram", "Ponnani": "Malappuram",
  "Kondotty": "Malappuram", "Nilambur": "Malappuram", "Kottakkal": "Malappuram", "Valanchery": "Malappuram",
  "Tanur": "Malappuram", "Parappanangadi": "Malappuram", "Tirurangadi": "Malappuram", "Edappal": "Malappuram",
  // Palakkad
  "Ottapalam": "Palakkad", "Shoranur": "Palakkad", "Chittur": "Palakkad", "Mannarkkad": "Palakkad",
  "Pattambi": "Palakkad", "Alathur": "Palakkad", "Cherpulassery": "Palakkad", "Vadakkencherry": "Palakkad",
  // Thrissur
  "Guruvayur": "Thrissur", "Kunnamkulam": "Thrissur", "Chalakudy": "Thrissur", "Irinjalakuda": "Thrissur",
  "Kodungallur": "Thrissur", "Wadakkanchery": "Thrissur", "Chavakkad": "Thrissur", "Kodakara": "Thrissur",
  // Ernakulam
  "Aluva": "Ernakulam", "Angamaly": "Ernakulam", "Perumbavoor": "Ernakulam", "Muvattupuzha": "Ernakulam",
  "Kothamangalam": "Ernakulam", "Kalamassery": "Ernakulam", "Thrippunithura": "Ernakulam",
  "Kakkanad": "Ernakulam", "Edappally": "Ernakulam", "North Paravur": "Ernakulam", "Fort Kochi": "Ernakulam",
  "Piravom": "Ernakulam", "Koothattukulam": "Ernakulam",
  // Idukki
  "Thodupuzha": "Painavu", "Kattappana": "Painavu", "Adimali": "Munnar", "Nedumkandam": "Painavu",
  "Kumily": "Painavu",
  // Kottayam
  "Changanassery": "Kottayam", "Vaikom": "Kottayam", "Ettumanoor": "Kottayam", "Kanjirappally": "Kottayam",
  "Erattupetta": "Pala",
  // Alappuzha
  "Cherthala": "Alappuzha", "Haripad": "Kayamkulam", "Mavelikkara": "Kayamkulam", "Chengannur": "Alappuzha",
  "Ambalappuzha": "Alappuzha",
  // Pathanamthitta
  "Thiruvalla": "Pathanamthitta", "Adoor": "Pathanamthitta", "Pandalam": "Pathanamthitta",
  "Ranni": "Pathanamthitta", "Konni": "Pathanamthitta",
  // Kollam
  "Karunagappally": "Kollam", "Punalur": "Kollam", "Kottarakkara": "Kollam", "Paravur": "Kollam",
  "Chathannoor": "Kollam", "Anchal": "Kollam",
  // Thiruvananthapuram
  "Neyyattinkara": "Thiruvananthapuram", "Nedumangad": "Thiruvananthapuram", "Attingal": "Thiruvananthapuram",
  "Varkala": "Thiruvananthapuram", "Kovalam": "Thiruvananthapuram", "Kazhakoottam": "Thiruvananthapuram",
  "Vizhinjam": "Thiruvananthapuram",
};

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/** CPWD index for a city within its state, falling back to district, then state median. */
const getCostIndex = (state: string, city: string): number | null => {
  const data = CPWD_COST_INDEX[state];
  if (!data) return null;
  const stations = data.stations;
  const station = stations[city] !== undefined ? city : DISTRICT_STATION[city];
  if (station && stations[station] !== undefined) return stations[station];
  return median(Object.values(stations));
};

export const getLocationMultiplier = (city: string, state?: string): number => {
  if (MARKET_MULTIPLIERS[city] !== undefined) return MARKET_MULTIPLIERS[city];
  if (!state) return DEFAULT_MULTIPLIER;

  const cityState = CITY_STATES[state];
  if (cityState && MARKET_MULTIPLIERS[cityState] !== undefined) {
    return MARKET_MULTIPLIERS[cityState];
  }

  const anchor = STATE_ANCHORS[state];
  const anchorMultiplier = anchor ? MARKET_MULTIPLIERS[anchor] : DEFAULT_MULTIPLIER;
  // Without a market anchor the default already describes a non-metro town
  const tierFactor = anchor ? NON_METRO_FACTOR : 1;

  const cityIndex = getCostIndex(state, city);
  const data = CPWD_COST_INDEX[state];
  if (cityIndex === null || !data) return round2(anchorMultiplier * tierFactor);

  const referenceIndex = anchor
    ? getCostIndex(state, anchor) ?? cityIndex
    : median(Object.values(data.stations));

  const ratio = cityIndex / referenceIndex;
  return round2(anchorMultiplier * (anchor ? Math.min(ratio, 1) : ratio) * tierFactor);
};

const round2 = (n: number) => Math.round(n * 100) / 100;
