---
title: Mailing List Plugin
description: CAN-SPAM/GDPR compliant email subscriptions with one-click unsubscribe.
order: 4
---

## Overview

The Mailing List plugin provides email subscription management with CAN-SPAM and GDPR compliance built in. Subscribers are managed per-site with one-click unsubscribe tokens.

**Required env**: None (Azure Communication Services is optional for broadcast sending).

## Features

- **Public subscribe** -- visitors can subscribe via API or newsletter blocks
- **One-click unsubscribe** -- token-based, no auth required (GDPR compliant)
- **Broadcast sending** -- send to all subscribers (requires ACS)
- **Admin management** -- view, search, and manage subscriber lists

## Routes

### Public (no auth)

- `POST /api/v1/public/subscribe/:siteSlug` -- subscribe an email
- `GET /api/v1/public/unsubscribe/:token` -- unsubscribe with token

### Admin (auth required)

- `/api/v1/sites/:siteId/subscribers` -- list, manage subscribers

## Admin Navigation

The plugin adds a "Mailing List" item under the "Engagement" admin section.

## Integration with Blocks

Use the `newsletter` block type to add signup forms to any page. The block automatically posts to the subscribe endpoint.
