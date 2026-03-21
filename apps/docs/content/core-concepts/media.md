---
title: Media Library
description: File uploads, folder organization, and multi-provider storage.
order: 4
---

## Overview

Sigil's media library manages files with folder organization, search, and metadata. It supports single and bulk uploads (up to 20 files, 50MB each).

## Media Endpoints

All media routes are scoped to a site: `/api/v1/sites/:siteId/media`.

### Upload a file

```
POST /api/v1/sites/:siteId/media/upload
Content-Type: multipart/form-data
```

Form fields:
- `file` -- the file to upload (required)
- `altText` -- accessibility text (optional)
- `caption` -- display caption (optional)
- `folder` -- folder path (optional, e.g., `images/hero`)

### Bulk upload

```
POST /api/v1/sites/:siteId/media/upload/bulk
Content-Type: multipart/form-data
```

Form fields:
- `files` -- up to 20 files
- `folder` -- shared folder path

### List media

```
GET /api/v1/sites/:siteId/media
```

Query params:
- `page`, `limit` -- pagination
- `folder` -- filter by folder path
- `mimeType` -- filter by type (e.g., `image`, `image/png`, `video`)
- `search` -- search filename, original filename, alt text

### List folders

```
GET /api/v1/sites/:siteId/media/folders
```

Returns all folders with file counts.

### Create media record (manual)

```
POST /api/v1/sites/:siteId/media
```

```json
{
  "filename": "hero-bg.jpg",
  "originalFilename": "Hero Background.jpg",
  "mimeType": "image/jpeg",
  "fileSize": 245760,
  "url": "https://storage.example.com/hero-bg.jpg",
  "thumbnailUrl": "https://storage.example.com/hero-bg-thumb.jpg",
  "altText": "Mountain landscape at sunset",
  "folder": "images/hero",
  "metadata": {}
}
```

### Update metadata

```
PUT /api/v1/sites/:siteId/media/:id
```

Update `altText`, `caption`, `folder`, or `metadata`.

## Storage Providers

The Photos plugin (`AZURE_STORAGE_CONNECTION_STRING`) enables Azure Blob Storage for file uploads. When configured, the Gemini AI can automatically generate alt text and curate photos.

Without the Photos plugin, media records are stored as URL references to externally-hosted files.

## RBAC

| Action | Required Role |
|--------|--------------|
| Upload / Create | `admin`, `editor`, `author` |
| List / View | Any authenticated user |
| Update metadata | `admin`, `editor`, `author` |
| Delete | `admin`, `editor` |
