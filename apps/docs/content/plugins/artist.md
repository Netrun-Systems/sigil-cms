---
title: Artist Plugin
description: Music releases, events, artist profiles, streaming links, and 6 block types.
order: 1
---

## Overview

The Artist plugin is Sigil's largest plugin. It provides full CRUD for artist-oriented content: music releases, events/shows, and artist profiles with streaming links.

**Required env**: None (always available).

## Features

- **Releases** -- albums, EPs, singles with cover art and streaming links
- **Events** -- upcoming shows, past events, ticket links
- **Artist Profiles** -- bio, genres, social links, press photos
- **6 block types** for visual page building

## Block Types

| Block | Description |
|-------|-------------|
| `embed_player` | Spotify, YouTube, SoundCloud, Apple Music embeds |
| `release_list` | Grid or list of releases with streaming links |
| `event_list` | Upcoming/past events with dates and venues |
| `social_links` | Social media icons in row or grid layout |
| `link_tree` | Linktree-style page with avatar and links |
| `artist_bio` | Biography section with photo, genres, links |

## Admin Routes

- `/api/v1/sites/:siteId/releases` -- CRUD for releases
- `/api/v1/sites/:siteId/events` -- CRUD for events
- `/api/v1/sites/:siteId/artist-profile` -- Manage artist profile

## Public Routes

- `/api/v1/public/sites/:siteSlug/releases` -- Published releases
- `/api/v1/public/sites/:siteSlug/events` -- Published events
- `/api/v1/public/sites/:siteSlug/artist-profile` -- Public profile

## Admin Navigation

The plugin adds an "Artist Content" section to the admin sidebar with items:
- Releases
- Events
- Artist Profile
