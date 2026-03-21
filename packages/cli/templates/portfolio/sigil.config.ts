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
    ["@sigil-cms/plugin-artist", {
      gallery: {
        columns: 3,
        lightbox: true,
        lazyLoad: true,
      },
      portfolio: {
        categories: ["Painting", "Photography", "Digital", "Sculpture", "Mixed Media"],
        enableFiltering: true,
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
      { label: "Portfolio", href: "/portfolio" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
});
