import { ArrowUp } from "lucide-react";
import { Link } from "react-router-dom";
const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };
  const scrollToSection = (href: string) => {
    const element = document.getElementById(href.substring(1));
    if (element) {
      element.scrollIntoView({
        behavior: "smooth"
      });
    }
  };
  const currentYear = new Date().getFullYear();
  return <footer className="py-12 border-t border-primary/10">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-12">
              <div className="mb-4 md:mb-0">
                <img alt="Vanilla & Somethin'" className="h-16 md:h-20" src="/estimator/lovable-uploads/69c1bc30-50fb-4c01-9cdf-225d59a9224d.png" />
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 md:gap-8 text-center md:text-left">
                <a href="#projects" className="text-sm text-muted-foreground hover:text-vs transition-colors duration-200" onClick={e => {
                e.preventDefault();
                scrollToSection("#projects");
              }}>
                  Projects
                </a>
                <a href="#services" className="text-sm text-muted-foreground hover:text-vs transition-colors duration-200" onClick={e => {
                e.preventDefault();
                scrollToSection("#services");
              }}>
                  Services
                </a>
                <a href="#about" className="text-sm text-muted-foreground hover:text-vs transition-colors duration-200" onClick={e => {
                e.preventDefault();
                scrollToSection("#about");
              }}>
                  About
                </a>
                <a href="#contact" className="text-sm text-muted-foreground hover:text-vs transition-colors duration-200" onClick={e => {
                e.preventDefault();
                scrollToSection("#contact");
              }}>
                  Contact
                </a>
                <Link to="/pricing" className="text-sm text-muted-foreground hover:text-vs transition-colors duration-200">
                  Pricing
                </Link>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex gap-4">
              <a href="#" className="size-9 flex items-center justify-center rounded-full border border-primary/10 hover:border-vs/30 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="#" className="size-9 flex items-center justify-center rounded-full border border-primary/10 hover:border-vs/30 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                </svg>
              </a>
              <a href="#" className="size-9 flex items-center justify-center rounded-full border border-primary/10 hover:border-vs/30 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect width="4" height="12" x="2" y="9"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
            </div>
            
            <button onClick={scrollToTop} className="size-9 flex items-center justify-center rounded-full border border-primary/10 hover:border-vs/30 transition-colors duration-200" aria-label="Scroll to top">
              <ArrowUp size={18} />
            </button>
          </div>
        </div>
        
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>© {currentYear} VS Collective LLP. All rights reserved.</p>
        </div>
      </div>
    </footer>;
};
export default Footer;