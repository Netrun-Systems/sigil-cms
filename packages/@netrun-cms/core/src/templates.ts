/**
 * Vertical Template Registry
 *
 * Defines metadata for all available quick-start templates.
 * Used by the CLI, admin UI, and seed API to show available templates
 * and wire up the correct theme preset, plugins, and seed function.
 */

export interface VerticalTemplate {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'creative' | 'commerce' | 'community' | 'saas';
  presetId: string;
  plugins: string[];
  pages: string[];
  icon: string;
  estimatedSetupTime: string;
}

export const verticalTemplates: VerticalTemplate[] = [
  {
    id: 'artist',
    name: 'Artist / Band',
    description: 'Music-focused site with release pages, show listings, embedded players, and a link-in-bio page.',
    category: 'creative',
    presetId: 'frost',
    plugins: ['seo', 'photos', 'mailing-list'],
    pages: ['Home', 'Music', 'Shows', 'Videos', 'Live', 'About', 'Links', 'Contact'],
    icon: '🎵',
    estimatedSetupTime: '5 minutes',
  },
  {
    id: 'small_business',
    name: 'Small Business',
    description: 'Professional business site with services, testimonials, team bios, and a booking-ready contact page.',
    category: 'business',
    presetId: 'consultant',
    plugins: ['seo', 'contact', 'blog', 'mailing-list', 'photos', 'booking'],
    pages: ['Home', 'About', 'Services', 'Blog', 'Contact'],
    icon: '🏢',
    estimatedSetupTime: '5 minutes',
  },
  {
    id: 'ecommerce',
    name: 'E-commerce / Retail',
    description: 'Online storefront with product showcases, brand storytelling, and customer support.',
    category: 'commerce',
    presetId: 'storefront',
    plugins: ['store', 'paypal', 'seo', 'photos', 'mailing-list'],
    pages: ['Home', 'Shop', 'Our Story', 'Blog', 'Contact'],
    icon: '🛍️',
    estimatedSetupTime: '5 minutes',
  },
  {
    id: 'restaurant',
    name: 'Restaurant / Cafe',
    description: 'Hospitality site with menu display, reservation form, event listings, and photo gallery.',
    category: 'business',
    presetId: 'restaurant',
    plugins: ['booking', 'contact', 'seo', 'photos', 'mailing-list'],
    pages: ['Home', 'Menu', 'Events', 'Gallery', 'Reservations', 'Contact'],
    icon: '🍽️',
    estimatedSetupTime: '5 minutes',
  },
  {
    id: 'agency',
    name: 'Agency / Portfolio',
    description: 'Creative agency site with case studies, team profiles, service tiers, and client testimonials.',
    category: 'creative',
    presetId: 'netrun-dark',
    plugins: ['seo', 'photos', 'blog', 'contact', 'mailing-list'],
    pages: ['Home', 'Work', 'Services', 'Team', 'Blog', 'Contact'],
    icon: '💼',
    estimatedSetupTime: '5 minutes',
  },
  {
    id: 'saas',
    name: 'SaaS / Product',
    description: 'Modern product landing page with feature grid, pricing table, docs placeholder, and changelog.',
    category: 'saas',
    presetId: 'saas',
    plugins: ['docs', 'blog', 'seo', 'store', 'community', 'support'],
    pages: ['Home', 'Documentation', 'Blog', 'Changelog', 'Contact'],
    icon: '🚀',
    estimatedSetupTime: '5 minutes',
  },
  {
    id: 'consultant',
    name: 'Consultant / Freelancer',
    description: 'Personal brand site with credential timeline, service packages, testimonials, and booking form.',
    category: 'business',
    presetId: 'consultant',
    plugins: ['booking', 'contact', 'blog', 'seo', 'mailing-list'],
    pages: ['Home', 'About', 'Services', 'Book a Call', 'Blog'],
    icon: '🧑‍💼',
    estimatedSetupTime: '5 minutes',
  },
  {
    id: 'community',
    name: 'Community / Forum',
    description: 'Community hub with forum placeholder, event calendar, member directory, and blog.',
    category: 'community',
    presetId: 'community',
    plugins: ['community', 'mailing-list', 'seo', 'blog'],
    pages: ['Home', 'Forum', 'Events', 'Members', 'Blog'],
    icon: '🌐',
    estimatedSetupTime: '5 minutes',
  },
  {
    id: 'publisher',
    name: 'Publisher / Magazine',
    description: 'Digital publication with issue archive, subscription tiers, newsletter signup, and about page.',
    category: 'creative',
    presetId: 'minimal',
    plugins: ['@meridian/publishing', 'blog', 'seo', 'mailing-list', 'store'],
    pages: ['Home', 'Publications', 'Latest Issue', 'Subscribe', 'About'],
    icon: '📰',
    estimatedSetupTime: '5 minutes',
  },
  {
    id: 'cooperative',
    name: 'Cooperative / Collective',
    description: 'Artist cooperative site with member gallery, event calendar, consignment shop, and cooperative history.',
    category: 'community',
    presetId: 'community',
    plugins: ['@poppies/consignment', '@poppies/shifts', '@poppies/messaging', 'seo', 'photos'],
    pages: ['Home', 'Artists', 'Calendar', 'About', 'Contact'],
    icon: '🤝',
    estimatedSetupTime: '5 minutes',
  },
];

/**
 * Get a vertical template by ID
 */
export function getTemplateById(id: string): VerticalTemplate | undefined {
  return verticalTemplates.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: VerticalTemplate['category']): VerticalTemplate[] {
  return verticalTemplates.filter(t => t.category === category);
}
