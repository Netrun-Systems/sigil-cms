import { defineConfig } from "@sigil-cms/core";

export default defineConfig({
  name: "{{SITE_NAME}}",

  database: {
    provider: "postgresql",
  },

  content: {
    directory: "./content",
  },

  plugins: [
    "@sigil-cms/plugin-media",
    "@sigil-cms/plugin-seo",
    ["@sigil-cms/plugin-store", {
      currency: "USD",
      payments: {
        provider: "stripe",
        // Configure in .env: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY
      },
      shipping: {
        enabled: false, // Enable when ready
      },
      tax: {
        enabled: false, // Enable when ready
      },
      inventory: {
        trackStock: true,
      },
    }],
  ],

  admin: {
    path: "/admin",
  },

  api: {
    prefix: "/api",
    cors: {
      origin: ["http://localhost:3000"],
    },
  },

  navigation: {
    header: [
      { label: "Home", href: "/" },
      { label: "Products", href: "/products" },
      { label: "Cart", href: "/cart" },
    ],
  },
});
