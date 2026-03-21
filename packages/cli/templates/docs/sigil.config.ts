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
    ["@sigil-cms/plugin-docs", {
      sidebar: {
        sections: [
          {
            title: "Getting Started",
            slug: "getting-started",
            items: [
              { title: "Introduction", slug: "introduction" },
              { title: "Installation", slug: "installation" },
              { title: "Quick Start", slug: "quick-start" },
            ],
          },
          {
            title: "API Reference",
            slug: "api-reference",
            items: [
              { title: "Overview", slug: "overview" },
              { title: "Authentication", slug: "authentication" },
              { title: "Endpoints", slug: "endpoints" },
            ],
          },
        ],
      },
      search: {
        enabled: true,
        indexFields: ["title", "body", "description"],
      },
      versioning: {
        enabled: false,
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
      { label: "Docs", href: "/docs/getting-started/introduction" },
      { label: "API", href: "/docs/api-reference/overview" },
    ],
  },
});
