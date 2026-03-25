/**
 * Vertical Template Seeds
 *
 * Creates standard pages with pre-configured blocks for each vertical.
 * Each function takes (db, siteId) and creates pages with realistic placeholder content.
 */

import type { DbClient } from '../client.js';
import { pages, contentBlocks } from '../schema.js';

interface PageDef {
  title: string;
  slug: string;
  sortOrder: number;
  blocks: Array<{
    blockType: string;
    content: Record<string, unknown>;
    settings?: Record<string, unknown>;
    sortOrder: number;
  }>;
}

async function seedPages(db: DbClient, siteId: string, pageDefs: PageDef[], template: string): Promise<string[]> {
  const pageIds: string[] = [];

  for (const pageDef of pageDefs) {
    const [page] = await db
      .insert(pages)
      .values({
        siteId,
        title: pageDef.title,
        slug: pageDef.slug,
        fullPath: `/${pageDef.slug}`,
        status: 'published',
        template,
        sortOrder: pageDef.sortOrder,
      })
      .returning();

    pageIds.push(page.id);

    if (pageDef.blocks.length > 0) {
      await db.insert(contentBlocks).values(
        pageDef.blocks.map((block) => ({
          pageId: page.id,
          blockType: block.blockType,
          content: block.content,
          settings: block.settings || {},
          sortOrder: block.sortOrder,
          isVisible: true,
        }))
      );
    }
  }

  return pageIds;
}

// ============================================================================
// Small Business Template
// ============================================================================

