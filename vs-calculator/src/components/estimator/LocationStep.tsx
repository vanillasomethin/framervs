
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import AnimatedText from "@/components/AnimatedText";

interface LocationStepProps {
  selectedState: string;
  selectedCity: string;
  onStateSelect: (state: string) => void;
  onCitySelect: (city: string) => void;
}

const LocationStep = ({ selectedState, selectedCity, onStateSelect, onCitySelect }: LocationStepProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{state: string, city: string}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Comprehensive list of Indian states
  const states = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", 
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", 
    "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ];
  
  // Expanded set of cities by state
  const citiesByState: Record<string, string[]> = {
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Kakinada", "Kadapa", "Anantapur"],
    "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Namsai", "Tezu", "Roing", "Ziro", "Bomdila", "Tawang", "Along"],
    "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon", "Karimganj", "Sivasagar"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Arrah", "Begusarai", "Chhapra", "Munger", "Saharsa"],
    "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon", "Jagdalpur", "Ambikapur", "Dhamtari", "Raigarh"],
    "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Curchorem", "Sanquelim", "Bicholim", "Valpoi", "Canacona"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Navsari"],
    "Haryana": ["Faridabad", "Gurgaon", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula"],
    "Himachal Pradesh": ["Shimla", "Dharamshala", "Solan", "Mandi", "Palampur", "Kullu", "Hamirpur", "Una", "Nahan", "Bilaspur"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh", "Deoghar", "Giridih", "Ramgarh", "Dumka", "Phusro"],
    "Karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum", "Gulbarga", "Davanagere", "Bellary", "Bijapur", "Shimoga"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Alappuzha", "Kannur", "Kottayam", "Malappuram"],
    "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Amravati", "Nanded"],
    "Manipur": ["Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Ukhrul", "Senapati", "Chandel", "Tamenglong", "Jiribam", "Kakching"],
    "Meghalaya": ["Shillong", "Tura", "Jowai", "Nongpoh", "Baghmara", "Williamnagar", "Resubelpara", "Mawkyrwat", "Khliehriat", "Nongstoin"],
    "Mizoram": ["Aizawl", "Lunglei", "Champhai", "Serchhip", "Kolasib", "Lawngtlai", "Mamit", "Saitual", "Khawzawl", "Hnahthial"],
    "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Phek", "Mon", "Kiphire", "Longleng"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Brahmapur", "Baripada", "Jeypore"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Pathankot", "Hoshiarpur", "Batala", "Moga"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Sikar", "Alwar", "Bharatpur", "Bhilwara"],
    "Sikkim": ["Gangtok", "Namchi", "Gyalshing", "Mangan", "Singtam", "Rangpo", "Jorethang", "Nayabazar", "Ravangla", "Chungthang"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur", "Vellore", "Erode", "Thoothukudi"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Mahbubnagar", "Nalgonda", "Adilabad", "Suryapet"],
    "Tripura": ["Agartala", "Udaipur", "Dharmanagar", "Kailasahar", "Belonia", "Ambassa", "Khowai", "Teliamura", "Sabroom", "Amarpur"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Meerut", "Prayagraj", "Ghaziabad", "Aligarh", "Bareilly", "Moradabad"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur", "Rishikesh", "Kathgodam", "Pithoragarh", "Ramnagar"],
    "West Bengal": ["Kolkata", "Asansol", "Siliguri", "Durgapur", "Bardhaman", "Malda", "Baharampur", "Habra", "Kharagpur", "Shantipur"],
    "Andaman and Nicobar Islands": ["Port Blair", "Car Nicobar", "Mayabunder", "Rangat", "Diglipur", "Little Andaman", "Havelock Island", "Neil Island", "Ross Island", "Kamorta"],
    "Chandigarh": ["Chandigarh", "Manimajra", "Burail", "Badheri", "Attawa", "Daria", "Hallomajra", "Dhanas", "Maloya", "Dadumajra"],
    "Dadra and Nagar Haveli and Daman and Diu": ["Silvassa", "Daman", "Diu", "Amli", "Naroli", "Vapi", "Samarvarni", "Dadra", "Khanvel", "Dudhani"],
    "Delhi": ["New Delhi", "Delhi", "Dwarka", "Rohini", "Pitampura", "Laxmi Nagar", "Janakpuri", "Vasant Kunj", "Karol Bagh", "Connaught Place"],
    "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Kathua", "Udhampur", "Sopore", "Kupwara", "Pulwama", "Poonch"],
    "Ladakh": ["Leh", "Kargil", "Diskit", "Zanskar", "Dras", "Nubra", "Khaltse", "Sankoo", "Padum", "Nyoma"],
    "Lakshadweep": ["Kavaratti", "Agatti", "Amini", "Andrott", "Minicoy", "Kalpeni", "Kiltan", "Kadmat", "Chetlat", "Bitra"],
    "Puducherry": ["Puducherry", "Karaikal", "Yanam", "Mahe", "Villianur", "Ozhukarai", "Ariyankuppam", "Bahour", "Mannadipet", "Nettapakkam"]
  };

  // Generate location suggestions based on search query
  useEffect(() => {
    if (searchQuery.length > 1) {
      const query = searchQuery.toLowerCase();
      const results: {state: string, city: string}[] = [];

      // Check for direct matches in city names and state combinations
      states.forEach(state => {
        const cities = citiesByState[state] || [];
        cities.forEach(city => {
          const fullLocation = `${city}, ${state}`.toLowerCase();
          if (fullLocation.includes(query) || 
              city.toLowerCase().includes(query) || 
              state.toLowerCase().includes(query)) {
            results.push({ state, city });
          }
        });
      });

      // Find nearest matches if exact city not found
      if (results.length === 0) {
        states.forEach(state => {
          if (state.toLowerCase().includes(query)) {
            // If state matches but no city specified, add the capital or first major city
            const cities = citiesByState[state] || [];
            if (cities.length > 0) {
              results.push({ state, city: cities[0] });
            }
          }
        });
      }

      // Limit results to top 10
      setSuggestions(results.slice(0, 10));
      setShowSuggestions(results.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const handleSuggestionClick = (state: string, city: string) => {
    onStateSelect(state);
    onCitySelect(city);
    setSearchQuery(`${city}, ${state}`);
    setShowSuggestions(false);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value === "") {
      onStateSelect("");
      onCitySelect("");
    }
  };

  return (
    <div>
      <AnimatedText 
        text="Where is your project located?"
        className="text-2xl font-display mb-8 text-center"
      />
      
      <div className="max-w-xl mx-auto">
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Type city name (e.g., Mumbai, Bangalore, Delhi)"
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-primary/20 bg-white bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-vs/50 focus:border-transparent"
            value={searchQuery}
            onChange={handleSearchInputChange}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              // Delay hiding so click can register
              setTimeout(() => setShowSuggestions(false), 200);
            }}
          />
          
          {/* Location suggestions dropdown */}
          {showSuggestions && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-primary/10 rounded-lg shadow-lg max-h-60 overflow-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 hover:bg-vs/5 cursor-pointer transition-colors border-b border-primary/5 last:border-b-0"
                  onMouseDown={() => handleSuggestionClick(suggestion.state, suggestion.city)}
                >
                  <MapPin className="h-4 w-4 text-vs" />
                  <span>{suggestion.city}, {suggestion.state}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {selectedState && selectedCity && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-center p-4 glass-card rounded-xl border border-vs/10"
        >
          <p className="text-vs font-medium">
            Selected Location: {selectedCity}, {selectedState}
          </p>
          <p className="text-[#4f090c]/70 text-sm mt-1">
            We'll use location-specific pricing data for your estimate
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default LocationStep;
