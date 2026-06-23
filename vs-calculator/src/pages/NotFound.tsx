
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-6">
      <div className="max-w-md w-full glass-card border border-primary/5 rounded-2xl p-12 text-center">
        <div className="inline-flex items-center justify-center size-20 rounded-full bg-primary/5 mb-6">
          <span className="text-4xl font-display">404</span>
        </div>
        
        <h1 className="text-3xl font-display mb-4">Page not found</h1>
        
        <p className="text-muted-foreground mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        <a 
          href="/" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full transition-colors duration-300 hover:bg-primary/90"
        >
          <ArrowLeft size={16} /> Return Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
