import { jsPDF } from 'jspdf';
import { ProjectEstimate, ComponentOption } from '@/types/estimator';

export const generateEstimatePDF = (estimate: ProjectEstimate) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = 20;

  // Helper functions
  const formatCurrency = (amount: number) => {
    // Use Rs. instead of ₹ for better PDF compatibility (jsPDF Helvetica doesn't support Rupee symbol)
    const formatted = Math.round(amount).toLocaleString('en-IN', {
      useGrouping: true,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return `Rs. ${formatted}`;
  };

  const toSentenceCase = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

  const addText = (text: string, x: number, y: number, fontSize: number = 12, style: 'normal' | 'bold' = 'normal', align?: 'left' | 'center' | 'right') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', style);
    if (align) {
      doc.text(text, x, y, { align });
    } else {
      doc.text(text, x, y);
    }
  };

  const addLine = (y: number) => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
  };

  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };

  // Header with branding
  doc.setFillColor(79, 9, 12); // vs color
  doc.rect(0, 0, pageWidth, 50, 'F');
  doc.setTextColor(255, 255, 255);

  // Company Logo/Name
  addText('Vanilla Somethin', pageWidth / 2, 15, 18, 'bold', 'center');
  addText('CONSTRUCTION COST ESTIMATE', pageWidth / 2, 26, 20, 'bold', 'center');
  addText('Professional Architecture and Design', pageWidth / 2, 34, 10, 'normal', 'center');
  addText('www.vanillasometh.in | hello@vanillasometh.in | +91 741 134 9844', pageWidth / 2, 42, 9, 'normal', 'center');
  yPos = 60;

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Project Details Section
  addText('PROJECT DETAILS', margin, yPos, 16, 'bold');
  yPos += 10;
  addLine(yPos);
  yPos += 8;

  // Format work types for display
  const workTypesDisplay = estimate.workTypes && estimate.workTypes.length > 0
    ? estimate.workTypes.map(wt => toSentenceCase(wt)).join(", ")
    : '';

  const details = [
    [`Location:`, `${estimate.city}, ${estimate.state}`],
    [`Project Type:`, `${toSentenceCase(estimate.projectType)} ${workTypesDisplay ? `(${workTypesDisplay})` : ''}`],
    [`Total Area:`, `${estimate.area.toLocaleString('en-IN')} ${estimate.areaUnit}`],
    [`Date:`, new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })]
  ];

  details.forEach(([label, value]) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(label, margin + 5, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 60, yPos);
    yPos += 7;
  });

  yPos += 8;
  checkPageBreak(70);

  // Total Cost Section - Highlighted
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 40, 3, 3, 'F');
  doc.setFillColor(79, 9, 12);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 10, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  addText('ESTIMATED PROJECT COST (Incl. GST)', pageWidth / 2, yPos + 7, 12, 'bold', 'center');
  doc.setTextColor(0, 0, 0);

  yPos += 18;
  doc.setTextColor(79, 9, 12);
  addText(formatCurrency(estimate.totalCost), pageWidth / 2, yPos + 4, 24, 'bold', 'center');
  yPos += 11;
  doc.setTextColor(100, 100, 100);
  addText(`Rate: ${formatCurrency(Math.round(estimate.totalCost / estimate.area))} per ${estimate.areaUnit}`, pageWidth / 2, yPos, 11, 'normal', 'center');
  doc.setTextColor(0, 0, 0);
  yPos += 18;

  // Architect Fee Section
  checkPageBreak(30);
  const getArchitectFeePercentage = (projectCost: number): number => {
    if (projectCost <= 5000000) return 12;
    if (projectCost <= 10000000) return 10;
    if (projectCost <= 50000000) return 9;
    return 8;
  };

  const architectFeePercent = getArchitectFeePercentage(estimate.totalCost);
  const architectFee = estimate.totalCost * (architectFeePercent / 100);
  const totalWithArchitectFee = estimate.totalCost + architectFee;

  doc.setFillColor(240, 245, 250);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 28, 3, 3, 'F');
  yPos += 9;
  addText(`Architect Fee (${architectFeePercent}% as per COA standards):`, margin + 5, yPos, 11, 'normal');
  addText(formatCurrency(Math.round(architectFee)), pageWidth - margin - 5, yPos, 11, 'bold', 'right');
  yPos += 9;
  doc.setDrawColor(150, 150, 150);
  doc.line(margin + 5, yPos, pageWidth - margin - 5, yPos);
  yPos += 7;
  doc.setTextColor(0, 0, 0);
  addText('Total with Architect Fee:', margin + 5, yPos, 12, 'bold');
  addText(formatCurrency(Math.round(totalWithArchitectFee)), pageWidth - margin - 5, yPos, 13, 'bold', 'right');
  doc.setTextColor(0, 0, 0);
  yPos += 16;

  // Cost Distribution
  checkPageBreak(60);
  addText('COST DISTRIBUTION', margin, yPos, 14, 'bold');
  yPos += 10;
  addLine(yPos);
  yPos += 8;

  const breakdown = [
    { label: 'Base Construction', value: estimate.categoryBreakdown.construction, color: [255, 200, 200] },
    { label: 'Core Components (MEP)', value: estimate.categoryBreakdown.core, color: [200, 220, 255] },
    { label: 'Finishes & Surfaces', value: estimate.categoryBreakdown.finishes, color: [200, 255, 220] },
    { label: 'Interiors & Furnishings', value: estimate.categoryBreakdown.interiors, color: [255, 240, 200] },
  ];

  breakdown.forEach(item => {
    if (item.value > 0) {
      doc.setFillColor(...item.color);
      doc.roundedRect(margin + 5, yPos - 4, 4, 4, 1, 1, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(item.label, margin + 12, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(item.value), pageWidth - margin - 5, yPos, { align: 'right' });
      yPos += 7;
    }
  });

  yPos += 8;

  // Timeline
  checkPageBreak(50);
  addText('PROJECT TIMELINE', margin, yPos, 14, 'bold');
  yPos += 10;
  addLine(yPos);
  yPos += 8;

  addText(`Total Duration: ${estimate.timeline.totalMonths} months`, margin + 5, yPos, 11, 'bold');
  yPos += 8;
  const phases = [
    { label: 'Planning & Design', months: estimate.timeline.phases.planning },
    { label: 'Construction', months: estimate.timeline.phases.construction },
    { label: 'Interiors & Finishing', months: estimate.timeline.phases.interiors },
  ];

  phases.forEach(phase => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`• ${phase.label}:`, margin + 10, yPos);
    doc.text(`${phase.months} ${phase.months === 1 ? 'month' : 'months'}`, pageWidth - margin - 5, yPos, { align: 'right' });
    yPos += 6;
  });

  yPos += 12;

  // Component pricing per sqm
  const COMPONENT_PRICING_PER_SQM: Record<string, Record<ComponentOption, number>> = {
    civilQuality: { none: 0, standard: 650, premium: 1100, luxury: 2000 },
    plumbing: { none: 0, standard: 450, premium: 850, luxury: 1600 },
    electrical: { none: 0, standard: 400, premium: 750, luxury: 1500 },
    ac: { none: 0, standard: 900, premium: 1600, luxury: 3000 },
    elevator: { none: 0, standard: 450, premium: 850, luxury: 1800 },
    buildingEnvelope: { none: 0, standard: 350, premium: 700, luxury: 1400 },
    lighting: { none: 0, standard: 300, premium: 650, luxury: 1400 },
    windows: { none: 0, standard: 400, premium: 800, luxury: 1700 },
    ceiling: { none: 0, standard: 280, premium: 550, luxury: 1200 },
    surfaces: { none: 0, standard: 450, premium: 900, luxury: 2000 },
    fixedFurniture: { none: 0, standard: 850, premium: 1500, luxury: 2800 },
    looseFurniture: { none: 0, standard: 550, premium: 1100, luxury: 2500 },
    furnishings: { none: 0, standard: 200, premium: 450, luxury: 1000 },
    appliances: { none: 0, standard: 350, premium: 750, luxury: 1800 },
    artefacts: { none: 0, standard: 150, premium: 400, luxury: 1000 },
  };

  // Helper to format component level
  const formatLevel = (level: ComponentOption) => {
    if (level === 'standard') return 'Standard';
    if (level === 'premium') return 'Premium';
    if (level === 'luxury') return 'Luxury';
    return level;
  };

  // Helper to check if component is included
  const isIncluded = (value: string | undefined): boolean => {
    return !!(value && value !== 'none' && value !== '');
  };

  // Selected Components with detailed pricing
  checkPageBreak(30);
  addText('SELECTED COMPONENTS & PRICING', margin, yPos, 14, 'bold');
  yPos += 10;
  addLine(yPos);
  yPos += 8;

  const componentDetails = [
    { name: 'Quality of Construction', level: estimate.civilQuality, key: 'civilQuality' },
    { name: 'Plumbing & Sanitary', level: estimate.plumbing, key: 'plumbing' },
    { name: 'Electrical Systems', level: estimate.electrical, key: 'electrical' },
    { name: 'AC & HVAC', level: estimate.ac, key: 'ac' },
    { name: 'Elevator/Lift', level: estimate.elevator, key: 'elevator' },
    { name: 'Building Envelope', level: estimate.buildingEnvelope, key: 'buildingEnvelope' },
    { name: 'Lighting Systems', level: estimate.lighting, key: 'lighting' },
    { name: 'Windows, Doors & Glazing', level: estimate.windows, key: 'windows' },
    { name: 'Ceiling Design', level: estimate.ceiling, key: 'ceiling' },
    { name: 'Wall & Floor Finishes', level: estimate.surfaces, key: 'surfaces' },
    { name: 'Fixed Furniture', level: estimate.fixedFurniture, key: 'fixedFurniture' },
    { name: 'Loose Furniture', level: estimate.looseFurniture, key: 'looseFurniture' },
    { name: 'Furnishings', level: estimate.furnishings, key: 'furnishings' },
    { name: 'Appliances', level: estimate.appliances, key: 'appliances' },
    { name: 'Artefacts', level: estimate.artefacts, key: 'artefacts' },
  ].filter(item => isIncluded(item.level));

  componentDetails.forEach((item, index) => {
    checkPageBreak(12);

    const areaInSqM = estimate.areaUnit === "sqft" ? estimate.area * 0.092903 : estimate.area;
    const perSqm = COMPONENT_PRICING_PER_SQM[item.key]?.[item.level] || 0;
    const perUnit = estimate.areaUnit === "sqft" ? Math.round(perSqm / 10.764) : perSqm;
    const totalCost = Math.round(perSqm * areaInSqM);

    // Alternating background with better spacing
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 10, 'F');
    }

    // Component name - consistent font size
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const nameText = item.name.length > 25 ? item.name.substring(0, 25) + '...' : item.name;
    doc.text(nameText, margin + 3, yPos);

    // Quality level - consistent size and position
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 9, 12);
    doc.text(formatLevel(item.level), margin + 68, yPos);

    // Per unit price - consistent size
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 100, 0);
    const priceText = `₹${perUnit.toLocaleString('en-IN')}/${estimate.areaUnit}`;
    doc.text(priceText, margin + 105, yPos);

    // Total cost - consistent size, right aligned
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const totalText = formatCurrency(totalCost);
    doc.text(totalText, pageWidth - margin - 3, yPos, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    yPos += 8;
  });

  // Disclaimer
  yPos += 12;
  checkPageBreak(40);

  doc.setFillColor(255, 248, 230);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 38, 3, 3, 'F');
  yPos += 9;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 100, 0);
  doc.text('IMPORTANT NOTES:', margin + 5, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  yPos += 6;
  doc.setFontSize(9);
  const disclaimerText = `• All costs shown are inclusive of GST @ 18%\n• Actual costs may vary ±10% based on site conditions, material price fluctuations, and contractor rates\n• Architect's fee shown separately as per COA standards\n• This is an indicative estimate based on current market rates for ${estimate.city}\n• Valid for 30 days from generation date. For detailed itemized quote, please contact our team.`;
  const splitDisclaimer = doc.splitTextToSize(disclaimerText, pageWidth - 2 * margin - 10);
  doc.text(splitDisclaimer, margin + 5, yPos);

  // Footer on every page
  const addFooter = (pageNum: number) => {
    doc.setFillColor(79, 9, 12);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Generated by Vanilla and Somethin\' Estimator', pageWidth / 2, pageHeight - 8, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Contact: +91 741 134 9844 | hello@vanillasometh.in | www.vanillasometh.in`, pageWidth / 2, pageHeight - 4, { align: 'center' });
    doc.setFontSize(7);
    doc.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  };

  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i);
  }

  // Save the PDF
  const workTypesText = estimate.workTypes && estimate.workTypes.length > 0
    ? `_${estimate.workTypes.join('_')}`
    : '';
  const fileName = `Construction_Estimate_${estimate.city}${workTypesText}_${estimate.area}${estimate.areaUnit}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
