import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Mail, MessageSquare, Download, ChevronRight, CheckCircle2, Clock, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateEstimatePDF } from "@/utils/pdfExport";
import { ProjectEstimate } from "@/types/estimator";

interface ContactCTAStrategyProps {
  estimate: ProjectEstimate;
}

interface ContactFormData {
  name: string;
  phone: string;
  email: string;
  preferredContact: "phone" | "email" | "whatsapp";
  preferredTime: string;
  message: string;
}

const ContactCTAStrategy = ({ estimate }: ContactCTAStrategyProps) => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    phone: "",
    email: "",
    preferredContact: "phone",
    preferredTime: "morning",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount).replace('₹', '₹');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.email) {
      toast({
        title: "Required fields missing",
        description: "Please fill in your name, phone, and email.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Here you would send to your backend/email service
    console.log("Contact request:", {
      ...formData,
      estimate: {
        totalCost: estimate.totalCost,
        area: estimate.area,
        location: `${estimate.city}, ${estimate.state}`,
        projectType: estimate.projectType,
      }
    });

    setIsSubmitting(false);
    setShowForm(false);

    toast({
      title: "Request Received!",
      description: "Our team will contact you within 24 hours with a detailed quote.",
    });
  };

  const handleDownloadPDF = () => {
    try {
      generateEstimatePDF(estimate);
      toast({
        title: "PDF Downloaded!",
        description: "Your estimate summary has been downloaded."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Value proposition cards */}
      <div className="bg-gradient-to-br from-vs/5 to-vs/10 p-4 rounded-xl border border-vs/20">
        <h3 className="text-base font-bold text-vs-dark mb-3">Get Your Detailed Quote</h3>
        
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white p-2 rounded-lg text-center">
            <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-[10px] text-gray-700 font-medium">Accurate Pricing</p>
          </div>
          <div className="bg-white p-2 rounded-lg text-center">
            <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-[10px] text-gray-700 font-medium">24hr Response</p>
          </div>
          <div className="bg-white p-2 rounded-lg text-center">
            <Users className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <p className="text-[10px] text-gray-700 font-medium">Expert Advice</p>
          </div>
        </div>

        <div className="bg-white/60 p-3 rounded-lg mb-3">
          <div className="mb-2">
            <p className="text-xs text-gray-700 mb-1">
              <span className="font-semibold">Estimated Cost:</span> {formatCurrency(estimate.totalCost)}
            </p>
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Range:</span> {formatCurrency(Math.round(estimate.totalCost * 0.95))} - {formatCurrency(Math.round(estimate.totalCost * 1.05))}
            </p>
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Per {estimate.areaUnit}:</span> ₹{Math.round(estimate.totalCost / estimate.area).toLocaleString()}
              <span className="text-gray-500"> (₹{Math.round((estimate.totalCost / estimate.area) * 0.95).toLocaleString()}-{Math.round((estimate.totalCost / estimate.area) * 1.05).toLocaleString()})</span>
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
            <p className="text-[10px] text-blue-800 font-medium">
              ✓ Based on Bangalore 2025 market rates (₹1,750-1,900/sqft standard)
            </p>
          </div>
          <p className="text-xs text-gray-600">
            This is an indicative estimate. For a precise BOQ tailored to your specific requirements and site conditions, connect with our team.
          </p>
        </div>

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-vs hover:bg-vs-light text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 group"
          >
            <span>Get Detailed Quote</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        ) : null}
      </div>

      {/* Contact form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Share Your Details</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vs/30 focus:border-vs"
                    placeholder="Your name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vs/30 focus:border-vs"
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vs/30 focus:border-vs"
                  placeholder="your@email.com"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Preferred Contact
                  </label>
                  <select
                    name="preferredContact"
                    value={formData.preferredContact}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vs/30 focus:border-vs"
                  >
                    <option value="phone">Phone Call</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Best Time
                  </label>
                  <select
                    name="preferredTime"
                    value={formData.preferredTime}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vs/30 focus:border-vs"
                  >
                    <option value="morning">Morning (9-12)</option>
                    <option value="afternoon">Afternoon (12-5)</option>
                    <option value="evening">Evening (5-8)</option>
                    <option value="anytime">Anytime</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vs/30 focus:border-vs resize-none"
                  placeholder="Any specific requirements or questions..."
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-vs hover:bg-vs-light text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </div>
                  ) : (
                    "Request Detailed Quote"
                  )}
                </button>
              </div>
              
              <p className="text-[10px] text-gray-500 text-center pt-2">
                We respect your privacy. Your information will only be used to provide you with a quote.
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick contact options */}
      <div className="grid grid-cols-3 gap-2">
        <a
          href="tel:+919876543210"
          className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-lg hover:border-vs hover:bg-vs/5 transition-colors group"
        >
          <Phone className="w-5 h-5 text-vs mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-medium text-gray-700">Call Us</span>
        </a>
        
        <a
          href="https://wa.me/919876543210"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
        >
          <MessageSquare className="w-5 h-5 text-green-600 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-medium text-gray-700">WhatsApp</span>
        </a>
        
        <a
          href="mailto:hello@vanillasometh.in"
          className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
        >
          <Mail className="w-5 h-5 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-medium text-gray-700">Email</span>
        </a>
      </div>

      {/* Download option */}
      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-gray-600" />
            <div>
              <p className="text-xs font-medium text-gray-800">Download Summary</p>
              <p className="text-[10px] text-gray-600">Get PDF estimate</p>
            </div>
          </div>
          <button 
            onClick={handleDownloadPDF}
            className="px-3 py-1 text-xs bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactCTAStrategy;