const smallBusinessPages: PageDef[] = [
  {
    title: 'Home',
    slug: 'home',
    sortOrder: 0,
    blocks: [
      {
        blockType: 'hero',
        content: {
          headline: 'Your Trusted Local Partner',
          subheadline: 'We bring decades of experience to every project, delivering reliable solutions that help your business grow.',
          alignment: 'center',
          ctaText: 'Our Services',
          ctaLink: '/services',
          ctaSecondaryText: 'Contact Us',
          ctaSecondaryLink: '/contact',
        },
        settings: { padding: 'xl', width: 'full' },
        sortOrder: 0,
      },
      {
        blockType: 'feature_grid',
        content: {
          headline: 'What We Do',
          columns: 3,
          features: [
            { icon: '🎯', title: 'Strategic Consulting', description: 'Data-driven strategies tailored to your unique market position and growth objectives.' },
            { icon: '🔧', title: 'Implementation', description: 'Hands-on execution from planning through delivery, keeping your project on time and on budget.' },
            { icon: '📈', title: 'Growth Support', description: 'Ongoing partnership to measure results, optimize performance, and scale what works.' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 1,
      },
      {
        blockType: 'testimonial',
        content: {
          layout: 'grid',
          testimonials: [
            { quote: 'They transformed how we operate. Our efficiency improved by 40% in the first quarter.', author: 'Sarah Mitchell', role: 'Operations Director', company: 'Greenfield Manufacturing' },
            { quote: 'Professional, responsive, and genuinely invested in our success. A true partner.', author: 'James Park', role: 'CEO', company: 'Park & Associates' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 2,
      },
      {
        blockType: 'cta',
        content: {
          headline: 'Ready to Get Started?',
          description: 'Schedule a free consultation to discuss how we can help your business reach its goals.',
          buttonText: 'Book a Consultation',
          buttonLink: '/contact',
          buttonVariant: 'primary',
          backgroundStyle: 'gradient',
        },
        settings: { padding: 'lg', width: 'full' },
        sortOrder: 3,
      },
    ],
  },
  {
    title: 'About',
    slug: 'about',
    sortOrder: 1,
    blocks: [
      {
        blockType: 'text',
        content: {
          body: '# About Us\n\nFounded with a commitment to quality and integrity, we have built our reputation on delivering measurable results for businesses of all sizes. Our team combines deep industry knowledge with a hands-on approach that sets us apart.',
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
      {
        blockType: 'timeline',
        content: {
          headline: 'Our Journey',
          items: [
            { date: '2015', title: 'Founded', description: 'Started with a vision to make professional consulting accessible to small businesses.' },
            { date: '2018', title: 'Expanded Services', description: 'Added implementation and managed services to our consulting practice.' },
            { date: '2021', title: '100+ Clients', description: 'Reached a milestone of serving over 100 businesses across multiple industries.' },
            { date: '2024', title: 'Regional Recognition', description: 'Named a top small business partner by the Regional Business Alliance.' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 1,
      },
      {
        blockType: 'stats_bar',
        content: {
          layout: 'horizontal',
          stats: [
            { value: '100+', label: 'Clients Served' },
            { value: '98%', label: 'Client Retention' },
            { value: '9+', label: 'Years in Business' },
            { value: '4.9★', label: 'Average Rating' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 2,
      },
    ],
  },
  {
    title: 'Services',
    slug: 'services',
    sortOrder: 2,
    blocks: [
      {
        blockType: 'feature_grid',
        content: {
          headline: 'Our Services',
          columns: 2,
          features: [
            { icon: '💡', title: 'Business Strategy', description: 'Market analysis, competitive positioning, and growth roadmaps tailored to your goals.' },
            { icon: '⚙️', title: 'Operations Optimization', description: 'Streamline workflows, reduce waste, and improve throughput across your organization.' },
            { icon: '📊', title: 'Financial Planning', description: 'Budgeting, forecasting, and financial modeling to support confident decision-making.' },
            { icon: '👥', title: 'Team Development', description: 'Leadership coaching, team building, and organizational design for sustainable growth.' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
      {
        blockType: 'pricing_table',
        content: {
          headline: 'Engagement Models',
          description: 'Choose the model that fits your needs. All engagements start with a discovery session.',
          tiers: [
            {
              name: 'Advisory',
              price: '$2,500',
              period: '/month',
              description: 'Ongoing strategic guidance',
              features: ['Monthly strategy sessions', 'Email support', 'Quarterly business review', 'Resource library access'],
              ctaText: 'Get Started',
              ctaLink: '/contact',
            },
            {
              name: 'Project',
              price: '$10,000',
              period: 'starting at',
              description: 'Defined scope engagement',
              features: ['Dedicated project manager', 'Weekly progress reports', 'Implementation support', 'Post-project review'],
              ctaText: 'Discuss Your Project',
              ctaLink: '/contact',
              isPopular: true,
            },
            {
              name: 'Partnership',
              price: 'Custom',
              period: '',
              description: 'Embedded team support',
              features: ['On-site availability', 'Executive-level access', 'Unlimited support hours', 'Custom reporting'],
              ctaText: 'Contact Us',
              ctaLink: '/contact',
            },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'Blog',
    slug: 'blog',
    sortOrder: 3,
    blocks: [
      {
        blockType: 'text',
        content: {
          body: '# Insights & Updates\n\nPractical advice, industry trends, and lessons learned from working with businesses like yours.',
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
    ],
  },
  {
    title: 'Contact',
    slug: 'contact',
    sortOrder: 4,
    blocks: [
      {
        blockType: 'contact_form',
        content: {
          headline: 'Get in Touch',
          description: 'Tell us about your project and we will get back to you within one business day.',
          fields: [
            { name: 'name', label: 'Full Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'company', label: 'Company', type: 'text', required: false },
            { name: 'service', label: 'Service Interested In', type: 'select', required: true, options: ['Business Strategy', 'Operations', 'Financial Planning', 'Team Development', 'Other'] },
            { name: 'message', label: 'How Can We Help?', type: 'textarea', required: true },
          ],
          submitText: 'Send Message',
          successMessage: 'Thank you for reaching out. We will be in touch within one business day.',
        },
        settings: { padding: 'lg', width: 'narrow' },
        sortOrder: 0,
      },
      {
        blockType: 'faq',
        content: {
          headline: 'Frequently Asked Questions',
          items: [
            { question: 'How long does a typical engagement last?', answer: 'Advisory engagements are month-to-month. Project engagements typically run 2-6 months depending on scope.' },
            { question: 'Do you work with businesses outside your region?', answer: 'Yes. While we love working locally, we serve clients nationwide through video conferencing and periodic on-site visits.' },
            { question: 'What industries do you specialize in?', answer: 'We work across manufacturing, professional services, healthcare, and technology. Our frameworks adapt to any industry.' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 1,
      },
    ],
  },
];

export async function seedSmallBusinessTemplate(db: DbClient, siteId: string): Promise<string[]> {
  return seedPages(db, siteId, smallBusinessPages, 'small_business');
}

// ============================================================================
// E-commerce/Retail Template
// ============================================================================

const ecommercePages: PageDef[] = [
  {
    title: 'Home',
    slug: 'home',
    sortOrder: 0,
    blocks: [
      {
        blockType: 'hero',
        content: {
          headline: 'Thoughtfully Crafted, Carefully Curated',
          subheadline: 'Discover our collection of handpicked products made with quality materials and sustainable practices.',
          alignment: 'center',
          ctaText: 'Shop Now',
          ctaLink: '/shop',
          ctaSecondaryText: 'Our Story',
          ctaSecondaryLink: '/about',
        },
        settings: { padding: 'xl', width: 'full' },
        sortOrder: 0,
      },
      {
        blockType: 'feature_grid',
        content: {
          headline: 'Why Shop With Us',
          columns: 4,
          features: [
            { icon: '🌿', title: 'Sustainably Made', description: 'Every product meets our rigorous environmental standards.' },
            { icon: '✨', title: 'Premium Quality', description: 'Materials and craftsmanship that stand the test of time.' },
            { icon: '🚚', title: 'Free Shipping', description: 'Complimentary shipping on all orders over $75.' },
            { icon: '↩️', title: 'Easy Returns', description: '30-day no-questions-asked return policy.' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 1,
      },
      {
        blockType: 'cta',
        content: {
          headline: 'New Arrivals This Season',
          description: 'Be the first to explore our latest collection. Sign up for early access and member-only pricing.',
          buttonText: 'View Collection',
          buttonLink: '/shop',
          buttonVariant: 'primary',
          backgroundStyle: 'gradient',
        },
        settings: { padding: 'lg', width: 'full' },
        sortOrder: 2,
      },
    ],
  },
  {
    title: 'Shop',
    slug: 'shop',
    sortOrder: 1,
    blocks: [
      {
        blockType: 'text',
        content: {
          body: '# Shop\n\nBrowse our full collection. Each item is selected for quality, sustainability, and design.',
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
    ],
  },
  {
    title: 'Our Story',
    slug: 'about',
    sortOrder: 2,
    blocks: [
      {
        blockType: 'text',
        content: {
          body: '# Our Story\n\nWhat started as a passion for finding better everyday products has grown into a curated marketplace that connects makers with people who care about quality and sustainability.\n\nWe visit every workshop, test every product, and build lasting relationships with the artisans behind our collection. When you shop with us, you are supporting independent creators and sustainable business practices.',
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
      {
        blockType: 'gallery',
        content: { images: [], layout: 'grid', columns: 3 },
        settings: { padding: 'md', width: 'container' },
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'Blog',
    slug: 'blog',
    sortOrder: 3,
    blocks: [
      {
        blockType: 'text',
        content: {
          body: '# Journal\n\nStories from our makers, style guides, and behind-the-scenes looks at how our products are crafted.',
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
    ],
  },
  {
    title: 'Contact',
    slug: 'contact',
    sortOrder: 4,
    blocks: [
      {
        blockType: 'contact_form',
        content: {
          headline: 'Customer Support',
          description: 'Have a question about an order, a product, or a return? We are here to help.',
          fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'orderNumber', label: 'Order Number (if applicable)', type: 'text', required: false },
            { name: 'subject', label: 'Subject', type: 'select', required: true, options: ['Order Status', 'Returns & Exchanges', 'Product Question', 'Wholesale Inquiry', 'Other'] },
            { name: 'message', label: 'Message', type: 'textarea', required: true },
          ],
          submitText: 'Send Message',
          successMessage: 'Thank you! Our team typically responds within 24 hours.',
        },
        settings: { padding: 'lg', width: 'narrow' },
        sortOrder: 0,
      },
    ],
  },
];

export async function seedEcommerceTemplate(db: DbClient, siteId: string): Promise<string[]> {
  return seedPages(db, siteId, ecommercePages, 'ecommerce');
}

// ============================================================================
// Restaurant/Cafe Template
// ============================================================================

const restaurantPages: PageDef[] = [
  {
    title: 'Home',
    slug: 'home',
    sortOrder: 0,
    blocks: [
      {
        blockType: 'hero',
        content: {
          headline: 'Farm to Table Dining',
          subheadline: 'Seasonal ingredients, locally sourced. A dining experience rooted in the traditions of our community.',
          alignment: 'center',
          ctaText: 'View Our Menu',
          ctaLink: '/menu',
          ctaSecondaryText: 'Make a Reservation',
          ctaSecondaryLink: '/reservations',
        },
        settings: { padding: 'xl', width: 'full' },
        sortOrder: 0,
      },
      {
        blockType: 'gallery',
        content: { images: [], layout: 'grid', columns: 3 },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 1,
      },
      {
        blockType: 'cta',
        content: {
          headline: 'Private Dining & Events',
          description: 'Host your next celebration in our private dining room. Capacity for up to 40 guests with custom menu options.',
          buttonText: 'Inquire About Events',
          buttonLink: '/contact',
          buttonVariant: 'primary',
          backgroundStyle: 'gradient',
        },
        settings: { padding: 'lg', width: 'full' },
        sortOrder: 2,
      },
    ],
  },
  {
    title: 'Menu',
    slug: 'menu',
    sortOrder: 1,
    blocks: [
      {
        blockType: 'text',
        content: {
          body: '# Our Menu\n\nOur menu changes with the seasons to showcase the freshest ingredients from local farms and purveyors. Dietary accommodations are available for most dishes.',
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
      {
        blockType: 'pricing_table',
        content: {
          headline: 'Starters',
          tiers: [
            {
              name: 'Roasted Beet Salad',
              price: '$16',
              description: 'Local beets, chèvre, candied walnuts, citrus vinaigrette',
              features: [],
              ctaText: '',
              ctaLink: '',
            },
            {
              name: 'Seared Scallops',
              price: '$22',
              description: 'Day-boat scallops, cauliflower purée, brown butter, capers',
              features: [],
              ctaText: '',
              ctaLink: '',
            },
            {
              name: 'Charcuterie Board',
              price: '$28',
              description: 'House-cured meats, artisan cheeses, seasonal preserves, grilled bread',
              features: [],
              ctaText: '',
              ctaLink: '',
            },
          ],
        },
        settings: { padding: 'md', width: 'container' },
        sortOrder: 1,
      },
      {
        blockType: 'pricing_table',
        content: {
          headline: 'Entrées',
          tiers: [
            {
              name: 'Pan-Roasted Salmon',
              price: '$34',
              description: 'Wild salmon, seasonal vegetables, herb risotto, lemon beurre blanc',
              features: [],
              ctaText: '',
              ctaLink: '',
            },
            {
              name: 'Braised Short Rib',
              price: '$38',
              description: 'Red wine braised beef, root vegetable purée, crispy shallots',
              features: [],
              ctaText: '',
              ctaLink: '',
            },
            {
              name: 'Mushroom Risotto',
              price: '$26',
              description: 'Wild mushroom medley, aged parmesan, truffle oil, fresh herbs',
              features: [],
              ctaText: '',
              ctaLink: '',
            },
          ],
        },
        settings: { padding: 'md', width: 'container' },
        sortOrder: 2,
      },
    ],
  },
  {
    title: 'Events',
    slug: 'events',
    sortOrder: 2,
    blocks: [
      {
        blockType: 'text',
        content: {
          body: '# Upcoming Events\n\nJoin us for wine dinners, live music, seasonal celebrations, and more.',
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
      {
        blockType: 'event_list',
        content: { maxItems: 10, showPastEvents: false, layout: 'list' },
        settings: { padding: 'md', width: 'container' },
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'Gallery',
    slug: 'gallery',
    sortOrder: 3,
    blocks: [
      {
        blockType: 'text',
        content: {
          body: '# Gallery\n\nA taste of the atmosphere, the dishes, and the people who make it all possible.',
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
      {
        blockType: 'gallery',
        content: { images: [], layout: 'masonry', columns: 3 },
        settings: { padding: 'md', width: 'container' },
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'Reservations',
    slug: 'reservations',
    sortOrder: 4,
    blocks: [
      {
        blockType: 'contact_form',
        content: {
          headline: 'Make a Reservation',
          description: 'Reserve your table online. For parties of 8 or more, please call us directly.',
          fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'phone', label: 'Phone', type: 'text', required: true },
            { name: 'partySize', label: 'Party Size', type: 'select', required: true, options: ['1', '2', '3', '4', '5', '6', '7'] },
            { name: 'specialRequests', label: 'Dietary Restrictions or Special Requests', type: 'textarea', required: false },
          ],
          submitText: 'Request Reservation',
          successMessage: 'Reservation request received. We will confirm via email within 2 hours.',
        },
        settings: { padding: 'lg', width: 'narrow' },
        sortOrder: 0,
      },
      {
        blockType: 'faq',
        content: {
          headline: 'Dining Information',
          items: [
            { question: 'Do you accommodate dietary restrictions?', answer: 'Yes. We offer vegetarian, vegan, and gluten-free options. Please mention allergies when making your reservation.' },
            { question: 'Is there parking available?', answer: 'We have a complimentary lot behind the restaurant and street parking is available on Main Street.' },
            { question: 'Do you offer takeout?', answer: 'Yes. Call us or order online for pickup. Please allow 30-45 minutes for preparation.' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'Contact',
    slug: 'contact',
    sortOrder: 5,
    blocks: [
      {
        blockType: 'contact_form',
        content: {
          headline: 'Contact Us',
          description: 'Questions about catering, private events, or general inquiries.',
          fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'subject', label: 'Subject', type: 'select', required: true, options: ['Catering', 'Private Events', 'General Inquiry'] },
            { name: 'message', label: 'Message', type: 'textarea', required: true },
          ],
          submitText: 'Send Message',
          successMessage: 'Thank you! We will respond within one business day.',
        },
        settings: { padding: 'lg', width: 'narrow' },
        sortOrder: 0,
      },
    ],
  },
];

export async function seedRestaurantTemplate(db: DbClient, siteId: string): Promise<string[]> {
  return seedPages(db, siteId, restaurantPages, 'restaurant');
}

// ============================================================================
// Agency/Portfolio Template
// ============================================================================

const agencyPages: PageDef[] = [
  {
    title: 'Home',
    slug: 'home',
    sortOrder: 0,
    blocks: [
      {
        blockType: 'hero',
        content: {
          headline: 'We Build Digital Experiences That Matter',
          subheadline: 'A design and development studio focused on creating meaningful products for ambitious brands.',
          alignment: 'left',
          ctaText: 'See Our Work',
          ctaLink: '/work',
          ctaSecondaryText: 'Start a Project',
          ctaSecondaryLink: '/contact',
        },
        settings: { padding: 'xl', width: 'full' },
        sortOrder: 0,
      },
      {
        blockType: 'bento_grid',
        content: {
          items: [
            { title: 'Brand Strategy', description: 'Positioning, messaging, and visual identity systems', size: 'large' },
            { title: 'Web Development', description: 'Performant, accessible, and beautifully crafted websites', size: 'medium' },
            { title: 'Product Design', description: 'User-centered design from research to high-fidelity prototypes', size: 'medium' },
            { title: 'Growth Marketing', description: 'SEO, content strategy, and conversion optimization', size: 'small' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 1,
      },
      {
        blockType: 'stats_bar',
        content: {
          layout: 'horizontal',
          stats: [
            { value: '150+', label: 'Projects Delivered' },
            { value: '12', label: 'Years in Business' },
            { value: '40+', label: 'Team Members' },
            { value: '3', label: 'Office Locations' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 2,
      },
      {
        blockType: 'testimonial',
        content: {
          layout: 'carousel',
          testimonials: [
            { quote: 'They did not just build a website. They helped us rethink our entire digital presence.', author: 'Maria Chen', role: 'VP of Marketing', company: 'Elevation Health' },
            { quote: 'The most collaborative and transparent agency we have ever worked with.', author: 'David Hoffman', role: 'Founder', company: 'Terrace Labs' },
            { quote: 'Our conversion rate doubled within three months of launch.', author: 'Rachel Adams', role: 'Director of E-commerce', company: 'Artisan Collective' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 3,
      },
    ],
  },
  {
    title: 'Work',
    slug: 'work',
    sortOrder: 1,
    blocks: [
      {
        blockType: 'text',
        content: {
          body: '# Selected Work\n\nA curated look at recent projects across brand, web, and product design.',
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
      {
        blockType: 'gallery',
        content: { images: [], layout: 'grid', columns: 2 },
        settings: { padding: 'md', width: 'container' },
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'Services',
    slug: 'services',
    sortOrder: 2,
    blocks: [
      {
        blockType: 'feature_grid',
        content: {
          headline: 'Services',
          columns: 3,
          features: [
            { icon: '🎨', title: 'Brand Identity', description: 'Logo, typography, color systems, and brand guidelines that capture your essence.' },
            { icon: '💻', title: 'Web Design & Development', description: 'Custom websites built for performance, accessibility, and conversion.' },
            { icon: '📱', title: 'Product Design', description: 'End-to-end product design from user research through development handoff.' },
            { icon: '📈', title: 'Digital Marketing', description: 'SEO, content strategy, and paid media to drive qualified traffic.' },
            { icon: '🎥', title: 'Content Production', description: 'Photography, video, and copywriting that tells your brand story.' },
            { icon: '🔄', title: 'Retainer Support', description: 'Ongoing design and development support for evolving needs.' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
      {
        blockType: 'pricing_table',
        content: {
          headline: 'Engagement Models',
          tiers: [
            {
              name: 'Project',
              price: '$15,000',
              period: 'starting at',
              description: 'Defined scope with clear deliverables',
              features: ['Discovery workshop', 'Design concepts', 'Development & QA', 'Launch support'],
              ctaText: 'Start a Project',
              ctaLink: '/contact',
            },
            {
              name: 'Retainer',
              price: '$5,000',
              period: '/month',
              description: 'Ongoing design and development hours',
              features: ['Dedicated team hours', 'Priority scheduling', 'Monthly strategy call', 'Rollover unused hours'],
              ctaText: 'Learn More',
              ctaLink: '/contact',
              isPopular: true,
            },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'Team',
    slug: 'team',
    sortOrder: 3,
    blocks: [
      {
        blockType: 'text',
        content: {
          body: '# Our Team\n\nA multidisciplinary team of designers, developers, and strategists united by a love for craft.',
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
      {
        blockType: 'feature_grid',
        content: {
          columns: 4,
          features: [
            { title: 'Alex Rivera', description: 'Creative Director — 15 years shaping brand experiences for startups and Fortune 500s.' },
            { title: 'Priya Patel', description: 'Lead Developer — Full-stack engineer focused on performance and accessibility.' },
            { title: 'Marcus Chen', description: 'UX Strategist — Research-driven design with a background in cognitive psychology.' },
            { title: 'Sofia Morales', description: 'Project Manager — Keeps complex projects on track with clear communication.' },
          ],
        },
        settings: { padding: 'md', width: 'container' },
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'Blog',
    slug: 'blog',
    sortOrder: 4,
    blocks: [
      {
        blockType: 'text',
        content: {
          body: '# Perspectives\n\nThoughts on design, technology, and building products that people love.',
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
    ],
  },
  {
    title: 'Contact',
    slug: 'contact',
    sortOrder: 5,
    blocks: [
      {
        blockType: 'contact_form',
        content: {
          headline: 'Start a Conversation',
          description: 'Tell us about your project. We respond to every inquiry within one business day.',
          fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'company', label: 'Company', type: 'text', required: false },
            { name: 'budget', label: 'Budget Range', type: 'select', required: false, options: ['Under $15K', '$15K - $50K', '$50K - $100K', '$100K+'] },
            { name: 'message', label: 'Project Details', type: 'textarea', required: true },
          ],
          submitText: 'Send Inquiry',
          successMessage: 'Thanks for reaching out. We will review your project details and respond within one business day.',
        },
        settings: { padding: 'lg', width: 'narrow' },
        sortOrder: 0,
      },
    ],
  },
];

export async function seedAgencyTemplate(db: DbClient, siteId: string): Promise<string[]> {
  return seedPages(db, siteId, agencyPages, 'agency');
}

// ============================================================================
// SaaS/Product Template
// ============================================================================

const saasPages: PageDef[] = [
  {
    title: 'Home',
    slug: 'home',
    sortOrder: 0,
    blocks: [
      {
        blockType: 'hero',
        content: {
          headline: 'Ship Faster. Scale Smarter.',
          subheadline: 'The developer platform that eliminates boilerplate so your team can focus on building what matters.',
          alignment: 'center',
          ctaText: 'Get Started Free',
          ctaLink: '/contact',
          ctaSecondaryText: 'View Documentation',
          ctaSecondaryLink: '/docs',
        },
        settings: { padding: 'xl', width: 'full' },
        sortOrder: 0,
      },
      {
        blockType: 'feature_grid',
        content: {
          headline: 'Everything You Need to Build',
          columns: 3,
          features: [
            { icon: '⚡', title: 'Instant Deployments', description: 'Push to git and your changes are live in seconds. Zero-config CI/CD built in.' },
            { icon: '🔒', title: 'Enterprise Security', description: 'SOC 2 compliant. End-to-end encryption. Role-based access control out of the box.' },
            { icon: '📊', title: 'Real-time Analytics', description: 'Monitor performance, track errors, and understand usage patterns as they happen.' },
            { icon: '🔌', title: 'API-First Design', description: 'Every feature is accessible via our REST and GraphQL APIs with full SDK support.' },
            { icon: '🌍', title: 'Global Edge Network', description: 'Content served from 200+ edge locations. Sub-50ms response times worldwide.' },
            { icon: '🤝', title: 'Team Collaboration', description: 'Branch previews, inline comments, and approval workflows for seamless teamwork.' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 1,
      },
      {
        blockType: 'pricing_table',
        content: {
          headline: 'Simple, Transparent Pricing',
          description: 'Start building for free. Scale as you grow.',
          tiers: [
            {
              name: 'Starter',
              price: '$29',
              period: '/month',
              description: 'For individuals and small teams',
              features: ['5 projects', '10 GB storage', '100K API requests/mo', 'Community support', 'Basic analytics'],
              ctaText: 'Start Building',
              ctaLink: '/contact',
            },
            {
              name: 'Pro',
              price: '$99',
              period: '/month',
              description: 'For growing teams',
              features: ['Unlimited projects', '100 GB storage', '1M API requests/mo', 'Priority support', 'Advanced analytics', 'Custom domains', 'Team management'],
              ctaText: 'Start Pro Trial',
              ctaLink: '/contact',
              isPopular: true,
            },
            {
              name: 'Enterprise',
              price: 'Custom',
              period: '',
              description: 'For large organizations',
              features: ['Unlimited everything', 'Dedicated infrastructure', '99.99% SLA', 'Dedicated support engineer', 'SSO / SAML', 'Audit logs', 'Custom contracts'],
              ctaText: 'Contact Sales',
              ctaLink: '/contact',
            },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 2,
      },
      {
        blockType: 'testimonial',
        content: {
          layout: 'grid',
          testimonials: [
            { quote: 'We cut our deployment time from hours to seconds. The developer experience is unmatched.', author: 'Kai Nakamura', role: 'CTO', company: 'Streamline AI' },
            { quote: 'Finally a platform that does not force us to choose between speed and security.', author: 'Elena Rodriguez', role: 'Lead Engineer', company: 'FinCore' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 3,
      },
      {
        blockType: 'faq',
        content: {
          headline: 'Frequently Asked Questions',
          items: [
            { question: 'Can I try it before committing?', answer: 'The Starter plan includes a 14-day trial with full access to Pro features. No credit card required.' },
            { question: 'How does billing work?', answer: 'Plans are billed monthly or annually (save 20%). You can upgrade, downgrade, or cancel anytime.' },
            { question: 'Do you offer SOC 2 compliance?', answer: 'Yes. All plans include SOC 2 Type II compliance. Enterprise plans add HIPAA and custom compliance frameworks.' },
            { question: 'What languages and frameworks are supported?', answer: 'We support Node.js, Python, Go, Rust, and all major frontend frameworks. Custom runtimes available on Enterprise.' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 4,
      },
      {
        blockType: 'cta',
        content: {
          headline: 'Ready to Build Something Great?',
          description: 'Join thousands of developers who ship faster with our platform.',
          buttonText: 'Get Started Free',
          buttonLink: '/contact',
          buttonVariant: 'primary',
          backgroundStyle: 'gradient',
        },
        settings: { padding: 'lg', width: 'full' },
        sortOrder: 5,
      },
    ],
  },
  {
    title: 'Documentation',
    slug: 'docs',
    sortOrder: 1,
    blocks: [
      {
        blockType: 'text',
        content: {
          body: '# Documentation\n\nGet started quickly with guides, API references, and examples.\n\n## Quick Start\n\n```bash\nnpm install @platform/cli\nplatform init my-project\nplatform deploy\n```\n\nYour project is now live. Visit the dashboard to configure custom domains, environment variables, and team access.',
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
    ],
  },
  {
    title: 'Blog',
    slug: 'blog',
    sortOrder: 2,
    blocks: [
      {
        blockType: 'text',
        content: {
          body: '# Engineering Blog\n\nDeep dives into our architecture, product updates, and best practices from our engineering team.',
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
    ],
  },
  {
    title: 'Changelog',
    slug: 'changelog',
    sortOrder: 3,
    blocks: [
      {
        blockType: 'text',
        content: {
          body: '# Changelog\n\nEvery improvement, feature, and fix shipped to the platform.',
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
      {
        blockType: 'timeline',
        content: {
          items: [
            { date: 'March 2026', title: 'Edge Functions GA', description: 'Run server-side logic at the edge with sub-10ms cold starts. Supports JavaScript and TypeScript.' },
            { date: 'February 2026', title: 'Team Workspaces', description: 'Organize projects by team with granular permissions, shared environment variables, and billing.' },
            { date: 'January 2026', title: 'GraphQL API', description: 'Full GraphQL support alongside our REST API. Auto-generated schema documentation.' },
            { date: 'December 2025', title: 'Real-time Logs', description: 'Stream build and runtime logs in real-time from the dashboard or CLI.' },
          ],
        },
        settings: { padding: 'md', width: 'container' },
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'Contact',
    slug: 'contact',
    sortOrder: 4,
    blocks: [
      {
        blockType: 'contact_form',
        content: {
          headline: 'Contact Sales',
          description: 'Interested in Enterprise or have questions about how we can support your team?',
          fields: [
            { name: 'name', label: 'Full Name', type: 'text', required: true },
            { name: 'email', label: 'Work Email', type: 'email', required: true },
            { name: 'company', label: 'Company', type: 'text', required: true },
            { name: 'teamSize', label: 'Team Size', type: 'select', required: true, options: ['1-10', '11-50', '51-200', '200+'] },
            { name: 'message', label: 'How can we help?', type: 'textarea', required: true },
          ],
          submitText: 'Contact Sales',
          successMessage: 'Thank you. Our sales team will be in touch within one business day.',
        },
        settings: { padding: 'lg', width: 'narrow' },
        sortOrder: 0,
      },
    ],
  },
];

export async function seedSaasTemplate(db: DbClient, siteId: string): Promise<string[]> {
  return seedPages(db, siteId, saasPages, 'saas');
}

// ============================================================================
// Consultant/Freelancer Template
// ============================================================================

const consultantPages: PageDef[] = [
  {
    title: 'Home',
    slug: 'home',
    sortOrder: 0,
    blocks: [
      {
        blockType: 'hero',
        content: {
          headline: 'Helping Businesses Navigate Digital Transformation',
          subheadline: 'I partner with mid-market companies to modernize operations, adopt the right technology, and build teams that deliver results.',
          alignment: 'left',
          ctaText: 'Book a Discovery Call',
          ctaLink: '/book',
          ctaSecondaryText: 'View Services',
          ctaSecondaryLink: '/services',
        },
        settings: { padding: 'xl', width: 'full' },
        sortOrder: 0,
      },
      {
        blockType: 'stats_bar',
        content: {
          layout: 'horizontal',
          stats: [
            { value: '15+', label: 'Years Experience' },
            { value: '80+', label: 'Clients' },
            { value: '$12M+', label: 'Revenue Generated' },
            { value: '4.9★', label: 'Client Rating' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 1,
      },
      {
        blockType: 'testimonial',
        content: {
          layout: 'grid',
          testimonials: [
            { quote: 'The most practical and results-oriented consultant we have worked with. Zero fluff, all impact.', author: 'Linda Nguyen', role: 'COO', company: 'Meridian Healthcare' },
            { quote: 'Helped us save $300K annually by restructuring our tech stack. ROI within the first quarter.', author: 'Thomas Brennan', role: 'CEO', company: 'Atlas Logistics' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 2,
      },
      {
        blockType: 'cta',
        content: {
          headline: 'Let\'s Talk About Your Challenges',
          description: 'Every engagement starts with a free 30-minute discovery call. No pressure, no obligations.',
          buttonText: 'Book Your Free Call',
          buttonLink: '/book',
          buttonVariant: 'primary',
          backgroundStyle: 'gradient',
        },
        settings: { padding: 'lg', width: 'full' },
        sortOrder: 3,
      },
    ],
  },
  {
    title: 'About',
    slug: 'about',
    sortOrder: 1,
    blocks: [
      {
        blockType: 'text',
        content: {
          body: '# About Me\n\nWith over 15 years in technology leadership, I have helped organizations ranging from 50-person startups to Fortune 500 companies modernize their operations, build high-performing engineering teams, and adopt technology that drives measurable business outcomes.\n\nI believe that good consulting is not about selling frameworks — it is about listening deeply, understanding your unique context, and building a plan that your team can actually execute.',
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
      {
        blockType: 'timeline',
        content: {
          headline: 'Career Highlights',
          items: [
            { date: '2024', title: 'Independent Consultant', description: 'Launched independent practice focused on digital transformation for mid-market companies.' },
            { date: '2018-2023', title: 'VP of Engineering, TechCorp', description: 'Led 120-person engineering organization. Delivered $50M product roadmap on time and under budget.' },
            { date: '2012-2018', title: 'Director of Engineering, ScaleUp Inc', description: 'Built engineering team from 5 to 45. Scaled platform to 2M monthly active users.' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'Services',
    slug: 'services',
    sortOrder: 2,
    blocks: [
      {
        blockType: 'feature_grid',
        content: {
          headline: 'How I Help',
          columns: 2,
          features: [
            { icon: '🗺️', title: 'Technology Strategy', description: 'Roadmap development, vendor evaluation, and architecture reviews aligned with your business goals.' },
            { icon: '👥', title: 'Team Building & Leadership', description: 'Recruiting strategy, organizational design, and engineering culture development.' },
            { icon: '🔄', title: 'Process Optimization', description: 'Agile transformation, DevOps adoption, and workflow improvements that reduce cycle time.' },
            { icon: '📊', title: 'Fractional CTO', description: 'Part-time executive technology leadership for companies that need strategic guidance without a full-time hire.' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
      {
        blockType: 'pricing_table',
        content: {
          headline: 'Working Together',
          tiers: [
            {
              name: 'Advisory',
              price: '$3,000',
              period: '/month',
              description: 'Strategic guidance and accountability',
              features: ['Bi-weekly strategy sessions', 'Async support via Slack/email', 'Quarterly roadmap review', 'Access to templates and frameworks'],
              ctaText: 'Book a Call',
              ctaLink: '/book',
            },
            {
              name: 'Fractional CTO',
              price: '$8,000',
              period: '/month',
              description: 'Embedded leadership 2 days/week',
              features: ['Team meetings and 1:1s', 'Architecture decisions', 'Hiring and vendor management', 'Board/investor reporting', 'Stakeholder communication'],
              ctaText: 'Book a Call',
              ctaLink: '/book',
              isPopular: true,
            },
            {
              name: 'Intensive',
              price: '$15,000',
              period: 'one-time',
              description: 'Deep dive assessment + action plan',
              features: ['2-week embedded assessment', 'Stakeholder interviews', 'Technical architecture review', '30-page actionable report', '90-day implementation roadmap'],
              ctaText: 'Book a Call',
              ctaLink: '/book',
            },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'Book a Call',
    slug: 'book',
    sortOrder: 3,
    blocks: [
      {
        blockType: 'contact_form',
        content: {
          headline: 'Book a Discovery Call',
          description: 'Tell me a bit about your situation and I will follow up within 24 hours to schedule a call.',
          fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'company', label: 'Company', type: 'text', required: true },
            { name: 'companySize', label: 'Company Size', type: 'select', required: true, options: ['1-50', '51-200', '201-500', '500+'] },
            { name: 'challenge', label: 'What is your biggest challenge right now?', type: 'textarea', required: true },
          ],
          submitText: 'Request a Call',
          successMessage: 'Thank you. I will review your details and send a scheduling link within 24 hours.',
        },
        settings: { padding: 'lg', width: 'narrow' },
        sortOrder: 0,
      },
    ],
  },
  {
    title: 'Blog',
    slug: 'blog',
    sortOrder: 4,
    blocks: [
      {
        blockType: 'text',
        content: {
          body: '# Insights\n\nLessons from 15 years of building and leading engineering teams.',
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
    ],
  },
];

export async function seedConsultantTemplate(db: DbClient, siteId: string): Promise<string[]> {
  return seedPages(db, siteId, consultantPages, 'consultant');
}

// ============================================================================
// Community/Forum Template
// ============================================================================

const communityPages: PageDef[] = [
  {
    title: 'Home',
    slug: 'home',
    sortOrder: 0,
    blocks: [
      {
        blockType: 'hero',
        content: {
          headline: 'A Place to Learn, Share, and Grow Together',
          subheadline: 'Join a community of practitioners, builders, and thinkers who believe in the power of collaboration.',
          alignment: 'center',
          ctaText: 'Join the Community',
          ctaLink: '/forum',
          ctaSecondaryText: 'Upcoming Events',
          ctaSecondaryLink: '/events',
        },
        settings: { padding: 'xl', width: 'full' },
        sortOrder: 0,
      },
      {
        blockType: 'feature_grid',
        content: {
          headline: 'What You Will Find Here',
          columns: 3,
          features: [
            { icon: '💬', title: 'Discussion Forums', description: 'Ask questions, share knowledge, and connect with peers in topic-specific channels.' },
            { icon: '📅', title: 'Events & Meetups', description: 'Monthly virtual meetups, workshops, and an annual in-person conference.' },
            { icon: '📚', title: 'Resource Library', description: 'Curated guides, templates, and tools contributed by community members.' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 1,
      },
      {
        blockType: 'stats_bar',
        content: {
          layout: 'horizontal',
          stats: [
            { value: '5,000+', label: 'Members' },
            { value: '120+', label: 'Events Held' },
            { value: '15K+', label: 'Forum Posts' },
            { value: '40+', label: 'Countries' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 2,
      },
      {
        blockType: 'cta',
        content: {
          headline: 'Membership is Free',
          description: 'Create an account and start participating today. No gatekeeping, no upsells — just genuine community.',
          buttonText: 'Create Your Account',
          buttonLink: '/forum',
          buttonVariant: 'primary',
          backgroundStyle: 'gradient',
        },
        settings: { padding: 'lg', width: 'full' },
        sortOrder: 3,
      },
    ],
  },
  {
    title: 'Forum',
    slug: 'forum',
    sortOrder: 1,
    blocks: [
      {
        blockType: 'text',
        content: {
          body: '# Community Forum\n\nBrowse topics, ask questions, and share your expertise. Our moderators ensure a respectful and productive environment for everyone.',
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
    ],
  },
  {
    title: 'Events',
    slug: 'events',
    sortOrder: 2,
    blocks: [
      {
        blockType: 'text',
        content: {
          body: '# Events\n\nFrom casual meetups to structured workshops, there is always something happening in our community.',
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
      {
        blockType: 'event_list',
        content: { maxItems: 20, showPastEvents: false, layout: 'list' },
        settings: { padding: 'md', width: 'container' },
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'Members',
    slug: 'members',
    sortOrder: 3,
    blocks: [
      {
        blockType: 'text',
        content: {
          body: '# Member Directory\n\nDiscover community members by expertise, location, or interests. Connect with peers who share your goals.',
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
    ],
  },
  {
    title: 'Blog',
    slug: 'blog',
    sortOrder: 4,
    blocks: [
      {
        blockType: 'text',
        content: {
          body: '# Community Blog\n\nMember spotlights, event recaps, and community announcements.',
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
    ],
  },
];

export async function seedCommunityTemplate(db: DbClient, siteId: string): Promise<string[]> {
  return seedPages(db, siteId, communityPages, 'community');
}

// ============================================================================
// Publisher/Magazine Template
// ============================================================================

const publisherPages: PageDef[] = [
  {
    title: 'Home',
    slug: 'home',
    sortOrder: 0,
    blocks: [
      {
        blockType: 'hero',
        content: {
          headline: 'Stories That Shape Perspectives',
          subheadline: 'Independent journalism and longform storytelling on culture, technology, and the human experience.',
          alignment: 'center',
          ctaText: 'Read the Latest Issue',
          ctaLink: '/latest',
          ctaSecondaryText: 'Subscribe',
          ctaSecondaryLink: '/subscribe',
        },
        settings: { padding: 'xl', width: 'full' },
        sortOrder: 0,
      },
      {
        blockType: 'feature_grid',
        content: {
          headline: 'Featured Sections',
          columns: 3,
          features: [
            { icon: '🔬', title: 'Deep Dives', description: 'In-depth investigations and analysis on the topics that matter most.' },
            { icon: '🎙️', title: 'Interviews', description: 'Conversations with innovators, creators, and decision-makers.' },
            { icon: '📝', title: 'Essays', description: 'Original essays from our contributors exploring ideas at the frontier.' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 1,
      },
      {
        blockType: 'cta',
        content: {
          headline: 'Support Independent Publishing',
          description: 'Subscribe to get every issue delivered to your inbox. Help us keep quality journalism alive.',
          buttonText: 'Subscribe Now',
          buttonLink: '/subscribe',
          buttonVariant: 'primary',
          backgroundStyle: 'gradient',
        },
        settings: { padding: 'lg', width: 'full' },
        sortOrder: 2,
      },
    ],
  },
  {
    title: 'Publications',
    slug: 'publications',
    sortOrder: 1,
    blocks: [
      {
        blockType: 'text',
        content: {
          body: '# Publications\n\nBrowse our archive of published issues, collections, and special editions.',
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
      {
        blockType: 'gallery',
        content: { images: [], layout: 'grid', columns: 3 },
        settings: { padding: 'md', width: 'container' },
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'Latest Issue',
    slug: 'latest',
    sortOrder: 2,
    blocks: [
      {
        blockType: 'text',
        content: {
          body: '# Latest Issue\n\n## Volume 12, Issue 3 — Spring 2026\n\nThis issue explores the intersection of artificial intelligence and creative industries, featuring interviews with technologists, artists, and policymakers navigating this rapidly evolving landscape.',
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
      {
        blockType: 'gallery',
        content: { images: [], layout: 'grid', columns: 2 },
        settings: { padding: 'md', width: 'container' },
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'Subscribe',
    slug: 'subscribe',
    sortOrder: 3,
    blocks: [
      {
        blockType: 'newsletter',
        content: {
          headline: 'Never Miss an Issue',
          description: 'Get every issue delivered directly to your inbox. Free subscribers receive monthly highlights. Paid subscribers get full access.',
        },
        settings: { padding: 'lg', width: 'narrow' },
        sortOrder: 0,
      },
      {
        blockType: 'pricing_table',
        content: {
          headline: 'Subscription Plans',
          tiers: [
            {
              name: 'Free',
              price: '$0',
              period: '/month',
              description: 'Stay informed',
              features: ['Monthly highlights email', 'Access to free articles', 'Community forum access'],
              ctaText: 'Sign Up Free',
              ctaLink: '/contact',
            },
            {
              name: 'Reader',
              price: '$8',
              period: '/month',
              description: 'Full access',
              features: ['Every issue, full text', 'Digital archive access', 'Ad-free reading experience', 'Early access to new issues'],
              ctaText: 'Subscribe',
              ctaLink: '/contact',
              isPopular: true,
            },
            {
              name: 'Patron',
              price: '$25',
              period: '/month',
              description: 'Support our mission',
              features: ['Everything in Reader', 'Print edition mailed quarterly', 'Exclusive patron events', 'Name in masthead', 'Annual contributor gift'],
              ctaText: 'Become a Patron',
              ctaLink: '/contact',
            },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'About',
    slug: 'about',
    sortOrder: 4,
    blocks: [
      {
        blockType: 'text',
        content: {
          body: '# About Us\n\nFounded in 2014, we are an independent publication committed to thoughtful, well-researched storytelling. Our editorial team brings together journalists, researchers, and subject-matter experts who share a belief that quality writing can inform, challenge, and inspire.\n\nWe are funded entirely by our readers. No venture capital, no corporate sponsors, no advertiser influence.',
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
    ],
  },
];

export async function seedPublisherTemplate(db: DbClient, siteId: string): Promise<string[]> {
  return seedPages(db, siteId, publisherPages, 'publisher');
}

// ============================================================================
// Cooperative/Collective Template
// ============================================================================

const cooperativePages: PageDef[] = [
  {
    title: 'Home',
    slug: 'home',
    sortOrder: 0,
    blocks: [
      {
        blockType: 'hero',
        content: {
          headline: 'Art, Community, Collaboration',
          subheadline: 'A member-owned cooperative showcasing work from local artists and makers. Visit our gallery, shop the collection, and join our creative community.',
          alignment: 'center',
          ctaText: 'Meet Our Artists',
          ctaLink: '/artists',
          ctaSecondaryText: 'Visit Us',
          ctaSecondaryLink: '/contact',
        },
        settings: { padding: 'xl', width: 'full' },
        sortOrder: 0,
      },
      {
        blockType: 'stats_bar',
        content: {
          layout: 'horizontal',
          stats: [
            { value: '45+', label: 'Member Artists' },
            { value: '12', label: 'Years Running' },
            { value: '100%', label: 'Artist-Owned' },
            { value: '2,000+', label: 'Works Sold' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 1,
      },
      {
        blockType: 'feature_grid',
        content: {
          headline: 'What We Offer',
          columns: 3,
          features: [
            { icon: '🖼️', title: 'Gallery Space', description: 'Rotating exhibitions featuring work from our member artists, updated monthly.' },
            { icon: '🛒', title: 'Consignment Shop', description: 'Original artwork, prints, ceramics, jewelry, and handcrafted goods available for purchase.' },
            { icon: '🎨', title: 'Workshops & Classes', description: 'Learn from working artists. Painting, printmaking, ceramics, and more.' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 2,
      },
      {
        blockType: 'cta',
        content: {
          headline: 'Become a Member',
          description: 'Join our cooperative and gain access to gallery space, workshops, shared studio resources, and a supportive creative community.',
          buttonText: 'Apply for Membership',
          buttonLink: '/contact',
          buttonVariant: 'primary',
          backgroundStyle: 'gradient',
        },
        settings: { padding: 'lg', width: 'full' },
        sortOrder: 3,
      },
    ],
  },
  {
    title: 'Artists',
    slug: 'artists',
    sortOrder: 1,
    blocks: [
      {
        blockType: 'text',
        content: {
          body: '# Our Artists\n\nMeet the creators behind our cooperative. Each member brings a unique perspective and medium to our collective.',
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
      {
        blockType: 'gallery',
        content: { images: [], layout: 'grid', columns: 3 },
        settings: { padding: 'md', width: 'container' },
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'Calendar',
    slug: 'calendar',
    sortOrder: 2,
    blocks: [
      {
        blockType: 'text',
        content: {
          body: '# Events & Workshops\n\nExhibition openings, artist talks, workshops, and community gatherings.',
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
      {
        blockType: 'event_list',
        content: { maxItems: 20, showPastEvents: false, layout: 'list' },
        settings: { padding: 'md', width: 'container' },
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'About',
    slug: 'about',
    sortOrder: 3,
    blocks: [
      {
        blockType: 'text',
        content: {
          body: '# About the Cooperative\n\nFounded in 2014 by a group of local artists seeking affordable gallery space, our cooperative has grown into a thriving creative hub. We are 100% artist-owned and operated, with every member contributing time and talent to keep the space running.\n\nOur mission is to make art accessible, support working artists, and strengthen the creative fabric of our community.',
          format: 'markdown',
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 0,
      },
      {
        blockType: 'timeline',
        content: {
          headline: 'Our History',
          items: [
            { date: '2014', title: 'Founded', description: 'Eight artists pooled resources to open a shared gallery space downtown.' },
            { date: '2016', title: 'Incorporated as Cooperative', description: 'Formally organized as a worker-owned cooperative with bylaws and membership structure.' },
            { date: '2019', title: 'Expanded to Current Location', description: 'Moved to a larger space with dedicated gallery, shop, and workshop areas.' },
            { date: '2023', title: '45 Members Strong', description: 'Grew to 45 active member artists spanning painting, sculpture, ceramics, and mixed media.' },
          ],
        },
        settings: { padding: 'lg', width: 'container' },
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'Contact',
    slug: 'contact',
    sortOrder: 4,
    blocks: [
      {
        blockType: 'contact_form',
        content: {
          headline: 'Get in Touch',
          description: 'Questions about membership, exhibitions, workshops, or visiting the gallery? We would love to hear from you.',
          fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'subject', label: 'Subject', type: 'select', required: true, options: ['Membership Inquiry', 'Exhibition Proposal', 'Workshop Information', 'Consignment', 'General Question'] },
            { name: 'message', label: 'Message', type: 'textarea', required: true },
          ],
          submitText: 'Send Message',
          successMessage: 'Thank you! A member of our team will respond within 2 business days.',
        },
        settings: { padding: 'lg', width: 'narrow' },
        sortOrder: 0,
      },
    ],
  },
];

export async function seedCooperativeTemplate(db: DbClient, siteId: string): Promise<string[]> {
  return seedPages(db, siteId, cooperativePages, 'cooperative');
}
