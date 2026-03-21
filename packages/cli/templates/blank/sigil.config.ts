import { defineConfig } from "@sigil-cms/core";

export default defineConfig({
  name: "{{SITE_NAME}}",

  database: {
    provider: "postgresql",
  },

  content: {
    directory: "./content",
  },

  plugins: [],

  admin: {
    path: "/admin",
  },

  api: {
    prefix: "/api",
    cors: {
      origin: ["http://localhost:3000"],
    },
  },
});
