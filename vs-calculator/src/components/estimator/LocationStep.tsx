
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
    "Karnataka": [
      "Bangalore", "Mangalore", "Mysore", "Hubli", "Dharwad", "Belgaum", "Gulbarga", "Davanagere", "Bellary", "Bijapur", "Shimoga", "Udupi", "Tumkur",
      "Bagalkot", "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikmagalur", "Chitradurga", "Gadag", "Hassan", "Haveri", "Madikeri", "Kolar", "Koppal",
      "Mandya", "Raichur", "Ramanagara", "Karwar", "Yadgir", "Hospet", "Doddaballapur",
      "Puttur", "Bantwal", "Moodbidri", "Ullal", "Surathkal", "Mulki", "Belthangady", "Sullia", "Vitla", "Dharmasthala", "Subramanya",
      "Manipal", "Kundapura", "Karkala", "Kaup", "Brahmavar", "Byndoor", "Bhatkal", "Kumta", "Honnavar", "Ankola", "Gokarna", "Sirsi", "Dandeli", "Yellapur",
      "Bhadravati", "Sagara", "Shikaripura", "Thirthahalli", "Sorab", "Hosanagara", "Sringeri", "Mudigere", "Kadur", "Tarikere",
      "Kushalnagar", "Virajpet", "Somwarpet", "Sakleshpur", "Belur", "Arsikere", "Channarayapatna", "Holenarasipur",
      "Hosakote", "Nelamangala", "Anekal", "Devanahalli", "Kanakapura", "Channapatna", "Magadi", "Maddur", "Malavalli", "Srirangapatna", "Krishnarajpet",
      "Nanjangud", "Hunsur", "Kollegal", "Tiptur", "Sira", "Kunigal", "Gubbi", "Chintamani", "Gauribidanur", "Sidlaghatta", "Kolar Gold Fields", "Mulbagal", "Malur",
      "Hiriyur", "Challakere", "Holalkere", "Harihar", "Ranebennur", "Byadgi", "Savanur", "Gokak", "Chikkodi", "Athani", "Nipani", "Bailhongal", "Saundatti", "Khanapur",
      "Jamkhandi", "Ilkal", "Badami", "Mudhol", "Gangavathi", "Sindhanur", "Lingasugur", "Manvi", "Basavakalyan", "Bhalki", "Humnabad", "Aurad",
      "Shahapur", "Shorapur", "Sedam", "Chittapur", "Jewargi", "Sindagi", "Indi", "Muddebihal", "Lakshmeshwar", "Nargund", "Kalghatgi"
    ],
    "Kerala": [
      "Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kannur", "Kasaragod", "Kollam", "Palakkad", "Alappuzha", "Kottayam", "Malappuram",
      "Pathanamthitta", "Kalpetta", "Painavu", "Ernakulam",
      "Kanhangad", "Nileshwar", "Manjeshwar", "Uppala", "Kumbla", "Cheruvathur", "Trikaripur", "Bekal", "Badiadka",
      "Payyanur", "Thalassery", "Taliparamba", "Iritty", "Mattannur", "Kuthuparamba", "Panoor", "Sreekandapuram", "Anthoor",
      "Vadakara", "Koyilandy", "Feroke", "Ramanattukara", "Mukkam", "Thamarassery", "Kunnamangalam", "Balussery", "Perambra", "Nadapuram",
      "Mananthavady", "Sulthan Bathery", "Vythiri", "Meppadi",
      "Manjeri", "Tirur", "Perinthalmanna", "Ponnani", "Kondotty", "Nilambur", "Kottakkal", "Valanchery", "Tanur", "Parappanangadi", "Tirurangadi", "Edappal",
      "Ottapalam", "Shoranur", "Chittur", "Mannarkkad", "Pattambi", "Alathur", "Cherpulassery", "Vadakkencherry",
      "Guruvayur", "Kunnamkulam", "Chalakudy", "Irinjalakuda", "Kodungallur", "Wadakkanchery", "Chavakkad", "Kodakara",
      "Aluva", "Angamaly", "Perumbavoor", "Muvattupuzha", "Kothamangalam", "Kalamassery", "Thrippunithura", "Kakkanad", "Edappally", "North Paravur", "Fort Kochi", "Piravom", "Koothattukulam",
      "Thodupuzha", "Kattappana", "Munnar", "Adimali", "Nedumkandam", "Kumily",
      "Pala", "Changanassery", "Vaikom", "Ettumanoor", "Kanjirappally", "Erattupetta",
      "Cherthala", "Kayamkulam", "Haripad", "Mavelikkara", "Chengannur", "Ambalappuzha",
      "Thiruvalla", "Adoor", "Pandalam", "Ranni", "Konni",
      "Karunagappally", "Punalur", "Kottarakkara", "Paravur", "Chathannoor", "Anchal",
      "Neyyattinkara", "Nedumangad", "Attingal", "Varkala", "Kovalam", "Kazhakoottam", "Vizhinjam"
    ],
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

  // Alternate / older spellings people commonly type, mapped to the name used
  // in the list above (which is also the key for pricing and FSI lookups).
  const cityAliases: Record<string, string> = {
    "bengaluru": "Bangalore", "mangaluru": "Mangalore", "mysuru": "Mysore", "hubballi": "Hubli",
    "belagavi": "Belgaum", "kalaburagi": "Gulbarga", "ballari": "Bellary", "vijayapura": "Bijapur",
    "shivamogga": "Shimoga", "tumakuru": "Tumkur", "chikkamagaluru": "Chikmagalur", "hosapete": "Hospet",
    "coorg": "Madikeri", "kodagu": "Madikeri", "kgf": "Kolar Gold Fields", "karkal": "Karkala", "kundapur": "Kundapura",
    "cochin": "Kochi", "trivandrum": "Thiruvananthapuram", "calicut": "Kozhikode", "trichur": "Thrissur",
    "alleppey": "Alappuzha", "quilon": "Kollam", "cannanore": "Kannur", "palghat": "Palakkad", "tellicherry": "Thalassery",
    "kasargod": "Kasaragod", "kasaragode": "Kasaragod", "kasarkod": "Kasaragod",
    "wayanad": "Kalpetta", "idukki": "Painavu", "badagara": "Vadakara", "quilandy": "Koyilandy", "alwaye": "Aluva",
    "palai": "Pala", "tiruvalla": "Thiruvalla", "guruvayoor": "Guruvayur", "sultan bathery": "Sulthan Bathery"
  };

  // Generate location suggestions based on search query
  useEffect(() => {
    // Don't reopen the dropdown for the "City, State" text we just filled in
    if (selectedCity && searchQuery === `${selectedCity}, ${selectedState}`) {
      setShowSuggestions(false);
      return;
    }
    if (searchQuery.trim().length > 1) {
      const query = searchQuery.trim().toLowerCase();
      // Rank: city starts with query > city contains query > alias match > state match
      const scored: {state: string, city: string, score: number}[] = [];
      const aliasTargets = new Set(
        Object.entries(cityAliases)
          .filter(([alias]) => alias.startsWith(query) || query.startsWith(alias))
          .map(([, city]) => city)
      );

      states.forEach(state => {
        const cities = citiesByState[state] || [];
        cities.forEach(city => {
          const name = city.toLowerCase();
          let score = 0;
          if (name.startsWith(query)) score = 4;
          else if (name.includes(query)) score = 3;
          else if (aliasTargets.has(city)) score = 2;
          else if (state.toLowerCase().includes(query) || `${city}, ${state}`.toLowerCase().includes(query)) score = 1;
          if (score > 0) scored.push({ state, city, score });
        });
      });

      const results = scored
        .sort((a, b) => b.score - a.score)
        .map(({ state, city }) => ({ state, city }));

      // Limit results to top 10
      setSuggestions(results.slice(0, 10));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, selectedCity, selectedState]);

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

  // Title-cased version of what the user typed, for towns not in the list
  const customCityName = searchQuery
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

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
            placeholder="Type your city or town (e.g., Mangalore, Kasaragod, Kochi)"
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
              {suggestions.length === 0 && (
                <>
                  <p className="px-3 pt-3 pb-1 text-xs text-[#4f090c]/60">
                    Not in our list? Use your town anyway:
                  </p>
                  {["Karnataka", "Kerala"].map((state) => (
                    <div
                      key={state}
                      className="flex items-center gap-2 p-3 hover:bg-vs/5 cursor-pointer transition-colors border-b border-primary/5 last:border-b-0"
                      onMouseDown={() => handleSuggestionClick(state, customCityName)}
                    >
                      <MapPin className="h-4 w-4 text-vs" />
                      <span>{customCityName}, {state}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {selectedState && selectedCity && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-center p-4 bg-white rounded-xl border border-vs/10"
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
