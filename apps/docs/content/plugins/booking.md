---
title: Booking Plugin
description: Appointment scheduling with availability rules and Google Calendar sync.
order: 2
---

## Overview

The Booking plugin adds appointment scheduling for service businesses. It supports configurable services, availability rules, and optional Google Calendar integration.

**Required env**: None (Google Calendar is optional via `GOOGLE_CALENDAR_CREDENTIALS`).

## Features

- **Service catalog** -- define bookable services with duration, price, and buffer times
- **Availability rules** -- per-day-of-week time slots with timezone support
- **Booking management** -- track appointments by status (pending, confirmed, cancelled)
- **Google Calendar sync** -- automatically create calendar events (optional)
- **Email notifications** -- confirmation and reminder emails via ACS (optional)

## Service Properties

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Service name |
| `duration_minutes` | integer | Default: 60 |
| `price` | integer | Price in cents |
| `currency` | string | Default: USD |
| `buffer_minutes` | integer | Buffer between appointments (default: 15) |
| `advance_notice_hours` | integer | Minimum notice (default: 24) |
| `max_advance_days` | integer | Max days ahead to book (default: 60) |
| `max_daily_bookings` | integer | Cap per day |

## Availability

```json
{
  "day_of_week": 1,
  "start_time": "09:00",
  "end_time": "17:00",
  "timezone": "America/Los_Angeles"
}
```

Day of week: 0 = Sunday, 6 = Saturday.

## Admin Navigation

- **Services** -- manage bookable service offerings
- **Bookings** -- view and manage appointments
- **Availability** -- configure business hours
