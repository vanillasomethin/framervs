
import { cn } from "@/lib/utils";
import AnimatedText from "./AnimatedText";
import { motion } from "framer-motion";
import StoryAnimation from "./StoryAnimation";

const About = () => {
  return (
    <section id="about" className="section py-12 md:py-20 bg-vs text-white">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="order-2 md:order-1">
            <div className="relative">
              <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 size-24 md:size-40 rounded-full bg-white/10 animate-pulse" style={{ animationDuration: '8s' }} />
              <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 size-32 md:size-48 rounded-full bg-white/10 animate-pulse" style={{ animationDuration: '12s' }} />
              
              <div className="relative z-10 overflow-hidden rounded-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1503387762-592deb58ef4e" 
                  alt="Modern architecture design" 
                  className="w-full h-80 object-cover"
                />
              </div>
            </div>
          </div>
          
          <div className="order-1 md:order-2">
            <div className="space-y-4">
              <div className="inline-block mb-2 px-4 py-1 rounded-full bg-white/10 text-white text-sm uppercase tracking-wider">
                Our Story
              </div>
              
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-light tracking-wide mb-3 text-white leading-tight">
                Pushing creative boundaries through design
              </h2>
              
              <div className="space-y-3 text-white/90">
                <p>
                  Vanilla & Somethin' is an innovative architecture and design firm operating under the umbrella of VS Collective LLP. Founded on the principle that exceptional design comes from a harmonious blend of creativity, functionality, and technological innovation.
                </p>
                <p>
                  Our multidisciplinary team works collaboratively across architecture, interior design, and furniture creation—pushing boundaries and reimagining what spaces can be. We believe in the power of thoughtful design to transform how people experience their environments.
                </p>
                <p>
                  What sets us apart is our commitment to integrating cutting-edge technology like drone mapping into our design process, allowing for unprecedented precision and creativity in our architectural solutions.
                </p>
              </div>
              
              <div className="pt-3">
                <a 
                  href="#contact" 
                  className="inline-block px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm uppercase tracking-wider transition-colors duration-300"
                >
                  Get in Touch
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
