
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import AnimatedText from "@/components/AnimatedText";

interface MaterialsStepProps {
  selectedMaterials: string[];
  onMaterialsChange: (materials: string[]) => void;
}

interface Material {
  id: string;
  name: string;
  description: string;
  sustainable: boolean;
  image: string;
}

const MaterialsStep = ({ selectedMaterials, onMaterialsChange }: MaterialsStepProps) => {
  const materials: Material[] = [
    {
      id: "concrete",
      name: "Concrete",
      description: "Durable and versatile building material",
      sustainable: false,
      image: "https://images.unsplash.com/photo-1517582082532-16a092d47074"
    },
    {
      id: "wood",
      name: "Wood",
      description: "Natural and warm aesthetic",
      sustainable: true,
      image: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3"
    },
    {
      id: "glass",
      name: "Glass",
      description: "Modern and transparent element",
      sustainable: false,
      image: "https://images.unsplash.com/photo-1598982631813-45c04b270672"
    },
    {
      id: "steel",
      name: "Steel",
      description: "Strong and industrial material",
      sustainable: false,
      image: "https://images.unsplash.com/photo-1531834685032-c34bf0d84c77"
    },
    {
      id: "reclaimed",
      name: "Reclaimed Materials",
      description: "Repurposed and eco-friendly options",
      sustainable: true,
      image: "https://images.unsplash.com/photo-1521618755572-156ae0cdd74d"
    },
    {
      id: "premium",
      name: "Premium Finishes",
      description: "Luxury materials and finishes",
      sustainable: false,
      image: "https://images.unsplash.com/photo-1617806118233-18e1de247200"
    }
  ];

  const toggleMaterial = (materialId: string) => {
    if (selectedMaterials.includes(materialId)) {
      onMaterialsChange(selectedMaterials.filter(id => id !== materialId));
    } else {
      onMaterialsChange([...selectedMaterials, materialId]);
    }
  };

  return (
    <div>
      <AnimatedText 
        text="Select the materials you're interested in"
        className="text-2xl font-display mb-8 text-center"
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map((material, index) => (
          <motion.div
            key={material.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={cn(
              "group relative border rounded-xl overflow-hidden cursor-pointer transition-all duration-300",
              selectedMaterials.includes(material.id) 
                ? "border-vs ring-2 ring-vs/20" 
                : "border-primary/10 hover:border-primary/30"
            )}
            onClick={() => toggleMaterial(material.id)}
          >
            <div className="absolute inset-0 z-0">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${material.image})` }}
              />
              <div className={cn(
                "absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30 transition-opacity",
                selectedMaterials.includes(material.id) ? "opacity-80" : "opacity-70"
              )} />
            </div>
            
            <div className="relative z-10 p-6 flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-medium text-white">{material.name}</h3>
                
                <div className={cn(
                  "flex-shrink-0 size-6 rounded-full border-2 flex items-center justify-center transition-all",
                  selectedMaterials.includes(material.id) 
                    ? "border-vs bg-vs text-white" 
                    : "border-white/50 group-hover:border-white"
                )}>
                  {selectedMaterials.includes(material.id) && <Check className="size-3" />}
                </div>
              </div>
              
              <p className="text-white/80 text-sm mb-auto">{material.description}</p>
              
              {material.sustainable && (
                <div className="mt-4 inline-block px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                  Sustainable
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-muted-foreground text-sm">
          Select all materials that you'd like to incorporate into your project
        </p>
        
        <div className="mt-4 text-vs font-medium">
          {selectedMaterials.length} material{selectedMaterials.length !== 1 ? 's' : ''} selected
        </div>
      </div>
    </div>
  );
};

export default MaterialsStep;
