
import { cn } from "@/lib/utils";
import { Building2, PalmtreeIcon, ClipboardList, Building, PackageCheck, Lightbulb, Sofa, Box } from "lucide-react";
import AnimatedText from "./AnimatedText";
import { motion } from "framer-motion";

type Service = {
  icon: React.ReactNode;
  title: string;
  description: string;
  image: string;
};

const Services = () => {

  const services: Service[] = [
    {
      icon: <Building2 size={28} />,
      title: "Architecture",
      description: "Thoughtful and sustainable designs for residential, commercial, and mixed-use projects that tell unique spatial stories.",
      image: "https://images.unsplash.com/photo-1487887235947-a955ef187fcc"
    },
    {
      icon: <PalmtreeIcon size={28} />,
      title: "Landscape",
      description: "Creating harmonious outdoor environments that complement architectural designs and enhance the natural surroundings.",
      image: "https://images.unsplash.com/photo-1500673922987-e212871fec22"
    },
    {
      icon: <ClipboardList size={28} />,
      title: "Project Management",
      description: "Comprehensive oversight of all project phases ensuring timely delivery, quality control, and budget management.",
      image: "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e"
    },
    {
      icon: <Building size={28} />,
      title: "Urban Design",
      description: "Strategic planning for city spaces that balance functionality, aesthetics, and sustainability for vibrant communities.",
      image: "https://images.unsplash.com/photo-1473177104440-ffee2f376098"
    },
    {
      icon: <PackageCheck size={28} />,
      title: "Turnkey Contract",
      description: "End-to-end solutions from concept to completion, delivering fully realized spaces ready for immediate use.",
      image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"
    },
    {
      icon: <Lightbulb size={28} />,
      title: "Product Design",
      description: "Crafting unique furniture and decor elements that complement architectural spaces with form and function.",
      image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81"
    },
    {
      icon: <Sofa size={28} />,
      title: "Interiors",
      description: "Creating thoughtful interior spaces that reflect client identity while ensuring comfort and functionality.",
      image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb"
    },
    {
      icon: <Box size={28} />,
      title: "3D Visualization",
      description: "Advanced rendering and modeling techniques to bring designs to life before construction begins.",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158"
    }
  ];

  return (
    <section id="services" className="section bg-secondary/30">
      <div className="container-custom relative">
        <div className="max-w-3xl mx-auto mb-16 md:mb-20 text-center">
          <div className="inline-block mb-3 px-4 py-1 rounded-full bg-primary/5 text-primary/80 text-sm uppercase tracking-wider">
            Services
          </div>
          <AnimatedText 
            text="Innovative solutions for the built environment"
            className="text-3xl md:text-4xl font-display mb-6"
          />
          <p className="text-muted-foreground max-w-xl mx-auto">
            We combine architectural ingenuity with cutting-edge technology to deliver 
            exceptional spaces and products that elevate the human experience.
          </p>
        </div>

        <div className="space-y-12">
          {services.map((service, index) => (
            <ServiceCard 
              key={index} 
              service={service} 
              index={index}
              isEven={index % 2 === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

interface ServiceCardProps {
  service: Service;
  index: number;
  isEven: boolean;
}

const ServiceCard = ({ 
  service, 
  index, 
  isEven 
}: ServiceCardProps) => {
  // Staggered animation for each service card
  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.23, 1, 0.32, 1]
      } 
    }
  };
  
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={variants}
      className="flex flex-col md:flex-row items-center gap-8 md:gap-12"
    >
      {/* Text content always on left, image on right for consistency */}
      <div className="w-full md:w-1/2">
        <div className="glass-card border border-primary/5 rounded-2xl p-8 bg-white/50">
          <div className="flex flex-col h-full">
            <div className="size-14 flex items-center justify-center rounded-xl mb-6 bg-primary/5">
              {service.icon}
            </div>
            
            <h3 className="text-xl font-medium mb-3">{service.title}</h3>
            
            <p className="text-muted-foreground">
              {service.description}
            </p>
            
            <div className="mt-6 w-12 h-0.5 bg-vs/50" />
          </div>
        </div>
      </div>
      
      {/* Service image preview (shown on desktop) */}
      <div className="w-full md:w-1/2 h-64 md:h-80 overflow-hidden rounded-2xl relative shadow-lg hidden md:block">
        <div 
          className="absolute inset-0"
          style={{ 
            backgroundImage: `url(${service.image})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center' 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-50" />
      </div>
    </motion.div>
  );
};

export default Services;
