/**
 * AI Advisor Plugin — Gemini chat, pgvector RAG, TTS
 *
 * Provides an AI-powered advisor with document ingestion,
 * semantic search (pgvector), streaming chat, and text-to-speech.
 * Global routes (not site-scoped) mounted at /api/v1/advisor.
 */

import type { CmsPlugin } from '@netrun-cms/plugin-runtime';
import { createRoutes } from './routes.js';

const advisorPlugin: CmsPlugin = {
  id: 'advisor',
  name: 'AI Advisor',
  version: '1.0.0',
  requiredEnv: ['GEMINI_API_KEY'],

  async register(ctx) {
    const router = createRoutes(ctx.db, ctx.logger);

    // Mount as global routes (not site-scoped)
    ctx.addGlobalRoutes('advisor', router);

    // Register admin navigation
    ctx.addAdminNav({
      title: 'AI Advisor',
      siteScoped: false,
      items: [
        {
          label: 'AI Advisor',
          icon: 'MessageSquare',
          href: '/advisor',
        },
      ],
    });

    // Register admin route for the advisor page
    ctx.addAdminRoutes([
      {
        path: 'advisor',
        component: '@netrun-cms/plugin-advisor/admin/AdvisorPage',
      },
    ]);

    // Auto-create advisor sessions table
    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS ncms_advisor_sessions (
        session_id VARCHAR(100) PRIMARY KEY,
        history JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Auto-create RAG tables (pgvector extension must be enabled)
    await ctx.runMigration(`
      CREATE EXTENSION IF NOT EXISTS vector
    `);

    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS rag_collections (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS rag_documents (
        id SERIAL PRIMARY KEY,
        collection_id INTEGER NOT NULL REFERENCES rag_collections(id) ON DELETE CASCADE,
        source TEXT NOT NULL,
        source_type VARCHAR(50) NOT NULL DEFAULT 'upload',
        title TEXT,
        content_type VARCHAR(50),
        metadata JSONB DEFAULT '{}',
        chunk_count INTEGER DEFAULT 0,
        ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(collection_id, source)
      )
    `);

    await ctx.runMigration(`
      CREATE TABLE IF NOT EXISTS rag_chunks (
        id SERIAL PRIMARY KEY,
        document_id INTEGER NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
        collection_id INTEGER NOT NULL REFERENCES rag_collections(id) ON DELETE CASCADE,
        chunk_index INTEGER NOT NULL DEFAULT 0,
        content TEXT NOT NULL,
        embedding vector(768),
        section_title TEXT,
        source TEXT,
        content_type VARCHAR(50),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    ctx.logger.info({ plugin: 'advisor' }, 'AI Advisor plugin registered');
  },
};

export default advisorPlugin;
