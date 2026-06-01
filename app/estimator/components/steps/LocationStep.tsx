"use client";

import { useState } from "react";

const STATES_AND_CITIES: Record<string, string[]> = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati", "Rajahmundry", "Kakinada", "Eluru", "Anantapur"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tawang", "Bomdila", "Ziro", "Along", "Tezu", "Aalo", "Changlang"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon", "Dhubri", "Karimganj"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif", "Ara", "Begusarai", "Katihar"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon", "Jagdalpur", "Raigarh", "Ambikapur", "Dhamtari"],
  "Goa": ["Panaji", "Vasco da Gama", "Margao", "Mapusa", "Ponda", "Bicholim", "Calangute", "Candolim", "Anjuna", "Colva"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Bharuch"],
  "Haryana": ["Faridabad", "Gurgaon", "Gurugram", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Solan", "Mandi", "Palampur", "Baddi", "Nahan", "Kullu", "Manali", "Hamirpur"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh", "Giridih", "Ramgarh", "Phusro", "Dumka"],
  "Karnataka": ["Bangalore", "Bengaluru", "Mangalore", "Mysore", "Mysuru", "Hubli", "Dharwad", "Belgaum", "Belagavi", "Gulbarga", "Kalaburagi", "Tumkur", "Davangere", "Shimoga", "Bijapur"],
  "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode", "Kollam", "Thrissur", "Malappuram", "Kannur", "Palakkad", "Alappuzha", "Kottayam"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Sagar", "Satna", "Dewas", "Murwara", "Ratlam"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Amravati", "Nanded", "Kolhapur"],
  "Manipur": ["Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Kakching", "Ukhrul", "Senapati", "Tamenglong", "Chandel", "Jiribam"],
  "Meghalaya": ["Shillong", "Tura", "Jowai", "Nongstoin", "Williamnagar", "Baghmara", "Resubelpara", "Ampati", "Mairang", "Mawkyrwat"],
  "Mizoram": ["Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib", "Serchhip", "Lawngtlai", "Mamit", "Saitual", "Khawzawl"],
  "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Phek", "Mon", "Kiphire", "Longleng"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Brahmapur", "Sambalpur", "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Hoshiarpur", "Batala", "Pathankot", "Moga"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sikar"],
  "Sikkim": ["Gangtok", "Namchi", "Pelling", "Ravangla", "Mangan", "Gyalshing", "Singtam", "Rangpo", "Jorethang", "Soreng"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur", "Vellore", "Erode", "Thoothukudi"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam", "Mahabubnagar", "Nalgonda", "Adilabad", "Suryapet"],
  "Tripura": ["Agartala", "Udaipur", "Dharmanagar", "Kailasahar", "Ambassa", "Belonia", "Khowai", "Sonamura", "Sabroom", "Melaghar"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Meerut", "Noida", "Varanasi", "Allahabad", "Prayagraj", "Bareilly", "Moradabad", "Aligarh"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur", "Rishikesh", "Nainital", "Mussoorie", "Pithoragarh"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Malda", "Baharampur", "Habra", "Kharagpur"],
  "Delhi": ["New Delhi", "Delhi/NCR", "Dwarka", "Rohini", "Noida", "Gurgaon", "Gurugram", "Faridabad", "Ghaziabad", "Greater Noida"],
  "Chandigarh": ["Chandigarh", "Mohali", "Panchkula", "Zirakpur", "Kharar", "Derabassi", "Mullanpur", "Baltana", "Naya Gaon", "Dhanas"],
  "Pondicherry": ["Puducherry", "Pondicherry", "Karaikal", "Mahe", "Yanam", "Villianur", "Ariyankuppam", "Oulgaret", "Nettapakkam", "Bahour"],
};

interface Props {
  selectedState: string;
  selectedCity: string;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
}

export default function LocationStep({ selectedState, selectedCity, onStateChange, onCityChange }: Props) {
  const [cityQuery, setCityQuery] = useState(selectedCity);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const allCities = Object.entries(STATES_AND_CITIES).flatMap(([state, cities]) =>
    cities.map((city) => ({ city, state }))
  );

  const suggestions = cityQuery.length >= 2
    ? allCities
        .filter(({ city, state }) =>
          city.toLowerCase().includes(cityQuery.toLowerCase()) ||
          state.toLowerCase().includes(cityQuery.toLowerCase())
        )
        .slice(0, 8)
    : [];

  const handleCitySelect = (city: string, state: string) => {
    setCityQuery(city);
    onCityChange(city);
    onStateChange(state);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-stone-900 mb-1">Where is your project?</h2>
        <p className="text-stone-500 text-sm">Location affects material costs and labour rates.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">State</label>
          <select
            value={selectedState}
            onChange={(e) => {
              onStateChange(e.target.value);
              onCityChange("");
              setCityQuery("");
            }}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          >
            <option value="">Select a state</option>
            {Object.keys(STATES_AND_CITIES).sort().map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-stone-700 mb-1.5">City</label>
          <input
            type="text"
            value={cityQuery}
            onChange={(e) => {
              setCityQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search city…"
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full rounded-lg border border-stone-200 bg-white shadow-lg">
              {suggestions.map(({ city, state }) => (
                <li key={`${state}-${city}`}>
                  <button
                    type="button"
                    onMouseDown={() => handleCitySelect(city, state)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 flex justify-between"
                  >
                    <span className="text-stone-900">{city}</span>
                    <span className="text-stone-400 text-xs">{state}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedState && (
          <div>
            <p className="text-xs text-stone-500 mb-2">Or pick from {selectedState}:</p>
            <div className="flex flex-wrap gap-2">
              {(STATES_AND_CITIES[selectedState] ?? []).map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleCitySelect(city, selectedState)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    selectedCity === city
                      ? "bg-stone-900 text-white border-stone-900"
                      : "bg-white text-stone-700 border-stone-300 hover:border-stone-500"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
