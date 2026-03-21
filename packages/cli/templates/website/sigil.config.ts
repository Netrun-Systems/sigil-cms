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
    "@sigil-cms/plugin-seo",
    "@sigil-cms/plugin-media",
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
      { label: "About", href: "/about" },
      { label: "Services", href: "/services" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
    footer: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
});
