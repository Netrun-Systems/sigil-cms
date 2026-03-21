---
title: Content Scheduling
description: Schedule pages to publish and unpublish at specific times.
order: 7
---

## Overview

Sigil supports time-based content scheduling through `publishAt` and `unpublishAt` timestamps on pages. This allows marketing teams to prepare content in advance and have it go live automatically.

## Scheduling API

```
PATCH /api/v1/sites/:siteId/pages/:id/schedule
```

### Schedule a future publish

```json
{
  "publishAt": "2026-04-01T09:00:00Z"
}
```

This sets the page status to `scheduled`. When the scheduled time arrives, the page transitions to `published`.

### Schedule publish and unpublish

```json
{
  "publishAt": "2026-04-01T09:00:00Z",
  "unpublishAt": "2026-04-30T23:59:59Z"
}
```

The page will be published for exactly one month, then automatically archived.

### Publish immediately

```json
{
  "publishAt": "2026-01-01T00:00:00Z"
}
```

A `publishAt` in the past publishes the page immediately.

### Clear schedule

```json
{
  "publishAt": null,
  "unpublishAt": null
}
```

Removes all scheduled transitions.

## Page Status Transitions

```
draft --> scheduled --> published --> archived
  ^                        |
  |________________________|
         (manual)
```

| From | To | Trigger |
|------|----|---------|
| `draft` | `scheduled` | Set `publishAt` in the future |
| `scheduled` | `published` | `publishAt` time reached |
| `published` | `archived` | `unpublishAt` time reached |
| Any | `draft` | Manual status change |
| Any | `published` | Set `publishAt` in the past |

## Permissions

Content scheduling requires `admin` or `editor` role. Authors can create pages but cannot control their publication schedule.

## Integration with Translations

Scheduling applies per-translation. You can schedule the English version to publish on April 1 and the Spanish version to publish on April 15.
