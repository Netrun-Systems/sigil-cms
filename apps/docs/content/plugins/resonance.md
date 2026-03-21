---
title: Resonance Plugin
description: Block-level analytics, A/B testing, and AI-powered content suggestions.
order: 6
---

## Overview

The Resonance plugin adds content performance analytics at the block level. It tracks engagement (views, clicks, scrolls, time-on-block), supports A/B testing between block variants, and optionally uses Gemini AI to suggest content improvements.

**Required env**: None (Gemini AI suggestions optional via `GEMINI_API_KEY`).

## Features

- **Block-level analytics** -- track views, clicks, scroll depth, and dwell time per block
- **A/B testing** -- create block variants and measure performance
- **AI suggestions** -- Gemini-powered content improvement recommendations
- **Engagement scoring** -- composite score combining multiple engagement signals
- **Client snippet** -- inject a tracking script on consumer sites

## How Scoring Works

The scoring engine combines multiple engagement signals into a single resonance score:

- **View rate** -- what percentage of visitors see this block
- **Click-through rate** -- clicks on CTAs or links within the block
- **Scroll depth** -- how far users scroll through long blocks
- **Dwell time** -- time spent with the block visible in viewport

Higher resonance scores indicate content that holds visitor attention.

## A/B Testing

Create multiple variants of a block and let Resonance distribute traffic:

1. Create a block variant through the admin panel
2. Resonance splits traffic between variants
3. After statistical significance, the winning variant is identified
4. Admin can promote the winner as the default

## AI Suggestions

When `GEMINI_API_KEY` is configured, Resonance can analyze underperforming blocks and suggest:

- Headline rewrites
- CTA text improvements
- Layout changes
- Content restructuring

## Client Integration

The plugin generates a tracking snippet (similar to the support panel snippet) that you add to your consumer site. It automatically tracks engagement events and reports them to the Sigil API.
