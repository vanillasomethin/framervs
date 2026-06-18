
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-600 flex flex-col justify-center">
      {/* Full-screen background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1497604401993-f2e922e5cb0a')",
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundAttachment: "fixed",
          zIndex: 0
        }}
      />
      
      <div className="absolute inset-0 bg-black opacity-40 z-10" />
      
      <div className="container-custom relative z-20 flex flex-col justify-end h-screen">
        <div className="lg:w-3/4 mb-28 text-white">
          {/* Categories Section with Animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mb-8"
          >
            <div className="inline-flex items-center text-lg font-light tracking-widest">
              <span>ARCHITECTURE | DESIGN | ART</span>
            </div>
          </motion.div>

          {/* Hero Text with animated span */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light mb-8 leading-tight">
              we believe and conceive realities<br />
              that a human eye may for-ever more behold
            </h1>
            <p className="text-lg md:text-xl font-light opacity-90 max-w-2xl">
              Unbounded by archaic limitations and processes<br />
              we embrace out-topping knowledge with steadfast footsteps
            </p>
          </motion.div>
        </div>
        
        {/* Scroll Down Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10"
        >
          <div className="rounded-full border-2 border-white p-3 animate-bounce">
            <ChevronDown className="w-5 h-5 text-white" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
