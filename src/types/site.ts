export interface NavItem {
  label: string;
  href: string;
}

export interface StatItem {
  value: string;
  suffix?: string;
  label: string;
  description: string;
}

export interface DesignPhilosophyItem {
  number: string;
  title: string;
  body: string;
  image: string;
}

export interface ProjectCard {
  id: string;
  client: string;
  title: string;
  category: string;
  image: string;
  href: string;
}

export interface ServiceItem {
  number: string;
  title: string;
  tag: string;
  bullets: string[];
}

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

export interface TeamMember {
  name: string;
  title: string;
  quote: string;
  image: string;
}

export interface FAQItem {
  question: string;
  answer?: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  location: string;
  instagram: string;
  pinterest: string;
  linkedin: string;
}
