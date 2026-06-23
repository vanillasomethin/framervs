
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const navItems = [{
    label: "Work",
    href: "#projects"
  }, {
    label: "About",
    href: "#about"
  }, {
    label: "Contact",
    href: "#contact"
  }, {
    label: "Pricing",
    href: "/pricing",
    isRoute: true
  }];
  
  const scrollToSection = (href: string) => {
    const element = document.getElementById(href.substring(1));
    if (element) {
      element.scrollIntoView({
        behavior: "smooth"
      });
      setIsMenuOpen(false);
    }
  };
  
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.location.pathname !== "/") {
      window.location.href = "/";
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  };
  
  return (
    <header 
      className={cn("fixed top-0 right-0 z-50 transition-all duration-300 w-full", 
      isScrolled ? "py-3 bg-[#f0ede8]" : "py-4 bg-[#f0ede8]")}
    >
      <div className="container-custom flex justify-between items-center">
        <div className="flex items-center">
          <a href="#" className="flex items-center" onClick={handleLogoClick}>
            <img alt="Vanilla & Somethin'" className="h-24 md:h-28" src="/estimator/lovable-uploads/1938f286-8b49-49bf-bc47-3ac7ef7d6cab.png" />
          </a>
        </div>
        
        <div 
          className="flex items-center justify-center size-12 rounded-full hover:bg-black/5 transition-colors duration-300"
          onClick={toggleMenu}
          onMouseEnter={() => !isMenuOpen && setIsMenuOpen(true)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          <motion.div
            initial={false}
            animate={isMenuOpen ? "open" : "closed"}
          >
            {isMenuOpen ? (
              <motion.div
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-vs hover:text-vs-dark transition-colors duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                <X size={32} strokeWidth={1.5} />
              </motion.div>
            ) : (
              <div className="custom-hamburger w-6 h-6 relative">
                <span className="absolute h-0.5 w-12 bg-vs rounded-full top-2"></span>
                <span className="absolute h-0.5 w-8 bg-vs rounded-full top-4"></span>
              </div>
            )}
          </motion.div>
        </div>
      </div>
      
      {/* Mobile Navigation with enhanced animations */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            ref={menuRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 bg-white dark:bg-black z-40 flex flex-col justify-center"
          >
            <motion.button
              className="absolute top-8 right-8 flex items-center justify-center size-12 rounded-full hover:bg-black/5 text-vs hover:text-vs-dark transition-colors duration-300"
              onClick={() => setIsMenuOpen(false)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <X size={32} strokeWidth={1.5} />
            </motion.button>
            
            <nav className="container-custom">
              <motion.ul 
                className="flex flex-col items-center space-y-10"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: { staggerChildren: 0.1 }
                  }
                }}
              >
                {navItems.map((item, index) => (
                  <motion.li 
                    key={index} 
                    className="w-full text-center"
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                    }}
                  >
                    {item.isRoute ? (
                      <Link 
                        to={item.href} 
                        className="group text-4xl font-display tracking-tight hover:text-vs transition-colors duration-300" 
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <a 
                        href={item.href} 
                        className="group text-4xl font-display tracking-tight hover:text-vs transition-colors duration-300" 
                        onClick={e => {
                          e.preventDefault();
                          scrollToSection(item.href);
                        }}
                      >
                        {item.label}
                      </a>
                    )}
                  </motion.li>
                ))}
              </motion.ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
