/**
 * GraphQL Schema (SDL-first)
 *
 * Read-only GraphQL API for headless CMS consumers (Next.js, Gatsby, etc.)
 * Mutations are handled by the REST API.
 */

import { buildSchema } from 'graphql';

export const schema = buildSchema(/* GraphQL */ `
  """ISO 8601 datetime string"""
  scalar DateTime

  """Arbitrary JSON object"""
  scalar JSON

  # ===========================================================================
  # CORE TYPES
  # ===========================================================================

  type Site {
    id: ID!
    name: String!
    slug: String!
    domain: String
    defaultLanguage: String!
    status: String!
    template: String
    settings: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Page {
    id: ID!
    siteId: ID!
    parentId: ID
    title: String!
    slug: String!
    fullPath: String
    status: String!
    publishedAt: DateTime
    publishAt: DateTime
    unpublishAt: DateTime
    language: String!
    metaTitle: String
    metaDescription: String
    ogImageUrl: String
    template: String!
    sortOrder: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    """Content blocks (resolved when requested)"""
    blocks: [ContentBlock!]!
  }

  type PageTreeNode {
    id: ID!
    title: String!
    slug: String!
    fullPath: String
    status: String!
    template: String!
    sortOrder: Int!
    parentId: ID
    children: [PageTreeNode!]!
  }

  type ContentBlock {
    id: ID!
    pageId: ID!
    blockType: String!
    content: JSON!
    settings: JSON
    sortOrder: Int!
    isVisible: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type MediaItem {
    id: ID!
    siteId: ID!
    filename: String!
    originalFilename: String!
    mimeType: String!
    fileSize: Int!
    url: String!
    thumbnailUrl: String
    altText: String
    caption: String
    folder: String!
    metadata: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Theme {
    id: ID!
    siteId: ID!
    name: String!
    isActive: Boolean!
    baseTheme: String!
    tokens: JSON!
    customCss: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type PageRevision {
    id: ID!
    pageId: ID!
    version: Int!
    title: String!
    slug: String!
    contentSnapshot: JSON!
    settingsSnapshot: JSON
    changedBy: String
    changeNote: String
    createdAt: DateTime!
  }

  # ===========================================================================
  # PAGINATION
  # ===========================================================================

  type PaginationMeta {
    page: Int!
    limit: Int!
    total: Int!
    totalPages: Int!
  }

  type PaginatedPages {
    data: [Page!]!
    meta: PaginationMeta!
  }

  type PaginatedMedia {
    data: [MediaItem!]!
    meta: PaginationMeta!
  }

  # ===========================================================================
  # QUERIES
  # ===========================================================================

  type Query {
    # --- Admin queries (require JWT) ---

    """List all sites for the authenticated tenant"""
    sites(status: String, page: Int, limit: Int): [Site!]!

    """Get a single site by ID"""
    site(id: ID!): Site

    """List pages for a site (admin, all statuses)"""
    pages(siteId: ID!, status: String, parentId: ID, language: String, page: Int, limit: Int): PaginatedPages!

    """Get a single page by ID"""
    page(siteId: ID!, id: ID!): Page

    """List content blocks for a page"""
    blocks(siteId: ID!, pageId: ID!): [ContentBlock!]!

    """List media for a site"""
    media(siteId: ID!, folder: String, mimeType: String, search: String, page: Int, limit: Int): PaginatedMedia!

    """List themes for a site"""
    themes(siteId: ID!): [Theme!]!

    """Get the active theme for a site"""
    activeTheme(siteId: ID!): Theme

    """List revisions for a page"""
    revisions(siteId: ID!, pageId: ID!): [PageRevision!]!

    # --- Public queries (no auth required) ---

    """Get a published page by site slug and page slug (public)"""
    pageBySlug(siteSlug: String!, pageSlug: String!, lang: String): Page

    """Get the page tree for a published site (public)"""
    pageTree(siteSlug: String!): [PageTreeNode!]!

    """Get the active theme for a published site (public)"""
    publicTheme(siteSlug: String!): Theme

    """Resolve a site by its custom domain (public)"""
    siteByDomain(domain: String!): Site
  }
`);
