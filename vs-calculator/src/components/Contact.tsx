
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import AnimatedText from "./AnimatedText";

const Contact = () => {
  const { toast } = useToast();
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Email submission
    const emailTo = "design@vanillasometh.in";
    const subject = encodeURIComponent(`Message from ${formState.name}`);
    const body = encodeURIComponent(formState.message);
    const mailtoLink = `mailto:${emailTo}?subject=${subject}&body=${body}`;

    // Open email client
    window.open(mailtoLink, "_blank");

    // Simulate form submission feedback
    setTimeout(() => {
      toast({
        title: "Message prepared",
        description: "Your email client should open with the message ready to send."
      });
      setFormState({
        name: "",
        email: "",
        message: ""
      });
      setIsSubmitting(false);
    }, 1000);
  };
  
  return (
    <section id="contact" className="section">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div>
            <div className="inline-block mb-3 rounded-full bg-primary/5 text-primary/80 text-sm uppercase tracking-wider px-[20px] py-[8px] my-[23px]">
              Contact Us
            </div>
            
            <AnimatedText text="Let's create something exceptional together" className="text-3xl md:text-4xl font-display mb-6" />
            
            <p className="max-w-md mb-8 text-red-950">
              Whether you're looking to discuss a project, explore collaboration opportunities, 
              or simply learn more about our approach, we'd love to hear from you.
            </p>
            
            <div className="space-y-6">
              <div>
                <p className="text-muted-foreground">design@vanillasometh.in</p>
              </div>
              
              <div>
                <p className="text-muted-foreground">
                  IND | Mangalore | #13, Highland Manor                  
                  <br />KSA | Riyadh | #7947, Abu Saad Al Wazir
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <div className="glass-card border border-primary/5 rounded-2xl p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Your Name
                  </label>
                  <input type="text" id="name" name="name" value={formState.name} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-primary/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200" placeholder="Enter your name" />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input type="email" id="email" name="email" value={formState.email} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-primary/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200" placeholder="Enter your email" />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Your Message
                  </label>
                  <textarea id="message" name="message" value={formState.message} onChange={handleChange} required rows={4} className="w-full px-4 py-3 rounded-lg border border-primary/10 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200" placeholder="Tell us about your project" />
                </div>
                
                <button type="submit" disabled={isSubmitting} className={cn("w-full py-3 rounded-lg bg-vs text-white font-medium transition-all duration-200", isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-vs-dark")}>
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
