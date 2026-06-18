
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import AnimatedText from "./AnimatedText";

type Project = {
  id: number;
  title: string;
  category: string;
  image: string;
  description: string;
  year: string;
};

const Projects = () => {
  const [activeProject, setActiveProject] = useState<number | null>(null);
  const [hoveredProject, setHoveredProject] = useState<number | null>(null);
  const [bgImageIndex, setBgImageIndex] = useState(0);
  
  // Use valid image URLs
  const backgroundImages = [
    "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e",
    "https://images.unsplash.com/photo-1487887235947-a955ef187fcc",
    "https://images.unsplash.com/photo-1473177104440-ffee2f376098",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb"
  ];
  
  // Change background image periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setBgImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Valid project images
  const projects: Project[] = [{
    id: 1,
    title: "Horizon Residences",
    category: "Architecture",
    image: "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e",
    description: "A contemporary residential complex that harmonizes with its natural surroundings while providing exceptional living spaces.",
    year: "2023"
  }, {
    id: 2,
    title: "Echo Collection",
    category: "Furniture",
    image: "https://images.unsplash.com/photo-1487887235947-a955ef187fcc",
    description: "A minimalist furniture collection inspired by the natural forms of coastal landscapes.",
    year: "2022"
  }, {
    id: 3,
    title: "Vertex Tower",
    category: "Commercial",
    image: "https://images.unsplash.com/photo-1473177104440-ffee2f376098",
    description: "A sustainable commercial hub featuring innovative spatial arrangements and energy-efficient systems.",
    year: "2023"
  }, {
    id: 4,
    title: "Aria Residences",
    category: "Residential",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    description: "A luxury residential project that balances privacy and community through thoughtful design interventions.",
    year: "2021"
  }];
  
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.project-card')) {
        setActiveProject(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);
  
  return (
    <section id="projects" 
      className="section py-16 relative"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(240, 237, 232, 0.9), rgba(240, 237, 232, 0.95)), url(${backgroundImages[bgImageIndex]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transition: 'background-image 1.5s ease-in-out'
      }}
    >
      <div className="container-custom">
        <div className="max-w-3xl mx-auto mb-16 md:mb-20 text-center">
          <div className="inline-block mb-3 px-4 py-1 rounded-full bg-primary/5 text-primary/80 text-sm uppercase tracking-wider">SELECTED WORKS</div>
          <AnimatedText text="Crafting spaces with purpose" className="text-3xl md:text-4xl font-display mb-6" />
          <p className="text-muted-foreground max-w-xl mx-auto">
            Each project is a unique narrative, blending form and function to create
            meaningful environments that inspire and endure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {projects.map((project, index) => <ProjectCard key={project.id} project={project} index={index} isActive={activeProject === project.id} isHovered={hoveredProject === project.id} onSelect={() => setActiveProject(project.id === activeProject ? null : project.id)} onHover={() => setHoveredProject(project.id)} onLeave={() => setHoveredProject(null)} />)}
        </div>
      </div>
    </section>
  );
};

interface ProjectCardProps {
  project: Project;
  index: number;
  isActive: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: () => void;
  onLeave: () => void;
}

const ProjectCard = ({
  project,
  index,
  isActive,
  isHovered,
  onSelect,
  onHover,
  onLeave
}: ProjectCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  return (
    <div 
      ref={cardRef} 
      className={cn(
        "project-card group relative aspect-[4/3] overflow-hidden rounded-2xl cursor-pointer", 
        "opacity-0 translate-y-4 animate-slide-up"
      )} 
      style={{
        animationDelay: `${index * 100 + 100}ms`
      }} 
      onClick={onSelect} 
      onMouseEnter={onHover} 
      onMouseLeave={onLeave}
    >
      <div className="absolute inset-0 z-0 transition-transform duration-700 ease-out will-change-transform">
        <div 
          className="parallax-image absolute inset-0 bg-cover bg-center transition-transform duration-700" 
          style={{
            backgroundImage: `url(${project.image})`,
            transform: isHovered ? 'scale(1.05)' : 'scale(1)'
          }} 
        />
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-opacity duration-500", 
          isActive ? "opacity-90" : "opacity-50 group-hover:opacity-70"
        )} />
      </div>
      
      <div className="absolute inset-0 z-10 p-6 md:p-8 flex flex-col justify-end transition-all duration-500">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase tracking-wider text-white/70">{project.category}</span>
            <span className="text-xs text-white/70">{project.year}</span>
          </div>
          
          <h3 className={cn(
            "text-xl md:text-2xl text-white font-medium transition-all duration-500", 
            isActive && "text-2xl md:text-3xl mb-4"
          )}>
            {project.title}
          </h3>
          
          <p className={cn(
            "text-white/80 max-w-md transition-all duration-500", 
            isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 hidden md:block md:group-hover:opacity-70 md:group-hover:translate-y-0"
          )}>
            {project.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Projects;
