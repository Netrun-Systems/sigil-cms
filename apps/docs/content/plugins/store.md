---
title: Store Plugin
description: Stripe-powered e-commerce with products, checkout, orders, and webhooks.
order: 3
---

## Overview

The Store plugin adds full e-commerce capability to any Sigil site using Stripe for payment processing. It handles product catalogs, checkout sessions, order tracking, and Stripe webhooks.

**Required env**: `STRIPE_SECRET_KEY`.

Uses the shared `@netrun/stripe-client` library from the Netrun TypeScript monorepo.

## Features

- **Product catalog** -- one-time and recurring products with Stripe sync
- **Checkout sessions** -- Stripe Checkout for secure payments
- **Order tracking** -- pending, paid, failed, refunded statuses
- **Stripe webhooks** -- automatic order status updates
- **Line items** -- per-order product breakdown

## Product Schema

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Product name |
| `description` | text | Product description |
| `product_type` | enum | `one_time` or `recurring` |
| `unit_price` | integer | Price in cents |
| `currency` | string | Default: USD |
| `billing_interval` | string | For subscriptions: `month`, `year` |
| `stripe_product_id` | string | Synced Stripe product ID |
| `stripe_price_id` | string | Synced Stripe price ID |
| `image_url` | string | Product image |

## Order Schema

| Field | Type | Description |
|-------|------|-------------|
| `stripe_session_id` | string | Checkout session ID |
| `stripe_payment_intent_id` | string | Payment intent ID |
| `customer_email` | string | Buyer email |
| `status` | enum | `pending`, `paid`, `failed`, `refunded` |
| `total_amount` | integer | Total in cents |

## Admin Navigation

- **Products** -- manage product catalog
- **Orders** -- view and manage orders
