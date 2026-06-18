import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateArchitectFee } from '@/utils/feeCalculations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AnimatedText from '@/components/AnimatedText';
import {
  Home,
  Building2,
  Building,
  Users,
  Zap,
  FileText,
  AlertCircle,
  Check,
  ChevronRight,
  ChevronLeft,
  Info,
  Download,
  Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ArchitectFee() {
  const [currentStep, setCurrentStep] = useState(1);
  const [projectType, setProjectType] = useState<string>('');
  const [constructionCost, setConstructionCost] = useState<string>('');
  const [area, setArea] = useState<string>('');
  const [clientType, setClientType] = useState<string>('');
  const [complexity, setComplexity] = useState<string>('');
  const [clientInvolvement, setClientInvolvement] = useState<string>('');
  const [includeFFE, setIncludeFFE] = useState(false);
  const [includeLandscape, setIncludeLandscape] = useState(false);
  const [vizPackage, setVizPackage] = useState('None');
  const [isRush, setIsRush] = useState(false);
  const [currency, setCurrency] = useState('INR');

  const contentRef = useRef<HTMLDivElement>(null);

  const projectTypes = [
    {
      id: 'Individual House',
      name: 'Individual House',
      icon: Home,
      description: 'Single residential unit design',
      baseRate: '8% of construction cost',
      minFee: '₹20,000'
    },
    {
      id: 'Residential Block',
      name: 'Residential Block',
      icon: Building2,
      description: 'Multi-unit residential complex',
      baseRate: '5% of construction cost',
      minFee: '₹50,000'
    },
    {
      id: 'Commercial',
      name: 'Commercial',
      icon: Building,
      description: 'Office, retail, or commercial space',
      baseRate: '4% of construction cost',
      minFee: '₹80,000'
    }
  ];

  const clientTypes = [
    {
      id: 'Friend/Family',
      name: 'Friend/Family',
      description: 'Special discounted rate for close connections',
      multiplier: '0.85×',
      discount: '-15%'
    },
    {
      id: 'Individual',
      name: 'Individual',
      description: 'Standard client rate for individual homeowners',
      multiplier: '1.0×',
      discount: 'Standard'
    },
    {
      id: 'Corporate',
      name: 'Corporate',
      description: 'Corporate/business client projects',
      multiplier: '1.15×',
      discount: '+15%'
    },
    {
      id: 'Developer',
      name: 'Developer',
      description: 'Real estate developer partnerships',
      multiplier: '1.10×',
      discount: '+10%'
    }
  ];

  const complexityLevels = [
    {
      id: 'Simple',
      name: 'Simple',
      description: 'Straightforward design with minimal customization. Basic layouts, standard materials, simple elevations.',
      multiplier: '0.9×'
    },
    {
      id: 'Standard',
      name: 'Standard',
      description: 'Moderate complexity with custom elements. Custom layouts, mixed materials, detailed elevations, basic 3D views.',
      multiplier: '1.0×'
    },
    {
      id: 'Premium',
      name: 'Premium',
      description: 'High-end design with advanced features. Complex layouts, premium materials, advanced elevations, multiple 3D renderings.',
      multiplier: '1.2×'
    },
    {
      id: 'Luxury',
      name: 'Luxury',
      description: 'Ultra-luxury with bespoke design elements. Bespoke layouts, luxury finishes, architectural features, extensive 3D work.',
      multiplier: '1.5×'
    }
  ];

  const involvementLevels = [
    {
      id: 'Minimal',
      name: 'Minimal',
      description: 'Provide clear brief, trust design decisions. 2 design presentation rounds, email updates.',
      multiplier: '1.035×',
      premium: '+3.5%'
    },
    {
      id: 'Low',
      name: 'Low',
      description: 'Occasional input on major decisions only. 3 design review rounds, bi-weekly updates.',
      multiplier: '1.075×',
      premium: '+7.5%'
    },
    {
      id: 'Moderate',
      name: 'Moderate',
      description: 'Regular reviews and feedback on key milestones. 4 design review rounds, phone & email support.',
      multiplier: '1.125×',
      premium: '+12.5%'
    },
    {
      id: 'High',
      name: 'High',
      description: 'Frequent involvement, detailed reviews, multiple revisions. Unlimited review rounds, priority support.',
      multiplier: '1.175×',
      premium: '+17.5%'
    }
  ];

  const vizPackages = [
    { id: 'None', name: 'No Visualization', price: 0, description: '2D drawings only' },
    { id: 'Standard', name: 'Standard', price: 25000, description: '3-4 exterior views, basic materials, HD resolution' },
    { id: 'Premium', name: 'Premium', price: 50000, description: '6-8 views (exterior + interior), realistic materials, 4K resolution' },
    { id: 'Luxury', name: 'Luxury', price: 100000, description: 'Photorealistic renders + 360° walkthrough, 10+ views' }
  ];

  const architectFee = React.useMemo(() => {
    if (!projectType || !clientType || !complexity || !clientInvolvement || !constructionCost || !area) {
      return {
        baseFee: 0,
        cifAdjustment: 0,
        ffeFee: 0,
        landscapeFee: 0,
        vizFee: 0,
        overheadAllocation: 0,
        profit: 0,
        tax: 0,
        totalFee: 0
      };
    }

    return calculateArchitectFee(
      projectType,
      parseFloat(constructionCost) || 0,
      parseFloat(area) || 0,
      clientType,
      complexity,
      includeFFE,
      includeLandscape,
      vizPackage,
      isRush,
      currency,
      clientInvolvement
    );
  }, [projectType, constructionCost, area, clientType, complexity, includeFFE, includeLandscape, vizPackage, isRush, currency, clientInvolvement]);

  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : '€';

  const canProceed = () => {
    switch (currentStep) {
      case 1: return projectType !== '';
      case 2: return constructionCost !== '' && area !== '' && parseFloat(constructionCost) > 0 && parseFloat(area) > 0;
      case 3: return clientType !== '';
      case 4: return complexity !== '';
      case 5: return clientInvolvement !== '';
      default: return true;
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const exportToPDF = async () => {
    if (!contentRef.current) return;

    try {
      const clonedContent = contentRef.current.cloneNode(true) as HTMLElement;
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '210mm';
      tempContainer.style.padding = '20mm';
      tempContainer.style.backgroundColor = 'white';
      document.body.appendChild(tempContainer);

      const logoDiv = document.createElement('div');
      logoDiv.style.textAlign = 'center';
      logoDiv.style.marginBottom = '20px';
      const logo = document.createElement('img');
      logo.src = '/estimator/lovable-uploads/1938f286-8b49-49bf-bc47-3ac7ef7d6cab.png';
      logo.style.height = '80px';
      logo.style.margin = '0 auto';
      logoDiv.appendChild(logo);

      tempContainer.appendChild(logoDiv);
      tempContainer.appendChild(clonedContent);

      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save('architect-fee-estimate.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <AnimatedText
                text="What type of project are you planning?"
                className="text-2xl font-display mb-2 text-vs-dark"
              />
              <p className="text-sm text-muted-foreground">Select your project category</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projectTypes.map((type, index) => {
                const Icon = type.icon;
                return (
                  <motion.div
                    key={type.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    onClick={() => setProjectType(type.id)}
                    className={cn(
                      "group flex flex-col border rounded-xl p-6 cursor-pointer transition-all duration-300",
                      projectType === type.id
                        ? "border-vs bg-vs/5"
                        : "border-gray-200 hover:border-vs/50"
                    )}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        projectType === type.id ? "bg-vs text-white" : "bg-vs/10 text-vs"
                      )}>
                        <Icon className="size-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-vs-dark mb-1">{type.name}</h4>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                      {projectType === type.id && (
                        <Check className="size-5 text-vs flex-shrink-0" />
                      )}
                    </div>
                    <div className="mt-auto pt-3 border-t border-gray-100 text-xs text-muted-foreground space-y-1">
                      <div>Base: {type.baseRate}</div>
                      <div>Minimum: {type.minFee}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2 text-vs-dark">Project Details</h3>
              <p className="text-sm text-muted-foreground">Enter your project specifications</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3 text-vs-dark">
                  Construction Cost ({currencySymbol})
                </label>
                <input
                  type="number"
                  value={constructionCost}
                  onChange={(e) => setConstructionCost(e.target.value)}
                  placeholder="e.g., 5000000"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-vs focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 text-vs-dark">
                  Built-up Area (sq.ft)
                </label>
                <input
                  type="number"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g., 2000"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-vs focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 text-vs-dark">Currency</label>
                <div className="grid grid-cols-3 gap-3">
                  {['INR', 'USD', 'EUR'].map(curr => (
                    <button
                      key={curr}
                      onClick={() => setCurrency(curr)}
                      className={cn(
                        "px-4 py-3 rounded-lg border-2 transition-all font-medium",
                        currency === curr
                          ? "border-vs bg-vs/5 text-vs"
                          : "border-gray-200 hover:border-vs/50"
                      )}
                    >
                      {curr} ({curr === 'INR' ? '₹' : curr === 'USD' ? '$' : '€'})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2 text-vs-dark">Client Type</h3>
              <p className="text-sm text-muted-foreground">Select your client category</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clientTypes.map(type => (
                <div
                  key={type.id}
                  onClick={() => setClientType(type.id)}
                  className={cn(
                    "border-2 rounded-lg p-4 cursor-pointer transition-all",
                    clientType === type.id
                      ? "border-vs bg-vs/5"
                      : "border-gray-200 hover:border-vs/50"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-vs-dark">{type.name}</h4>
                    <Badge variant="outline" className={cn(
                      "text-xs",
                      clientType === type.id ? "border-vs text-vs" : "border-gray-300"
                    )}>
                      {type.discount}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{type.description}</p>
                  <p className="text-xs text-muted-foreground">Multiplier: {type.multiplier}</p>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2 text-vs-dark">Design Complexity</h3>
              <p className="text-sm text-muted-foreground">Choose the complexity level of your project</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {complexityLevels.map(level => (
                <TooltipProvider key={level.id} delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setComplexity(level.id)}
                        className={cn(
                          "relative p-4 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md",
                          complexity === level.id
                            ? "border-vs bg-vs/5 shadow-sm"
                            : "border-gray-200 hover:border-vs/50"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{level.name}</span>
                          <Info className="size-4 text-muted-foreground" />
                        </div>
                        <div className="text-xs text-vs">{level.multiplier}</div>
                        {complexity === level.id && (
                          <div className="absolute top-2 right-2 size-2 rounded-full bg-vs" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-sm">{level.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="size-5 text-vs" />
                <h3 className="text-lg font-medium text-vs-dark">Client Involvement Level</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Select your expected involvement throughout the project
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {involvementLevels.map(level => (
                <TooltipProvider key={level.id} delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setClientInvolvement(level.id)}
                        className={cn(
                          "relative p-4 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md",
                          clientInvolvement === level.id
                            ? "border-vs bg-vs/5 shadow-sm"
                            : "border-gray-200 hover:border-vs/50"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{level.name}</span>
                          <Info className="size-4 text-muted-foreground" />
                        </div>
                        <div className="text-xs text-vs">{level.premium}</div>
                        {clientInvolvement === level.id && (
                          <div className="absolute top-2 right-2 size-2 rounded-full bg-vs" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-sm">{level.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </motion.div>
        );

      case 6:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2 text-vs-dark">Additional Services</h3>
              <p className="text-sm text-muted-foreground">Optional add-ons to enhance your project</p>
            </div>

            <div className="space-y-6">
              {/* Visualization Package */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-vs-dark">Visualization Package</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {vizPackages.map(pkg => (
                    <TooltipProvider key={pkg.id} delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setVizPackage(pkg.id)}
                            className={cn(
                              "relative p-4 rounded-lg border-2 transition-all text-left",
                              vizPackage === pkg.id
                                ? "border-vs bg-vs/5"
                                : "border-gray-200 hover:border-vs/50"
                            )}
                          >
                            <div className="font-medium text-sm mb-1">{pkg.name}</div>
                            <div className="text-xs text-vs">
                              {pkg.price === 0 ? 'Included' : `+${currencySymbol}${pkg.price.toLocaleString()}`}
                            </div>
                            {vizPackage === pkg.id && (
                              <div className="absolute top-2 right-2 size-2 rounded-full bg-vs" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-sm">{pkg.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>

              {/* Other Services */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-vs-dark">Other Services</label>
                <div className="space-y-3">
                  <div
                    onClick={() => setIncludeFFE(!includeFFE)}
                    className={cn(
                      "p-4 rounded-lg border-2 cursor-pointer transition-all",
                      includeFFE ? "border-vs bg-vs/5" : "border-gray-200 hover:border-vs/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "size-5 rounded border-2 flex items-center justify-center",
                        includeFFE ? "bg-vs border-vs" : "border-gray-300"
                      )}>
                        {includeFFE && <Check className="size-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">FF&E Procurement</p>
                        <p className="text-xs text-muted-foreground">Furniture, Fixtures & Equipment planning</p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setIncludeLandscape(!includeLandscape)}
                    className={cn(
                      "p-4 rounded-lg border-2 cursor-pointer transition-all",
                      includeLandscape ? "border-vs bg-vs/5" : "border-gray-200 hover:border-vs/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "size-5 rounded border-2 flex items-center justify-center",
                        includeLandscape ? "bg-vs border-vs" : "border-gray-300"
                      )}>
                        {includeLandscape && <Check className="size-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Landscape Design</p>
                        <p className="text-xs text-muted-foreground">Garden and outdoor space planning</p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setIsRush(!isRush)}
                    className={cn(
                      "p-4 rounded-lg border-2 cursor-pointer transition-all",
                      isRush ? "border-vs bg-vs/5" : "border-gray-200 hover:border-vs/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "size-5 rounded border-2 flex items-center justify-center",
                        isRush ? "bg-vs border-vs" : "border-gray-300"
                      )}>
                        {isRush && <Check className="size-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm flex items-center gap-2">
                          Rush Project
                          <Zap className="size-4 text-vs" />
                        </p>
                        <p className="text-xs text-muted-foreground">Expedited delivery with +25% premium</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card border border-primary/5 rounded-2xl p-4 md:p-5 lg:p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-display mb-2 text-vs-dark">
              Professional Fee Calculator
            </h1>
            <p className="text-muted-foreground text-sm">
              Calculate architect fees based on COA standards
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Step {currentStep} of {totalSteps}</span>
              <span className="text-sm text-vs font-medium">{Math.round(progress)}% Complete</span>
            </div>
            <div className="h-2 bg-vs/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-vs rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5, 6].map(step => (
              <div
                key={step}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  step === currentStep ? "w-8 bg-vs" :
                  step < currentStep ? "w-6 bg-vs/60" : "w-6 bg-vs/20"
                )}
              />
            ))}
          </div>

          {/* Step Content */}
          <div className="mb-8">
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-between items-center pt-6 border-t">
            {currentStep > 1 ? (
              <Button
                onClick={prevStep}
                variant="outline"
                className="border-vs text-vs hover:bg-vs/5 rounded-full w-full sm:w-auto"
              >
                <ChevronLeft className="size-4 mr-2" />
                Previous
              </Button>
            ) : <div />}

            {currentStep < 6 ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="bg-vs hover:bg-vs-light text-white rounded-full w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="size-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentStep(7)}
                disabled={!canProceed()}
                className="bg-vs hover:bg-vs-light text-white rounded-full w-full sm:w-auto"
              >
                View Quote
                <ChevronRight className="size-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Live Cost Display */}
          {architectFee.totalFee > 0 && currentStep < 7 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-vs/5 border border-vs/20 rounded-lg text-center"
            >
              <p className="text-sm text-muted-foreground mb-1">Current Estimate</p>
              <p className="text-2xl font-bold text-vs">
                {currencySymbol}{architectFee.totalFee.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Including GST @ 18%</p>
            </motion.div>
          )}

          {/* Results Step */}
          {currentStep === 7 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center py-6 border-b">
                <h2 className="text-2xl font-display text-vs-dark mb-2">Your Professional Fee Quote</h2>
                <p className="text-3xl md:text-5xl font-light text-vs mb-2">
                  {currencySymbol}{architectFee.totalFee.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Including GST @ 18%</p>
              </div>

              {/* Hidden content for PDF */}
              <div className="hidden">
                <div ref={contentRef}>
                  <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Professional Fee Estimate</h1>
                    <p className="text-gray-600">COA Compliant Architecture Services</p>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="font-medium">Project Type:</span> {projectType}</div>
                      <div><span className="font-medium">Client Type:</span> {clientType}</div>
                      <div><span className="font-medium">Construction Cost:</span> {currencySymbol}{parseFloat(constructionCost).toLocaleString()}</div>
                      <div><span className="font-medium">Area:</span> {area} sq.ft</div>
                      <div><span className="font-medium">Complexity:</span> {complexity}</div>
                      <div><span className="font-medium">Involvement:</span> {clientInvolvement}</div>
                    </div>
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">Fee Breakdown</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Base Design Fee</span>
                          <span>{currencySymbol}{architectFee.baseFee.toLocaleString()}</span>
                        </div>
                        {architectFee.cifAdjustment > 0 && (
                          <div className="flex justify-between">
                            <span>Client Involvement Adjustment</span>
                            <span>+{currencySymbol}{architectFee.cifAdjustment.toLocaleString()}</span>
                          </div>
                        )}
                        {architectFee.ffeFee > 0 && (
                          <div className="flex justify-between">
                            <span>FF&E Procurement</span>
                            <span>{currencySymbol}{architectFee.ffeFee.toLocaleString()}</span>
                          </div>
                        )}
                        {architectFee.landscapeFee > 0 && (
                          <div className="flex justify-between">
                            <span>Landscape Design</span>
                            <span>{currencySymbol}{architectFee.landscapeFee.toLocaleString()}</span>
                          </div>
                        )}
                        {architectFee.vizFee > 0 && (
                          <div className="flex justify-between">
                            <span>Visualization Package</span>
                            <span>{currencySymbol}{architectFee.vizFee.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Overhead Allocation</span>
                          <span>{currencySymbol}{architectFee.overheadAllocation.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Profit Margin (15%)</span>
                          <span>{currencySymbol}{architectFee.profit.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>GST (18%)</span>
                          <span>{currencySymbol}{architectFee.tax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t">
                          <span>Total Professional Fee</span>
                          <span className="text-vs">{currencySymbol}{architectFee.totalFee.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Base Design Fee</span>
                  <span className="font-semibold">{currencySymbol}{architectFee.baseFee.toLocaleString()}</span>
                </div>
                {architectFee.cifAdjustment > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Client Involvement ({clientInvolvement})</span>
                    <span className="font-semibold text-vs">+{currencySymbol}{architectFee.cifAdjustment.toLocaleString()}</span>
                  </div>
                )}
                {architectFee.ffeFee > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">FF&E Procurement</span>
                    <span className="font-semibold">{currencySymbol}{architectFee.ffeFee.toLocaleString()}</span>
                  </div>
                )}
                {architectFee.landscapeFee > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Landscape Design</span>
                    <span className="font-semibold">{currencySymbol}{architectFee.landscapeFee.toLocaleString()}</span>
                  </div>
                )}
                {architectFee.vizFee > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Visualization Package</span>
                    <span className="font-semibold">{currencySymbol}{architectFee.vizFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Overhead Allocation</span>
                  <span className="font-semibold">{currencySymbol}{architectFee.overheadAllocation.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Profit Margin (15%)</span>
                  <span className="font-semibold">{currencySymbol}{architectFee.profit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">GST (18%)</span>
                  <span className="font-semibold">{currencySymbol}{architectFee.tax.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Schedule */}
              <div className="bg-vs/5 rounded-lg p-4 border border-vs/10">
                <p className="text-xs font-semibold uppercase tracking-wide text-vs mb-3">
                  Payment Schedule (50-30-20)
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Upfront (50%)</span>
                    <span className="font-semibold">{currencySymbol}{Math.round(architectFee.totalFee * 0.5).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Submission (30%)</span>
                    <span className="font-semibold">{currencySymbol}{Math.round(architectFee.totalFee * 0.3).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery (20%)</span>
                    <span className="font-semibold">{currencySymbol}{Math.round(architectFee.totalFee * 0.2).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                <Button
                  onClick={exportToPDF}
                  variant="outline"
                  className="border-vs text-vs hover:bg-vs/5 rounded-full"
                >
                  <Download className="size-4 mr-2" />
                  Export to PDF
                </Button>
                <Button
                  variant="outline"
                  className="border-vs text-vs hover:bg-vs/5 rounded-full"
                >
                  <Mail className="size-4 mr-2" />
                  Send via Email
                </Button>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setCurrentStep(6)}
                  variant="outline"
                  className="flex-1 border-vs text-vs hover:bg-vs/5 rounded-full"
                >
                  Edit Selections
                </Button>
                <Button
                  onClick={() => {
                    setCurrentStep(1);
                    setProjectType('');
                    setConstructionCost('');
                    setArea('');
                    setClientType('');
                    setComplexity('');
                    setClientInvolvement('');
                    setVizPackage('None');
                    setIncludeFFE(false);
                    setIncludeLandscape(false);
                    setIsRush(false);
                  }}
                  variant="outline"
                  className="flex-1 border-gray-300 rounded-full"
                >
                  Start Over
                </Button>
              </div>

              {/* COA Compliance */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-3">
                  <AlertCircle className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">COA Compliant</p>
                    <p>Pricing follows Council of Architecture guidelines and industry standards.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
