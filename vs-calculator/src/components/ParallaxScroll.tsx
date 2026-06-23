
import { useEffect, useRef } from 'react';

const services = [
  "ARCHITECTURE",
  "INTERIORS",
  "URBAN DESIGN",
  "LANDSCAPE",
  "TURNKEY CONTRACT",
  "PROJECT MANAGEMENT",
  "PRODUCT DESIGN"
];

const ParallaxScroll = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleMouseEnter = () => {
      if (scrollRef.current) {
        scrollRef.current.style.animationPlayState = 'paused';
      }
    };
    
    const handleMouseLeave = () => {
      if (scrollRef.current) {
        scrollRef.current.style.animationPlayState = 'running';
      }
    };
    
    const handleClick = () => {
      if (scrollRef.current) {
        // Toggle between paused and running
        const currentState = scrollRef.current.style.animationPlayState;
        scrollRef.current.style.animationPlayState = currentState === 'paused' ? 'running' : 'paused';
      }
    };
    
    const element = scrollRef.current;
    if (element) {
      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);
      element.addEventListener('click', handleClick);
    }
    
    return () => {
      if (element) {
        element.removeEventListener('mouseenter', handleMouseEnter);
        element.removeEventListener('mouseleave', handleMouseLeave);
        element.removeEventListener('click', handleClick);
      }
    };
  }, []);
  
  return (
    <section className="bg-[#4f090c] py-8 overflow-hidden">
      <h2 className="sr-only">Additional Services</h2>
      
      <div className="relative z-10 container mx-auto px-4">
        <div className="services-scroll w-full overflow-hidden">
          <div 
            ref={scrollRef}
            className="services-container whitespace-nowrap cursor-pointer"
          >
            {services.concat(services).map((service, index) => (
              <div 
                key={`service-${index}`}
                className="service-item inline-block px-3"
              >
                <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white font-syne">{service}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ParallaxScroll;
