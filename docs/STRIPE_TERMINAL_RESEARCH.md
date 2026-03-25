# Stripe Terminal JavaScript SDK — Implementation Research

**Date**: 2026-03-25
**Scope**: Web-based POS system using `@stripe/terminal-js`
**Sources**: Official Stripe documentation, Stripe JS SDK API reference, Stripe Terminal hardware pages

---

## Table of Contents

1. [SDK Installation and Initialization](#1-sdk-installation-and-initialization)
2. [Connection Token Endpoint (Server-Side)](#2-connection-token-endpoint-server-side)
3. [Reader Discovery and Connection](#3-reader-discovery-and-connection)
4. [Payment Flow: Create → Collect → Process → Capture](#4-payment-flow-create--collect--process--capture)
5. [Server-Side API Endpoints](#5-server-side-api-endpoints)
6. [Hardware Options and SDK Compatibility](#6-hardware-options-and-sdk-compatibility)
7. [Tap to Pay on iPhone](#7-tap-to-pay-on-iphone)
8. [Simulated Reader for Development](#8-simulated-reader-for-development)
9. [Receipt Data](#9-receipt-data)
10. [Webhooks and Terminal Events](#10-webhooks-and-terminal-events)
11. [Error Codes Reference](#11-error-codes-reference)
12. [Complete Integration Checklist](#12-complete-integration-checklist)

---

## 1. SDK Installation and Initialization

### Loading the SDK

**CRITICAL**: Do NOT bundle or self-host the script. It must load directly from Stripe's CDN for PCI compliance and automatic updates.

```html
<!-- Option A: Script tag (recommended) -->
<script src="https://js.stripe.com/terminal/v1/"></script>

<!-- Option B: npm package -->
```

```bash
npm install @stripe/terminal-js
```

```typescript
// npm usage
import { loadStripeTerminal } from '@stripe/terminal-js';
const StripeTerminal = await loadStripeTerminal();
```

### Initializing the Terminal Instance

```typescript
const terminal = StripeTerminal.create({
  // Required: fetches a connection token from your backend
  onFetchConnectionToken: fetchConnectionToken,

  // Required: handle unexpected reader disconnection
  onUnexpectedReaderDisconnect: () => {
    console.error('Reader disconnected unexpectedly');
    // Show UI to user, restart reader discovery
    showReconnectUI();
  },

  // Optional: monitor connection status changes
  onConnectionStatusChange: (event) => {
    console.log('Connection status:', event.status);
    // event.status: 'connecting' | 'connected' | 'not_connected'
  },

  // Optional: monitor payment status changes
  onPaymentStatusChange: (event) => {
    console.log('Payment status:', event.status);
    // event.status: 'not_ready' | 'ready' | 'waiting_for_input' | 'processing'
  },
});
```

**Key rule**: The SDK manages the connection token lifecycle. Do NOT cache or hardcode connection tokens. The `onFetchConnectionToken` function is called automatically whenever the SDK needs to re-authenticate.

---

## 2. Connection Token Endpoint (Server-Side)

The connection token endpoint MUST be server-side. It should never be exposed as a public, unauthenticated endpoint. Protect it with your session/auth middleware.

### Client-Side Fetch Function

```typescript
async function fetchConnectionToken(): Promise<string> {
  const response = await fetch('/api/terminal/connection-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Include session credentials
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch connection token');
  }

  const data = await response.json();
  return data.secret; // Return only the secret string
}
```

### Server-Side Endpoint (Node.js / Express)

```typescript
import Stripe from 'stripe';

const stripe = new Stripe('[API_KEY]', { apiVersion: '2024-11-20.acacia' });

// POST /api/terminal/connection-token
app.post('/api/terminal/connection-token', requireAuth, async (req, res) => {
  try {
    const connectionToken = await stripe.terminal.connectionTokens.create({
      // Optional: scope this token to a specific location
      // location: 'tml_[LOCATION_ID]',
    });

    res.json({ secret: connectionToken.secret });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create connection token' });
  }
});
```

### Stripe API Call

```bash
curl https://api.stripe.com/v1/terminal/connection_tokens \
  -u [API_KEY]: \
  -X POST
  # Optional: -d "location=tml_[LOCATION_ID]"
```

**Response schema:**
```json
{
  "object": "terminal.connection_token",
  "secret": "pst_test_YWNjdF8x..."
}
```

**Location scoping**: Providing a `location` parameter restricts the token to readers at that location. This only applies to internet-connected (smart) readers.

---

## 3. Reader Discovery and Connection

### IMPORTANT: JavaScript SDK Limitation

For smart readers (WisePOS E, S700, Verifone), Stripe explicitly recommends using the **server-driven integration** over the JavaScript SDK because:

- JavaScript SDK requires POS app and reader to be on the **same local network** with working local DNS resolution
- Server-driven integration uses the Stripe API directly (no local network dependency)

If you need a web-based POS on the same LAN as the reader, the JS SDK is appropriate. For cloud-hosted POS apps, use the server-driven integration instead.

### Reader Discovery (JavaScript SDK)

```typescript
async function discoverReaders() {
  const config = {
    simulated: false,           // true for development/testing
    location: 'tml_[LOCATION_ID]',  // optional: filter by location
  };

  const result = await terminal.discoverReaders(config);

  if (result.error) {
    console.error('Discovery failed:', result.error.message);
    return null;
  }

  console.log('Found readers:', result.discoveredReaders);
  return result.discoveredReaders;
}
```

**Returns**: `{ discoveredReaders: Reader[], error?: Error }`

**Note**: Internet-connected readers must be registered to your account before they appear in discovery. Simulated readers are always discoverable in test mode.

### Connecting to a Reader

```typescript
async function connectToReader(reader: Reader) {
  const result = await terminal.connectReader(reader, {
    // Optional: fail if another Terminal SDK instance is already connected
    fail_if_in_use: false,
  });

  if (result.error) {
    console.error('Connection failed:', result.error.message);
    return null;
  }

  console.log('Connected to reader:', result.reader.label, result.reader.id);
  return result.reader;
}
```

**IMPORTANT**: Do not cache Reader objects. The reader's IP address can change; always use fresh objects from `discoverReaders()`.

### Complete Discovery + Connection Flow

```typescript
async function setupReader() {
  // 1. Check if already connected
  const status = terminal.getConnectionStatus();
  if (status === 'connected') {
    console.log('Already connected');
    return;
  }

  // 2. Discover readers
  const readers = await discoverReaders();
  if (!readers || readers.length === 0) {
    throw new Error('No readers found. Check network and reader registration.');
  }

  // 3. Auto-connect to first reader, or present selection UI
  const reader = readers[0];
  await connectToReader(reader);
}

// Disconnect when done
async function disconnectReader() {
  await terminal.disconnectReader();
}
```

### Connection Status

```typescript
// Possible values: 'connecting' | 'connected' | 'not_connected'
const status = terminal.getConnectionStatus();

// Payment status: 'not_ready' | 'ready' | 'waiting_for_input' | 'processing'
const paymentStatus = terminal.getPaymentStatus();
```

---

## 4. Payment Flow: Create → Collect → Process → Capture

This is the complete 4-step flow for accepting an in-person card payment.

```
[Server] Create PaymentIntent (card_present, manual capture)
    ↓  returns client_secret
[Client] collectPaymentMethod(clientSecret)
    ↓  reader prompts customer to tap/insert/swipe
    ↓  returns paymentIntent (with payment_method attached)
[Client] processPayment(paymentIntent)
    ↓  authorizes the payment with the card network
    ↓  returns paymentIntent in requires_capture state
[Server] POST /v1/payment_intents/{id}/capture
    ↓  funds captured
[Done] paymentIntent.status === 'succeeded'
```

### Step 1: Create PaymentIntent (Server-Side)

```typescript
// POST /api/terminal/create-payment-intent
app.post('/api/terminal/create-payment-intent', requireAuth, async (req, res) => {
  const { amount, currency = 'usd', description } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,                                    // in cents, e.g. 2500 = $25.00
      currency,
      payment_method_types: ['card_present'],   // REQUIRED for Terminal
      capture_method: 'manual',                  // authorize now, capture after
      description,
      metadata: {
        pos_session_id: req.session.id,
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Stripe API call:**
```bash
curl https://api.stripe.com/v1/payment_intents \
  -u [API_KEY]: \
  -d "amount=2500" \
  -d "currency=usd" \
  -d "payment_method_types[]=card_present" \
  -d "capture_method=manual"
```

**capture_method options:**
- `manual` (recommended): Authorize now, capture within 2 days. Gives you time to verify before charging.
- `automatic`: Authorize and capture immediately in one step.

### Step 2: Collect Payment Method (Client-Side)

```typescript
async function collectPayment(clientSecret: string) {
  const result = await terminal.collectPaymentMethod(clientSecret, {
    // Optional: inspect card details before processing
    config_override: {
      update_payment_intent: true,
    },
  });

  if (result.error) {
    // Handle collection errors (customer canceled, card read failure, etc.)
    console.error('Collection failed:', result.error.message);
    return null;
  }

  // Optionally inspect card details before proceeding
  const pm = result.paymentIntent.payment_method;
  const card = pm?.card_present ?? pm?.interac_present;
  console.log('Card brand:', card?.brand);
  console.log('Last 4:', card?.last4);

  return result.paymentIntent;
}
```

**CRITICAL TIMING CONSTRAINT**: After `collectPaymentMethod` succeeds, you have **30 seconds** to call `processPayment` or `cancelCollectPaymentMethod`. After 30 seconds the collection window expires.

To cancel collection in progress:
```typescript
await terminal.cancelCollectPaymentMethod();
```

### Step 3: Process Payment (Client-Side)

```typescript
async function processPayment(paymentIntent: PaymentIntent) {
  const result = await terminal.processPayment(paymentIntent);

  if (result.error) {
    // Card was declined — DO NOT create a new PaymentIntent
    // Reuse the same one with a different card
    console.error('Payment failed:', result.error.code, result.error.message);

    if (result.error.payment_intent) {
      // The PaymentIntent is still valid — retry with same clientSecret
      return { error: result.error, paymentIntent: result.error.payment_intent };
    }
    return { error: result.error };
  }

  // paymentIntent.status is now 'requires_capture'
  return { paymentIntent: result.paymentIntent };
}
```

**IMPORTANT**: If a card is declined, **reuse the same PaymentIntent**. Do NOT create a new one — this prevents double charges. The PaymentIntent must be in `requires_payment_method` state before Stripe can process it again.

### Step 4: Capture PaymentIntent (Server-Side)

```typescript
// POST /api/terminal/capture-payment-intent
app.post('/api/terminal/capture-payment-intent', requireAuth, async (req, res) => {
  const { paymentIntentId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
    res.json({ paymentIntent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Stripe API call:**
```bash
curl -X POST https://api.stripe.com/v1/payment_intents/pi_[PAYMENT_INTENT_ID]/capture \
  -u [API_KEY]:
```

**Capture deadline**: You must capture within **2 days** or the authorization expires and funds are released to the customer.

### Complete Client-Side Payment Orchestration

```typescript
async function processTerminalPayment(amountCents: number) {
  try {
    // 1. Create PaymentIntent on server
    const { clientSecret } = await fetch('/api/terminal/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amountCents, currency: 'usd' }),
    }).then(r => r.json());

    // 2. Collect payment from reader
    showUI('Waiting for card...');
    const collectResult = await terminal.collectPaymentMethod(clientSecret);

    if (collectResult.error) {
      throw new Error(collectResult.error.message);
    }

    // 3. Process (authorize) payment
    showUI('Processing...');
    const processResult = await terminal.processPayment(collectResult.paymentIntent);

    if (processResult.error) {
      // Card declined — allow retry with same PI
      throw new Error(`Declined: ${processResult.error.code}`);
    }

    // 4. Capture on server
    const captureResult = await fetch('/api/terminal/capture-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntentId: processResult.paymentIntent.id }),
    }).then(r => r.json());

    showUI('Payment successful!');
    return captureResult.paymentIntent;

  } catch (error) {
    showUI(`Error: ${error.message}`);
    throw error;
  }
}
```

### PaymentIntent Status Progression

```
requires_payment_method  →  (after collectPaymentMethod)
requires_confirmation    →  (after processPayment starts)
requires_capture         →  (after processPayment succeeds, with manual capture)
succeeded                →  (after capture)
canceled                 →  (if canceled at any point)
```

---

## 5. Server-Side API Endpoints

### POST /v1/terminal/connection_tokens

```bash
curl https://api.stripe.com/v1/terminal/connection_tokens \
  -u [API_KEY]: \
  -X POST \
  -d "location=tml_[LOCATION_ID]"  # optional
```

**Response:**
```json
{
  "object": "terminal.connection_token",
  "secret": "pst_test_..."
}
```

### POST /v1/terminal/locations

Create a physical location for your readers. Required before registering readers.

```bash
curl https://api.stripe.com/v1/terminal/locations \
  -u [API_KEY]: \
  -d "display_name=Main Store" \
  -d "address[line1]=123 Main St" \
  -d "address[city]=Los Angeles" \
  -d "address[state]=CA" \
  -d "address[postal_code]=90001" \
  -d "address[country]=US"
```

**Response:**
```json
{
  "id": "tml_[LOCATION_ID]",
  "object": "terminal.location",
  "display_name": "Main Store",
  "address": {
    "line1": "123 Main St",
    "city": "Los Angeles",
    "state": "CA",
    "postal_code": "90001",
    "country": "US"
  },
  "livemode": false
}
```

### POST /v1/terminal/readers

Register a physical reader to your account.

```bash
curl https://api.stripe.com/v1/terminal/readers \
  -u [API_KEY]: \
  -d "registration_code=simulated-wpe"  \  # from reader settings menu
  -d "label=Front Counter" \
  -d "location=tml_[LOCATION_ID]"
```

**Required parameters:**
- `registration_code`: Code displayed in the reader's settings menu (Stripe-provided format)
- `location`: Location ID the reader belongs to

**Response:**
```json
{
  "id": "tmr_[READER_ID]",
  "object": "terminal.reader",
  "device_type": "bbpos_wisepos_e",
  "label": "Front Counter",
  "location": "tml_[LOCATION_ID]",
  "status": "online",
  "serial_number": "...",
  "ip_address": "192.168.1.100",
  "livemode": false
}
```

### GET /v1/terminal/readers

```bash
curl https://api.stripe.com/v1/terminal/readers \
  -u [API_KEY]: \
  -G \
  -d "location=tml_[LOCATION_ID]"  # optional filter
```

### POST /v1/payment_intents (Terminal-specific params)

```bash
curl https://api.stripe.com/v1/payment_intents \
  -u [API_KEY]: \
  -d "amount=2500" \
  -d "currency=usd" \
  -d "payment_method_types[]=card_present" \
  -d "capture_method=manual" \
  -d "receipt_email=customer@example.com"  # triggers automatic email receipt
```

**Terminal vs online payment differences:**
- `payment_method_types` must include `card_present` (not `card`)
- `capture_method: manual` is the standard pattern for Terminal
- `card_present` payments cannot be captured more than 2 days after authorization
- In Canada, also add `interac_present` to `payment_method_types`

### POST /v1/payment_intents/{id}/capture

```bash
curl -X POST https://api.stripe.com/v1/payment_intents/pi_[ID]/capture \
  -u [API_KEY]:
```

---

## 6. Hardware Options and SDK Compatibility

### Smart Readers (WiFi/Ethernet — JavaScript SDK Compatible)

These readers connect to Stripe over the internet and are the only ones compatible with the JavaScript SDK.

| Reader | Price | Connectivity | Best For |
|--------|-------|-------------|----------|
| **Stripe Reader S700** | $349 | WiFi, Ethernet | Modern countertop, touchscreen, Android-based |
| **Stripe Reader S710** | $349+ | WiFi, Ethernet, 4G/LTE | Portable or unreliable network environments |
| **BBPOS WisePOS E** | $249 | WiFi, Ethernet (via dock) | Standard countertop POS |
| **Verifone (V660p, P630, etc.)** | Varies | WiFi, Ethernet | Enterprise/legacy deployments |

**SDK compatibility for smart readers**: JavaScript, iOS, Android, React Native, Server-driven

**Note**: Stripe recommends server-driven integration for smart readers when possible, because the JS SDK requires POS and reader on the same local network with local DNS.

### Mobile Readers (Bluetooth/USB — JavaScript SDK NOT Compatible)

These readers require native iOS or Android SDKs. They do not work with the JavaScript SDK.

| Reader | Price | Connectivity | SDK Support |
|--------|-------|-------------|------------|
| **Stripe Reader M2** | $59 | Bluetooth, USB | iOS, Android, React Native only |
| **BBPOS WisePad 3** | ~$79 (CA) | Bluetooth 4.2 BLE, USB | iOS, Android, React Native only |
| **BBPOS Chipper 2X BT** | Discontinued | Bluetooth | Legacy; iOS, Android only |

**SDK compatibility for mobile readers**: iOS, Android, React Native ONLY — not JavaScript/web.

### Summary: Which Reader for a Web POS?

If building a web-based POS with the JavaScript SDK, you MUST use a smart (WiFi/Ethernet) reader:
- **Recommended**: BBPOS WisePOS E ($249) or Stripe Reader S700 ($349)
- **Requirement**: Reader and POS browser must be on the same local network
- **Alternative**: Server-driven integration removes the local network requirement

---

## 7. Tap to Pay on iPhone

**Tap to Pay on iPhone is NOT available via the JavaScript/web SDK.**

It is available only through:
- Terminal iOS SDK (Swift)
- Terminal Android SDK (Kotlin)
- Terminal React Native SDK

**Platform requirements for Tap to Pay on iPhone:**
- iPhone XS or later
- iOS 16.0 minimum (iOS 16.4+ for PIN support)
- No additional hardware required — uses the iPhone's NFC

**Platform requirements for Tap to Pay on Android:**
- Functioning integrated NFC sensor
- ARM-based processor
- Android 13 or later
- Google Mobile Services certification

### Web Alternatives for Contactless Payments

If you need contactless payments from a web app, your options are:

1. **Smart Reader (WisePOS E or S700)**: Supports tap (NFC), chip, and swipe from a web/JS POS.
2. **Server-driven integration**: Control smart readers from the server side without needing the JS SDK.
3. **Stripe Payment Links**: Redirect customers to a Stripe-hosted page (not in-person POS).
4. **Stripe Dashboard mobile app**: No-code option for simple use cases.

---

## 8. Simulated Reader for Development

The JavaScript SDK has a built-in simulated reader. You do not need physical hardware to develop and test.

### Enabling the Simulated Reader

```typescript
// Discover the simulated reader instead of physical hardware
const result = await terminal.discoverReaders({
  simulated: true,  // key flag
});

if (result.discoveredReaders.length > 0) {
  await terminal.connectReader(result.discoveredReaders[0]);
}
```

### Configuring Simulated Behavior

```typescript
// Set test card BEFORE collecting payment
terminal.setSimulatorConfiguration({
  testCardNumber: '4242424242424242',   // Visa — approved
  // testCardNumber: '4000000000000002', // Declined
  // testCardNumber: '4000000000009995', // Insufficient funds
  tipAmount: 0,                          // simulate tip amount
});
```

### Test Card Numbers for Terminal

| Card Number | Network | Scenario |
|-------------|---------|----------|
| `4242424242424242` | Visa | Approved |
| `5555555555554444` | Mastercard | Approved |
| `378282246310005` | American Express | Approved |
| `6011111111111117` | Discover | Approved |
| `4506445006931933` | Interac | Approved (Canada) |
| `4001007020000002` | Visa | Offline PIN required |
| `4001000360000005` | Visa | Online PIN required |
| `4000000000000002` | Visa | Always declined |
| `4000000000009995` | Visa | Insufficient funds |
| `4000000000000069` | Visa | Expired card |

### Testing Specific Decline Codes with Physical Test Cards

When using a physical Stripe test card, the outcome depends on the **cents** portion of the amount:

| Amount ends in | Outcome | Decline code |
|----------------|---------|-------------|
| `.00` | Approved | — |
| `.01` | Declined | `call_issuer` |
| `.05` | Declined | `generic_decline` |
| `.55` | Declined | `incorrect_pin` |
| `.75` | Declined | `pin_try_exceeded` |

Example: $25.00 is approved; $10.05 is declined with `generic_decline`.

### Simulated Reader Limitations

- The simulated reader has no visible UI — payment flow is driven entirely by SDK method calls
- Simulator configuration (test card, tip amount) persists for 30 minutes between collect and confirm steps
- Simulated readers do not appear in `discoverReaders()` unless `simulated: true` is passed

---

## 9. Receipt Data

Stripe Terminal provides receipt data through the `Charge` object after a payment is captured.

### Accessing Receipt Fields

After processing and capturing, retrieve charge details from the server:

```typescript
// Server-side: get receipt data from the Charge
const charge = await stripe.charges.retrieve(chargeId, {
  expand: ['payment_method_details'],
});

const receipt = charge.payment_method_details?.card_present?.receipt;
const cardDetails = charge.payment_method_details?.card_present;

console.log({
  // Card identification
  last4: cardDetails?.last4,
  brand: cardDetails?.brand,                // 'visa', 'mastercard', etc.
  cardholderName: cardDetails?.cardholder_name,
  funding: cardDetails?.funding,            // 'credit', 'debit', 'prepaid'
  country: cardDetails?.country,

  // Receipt compliance fields
  accountType: receipt?.account_type,
  applicationPreferredName: receipt?.application_preferred_name,  // e.g. "Visa Credit"
  dedicatedFileName: receipt?.dedicated_file_name,                // AID
  authorizationResponseCode: receipt?.authorization_response_code, // ARC
  applicationCryptogram: receipt?.application_cryptogram,
  terminalVerificationResults: receipt?.terminal_verification_results, // TVR
  transactionStatusInfo: receipt?.transaction_status_information,       // TSI

  // Language preference
  preferredLocales: charge.payment_method?.preferred_locales,
});
```

### Required vs Optional Receipt Fields

**Required on receipts (compliance):**
- `account_type` — required outside the US
- `application_preferred_name` — application name (e.g. "Visa Credit")
- `dedicated_file_name` — AID (application identifier)

**Common optional fields:**
- `authorization_response_code` (ARC)
- `application_cryptogram`
- `terminal_verification_results` (TVR)
- `transaction_status_information` (TSI)

### Email Receipts (Automatic)

Stripe can automatically send receipt emails. Include the `receipt_email` parameter when creating the PaymentIntent:

```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2500,
  currency: 'usd',
  payment_method_types: ['card_present'],
  capture_method: 'manual',
  receipt_email: 'customer@example.com',  // triggers automatic email after capture
});
```

### Client-Side Receipt Data

In the JavaScript SDK, after `processPayment` succeeds, the returned `paymentIntent` object matches the Stripe API object. You can inspect `payment_method.card_present` for card details, but the full receipt fields (ARC, AID, TVR) are typically retrieved server-side from the Charge object.

---

## 10. Webhooks and Terminal Events

### Key Terminal Webhook Events

| Event | When It Fires |
|-------|--------------|
| `terminal.reader.action_succeeded` | Reader action (collect, process) completed successfully |
| `terminal.reader.action_failed` | Reader action failed |
| `payment_intent.payment_failed` | PaymentIntent failed (card declined, etc.) |
| `payment_intent.requires_capture` | PaymentIntent authorized and ready to capture |
| `payment_intent.succeeded` | PaymentIntent fully captured |
| `payment_intent.canceled` | PaymentIntent was canceled |
| `charge.succeeded` | Individual charge succeeded |
| `charge.failed` | Individual charge failed |

### Webhook Handler Example

```typescript
// POST /api/webhooks/stripe
app.post('/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        '[STRIPE_WEBHOOK_SECRET]'  // from Stripe Dashboard, stored in Key Vault
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'payment_intent.requires_capture':
        // PaymentIntent is authorized, ready to capture
        handleRequiresCapture(event.data.object);
        break;

      case 'payment_intent.succeeded':
        // Payment fully captured
        handlePaymentSucceeded(event.data.object);
        break;

      case 'terminal.reader.action_failed':
        // Log reader action failure
        handleReaderActionFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  }
);
```

### Webhook vs Polling

The JS SDK returns results synchronously from `processPayment()`, so webhooks are not strictly required for the basic JS SDK flow. However, webhooks are recommended as a server-side safety net for:
- Capturing when the client disconnects mid-flow
- Reconciling payment state if the client crashes
- Server-driven integration (where the flow is purely server-side)

---

## 11. Error Codes Reference

### SDK Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `no_established_connection` | No reader connected | Re-run discovery and connect |
| `canceled` | Operation was canceled by user or code | Show retry UI |
| `network_error` | Communication failure | Check network, retry |
| `network_timeout` | Request timed out | Retry; check local DNS if using JS SDK |
| `command_already_in_progress` | Another blocking operation is active | Wait for it to complete |
| `invalid_reader_version` | Reader firmware is outdated | Update reader software |
| `printer_out_of_paper` | Verifone printer is empty | Reload paper |

### Stripe API Decline Codes (Payment-Level)

| Code | Meaning |
|------|---------|
| `card_declined` | Generic decline |
| `insufficient_funds` | Customer account balance too low |
| `expired_card` | Card past expiration date |
| `incorrect_pin` | Wrong PIN entered |
| `pin_try_exceeded` | Too many PIN attempts |
| `call_issuer` | Bank wants customer to call them |
| `generic_decline` | Declined without specific reason |

---

## 12. Complete Integration Checklist

### Server-Side Setup

- [ ] Connection token endpoint (`POST /api/terminal/connection-token`) — requires auth, no caching
- [ ] Create location (`POST /v1/terminal/locations`) — one per physical store
- [ ] Register reader (`POST /v1/terminal/readers`) — with registration_code and location
- [ ] PaymentIntent creation endpoint (`POST /api/terminal/create-payment-intent`) with `card_present` + `capture_method: manual`
- [ ] Capture endpoint (`POST /api/terminal/capture-payment-intent`)
- [ ] Webhook handler for `payment_intent.succeeded` and `terminal.reader.action_failed`
- [ ] Store `[STRIPE_WEBHOOK_SECRET]` in Key Vault (not in code)
- [ ] Store `[API_KEY]` in Key Vault (not in code)

### Client-Side Setup

- [ ] Load SDK from `https://js.stripe.com/terminal/v1/` (no self-hosting)
- [ ] Implement `fetchConnectionToken` calling your backend (no hardcoding)
- [ ] Implement `onUnexpectedReaderDisconnect` with user-facing recovery UI
- [ ] Implement reader discovery with `simulated: true` for development
- [ ] Implement reader connection flow
- [ ] Implement 4-step payment flow (create → collect → process → notify server to capture)
- [ ] Handle 30-second window between `collectPaymentMethod` and `processPayment`
- [ ] Reuse PaymentIntent on decline (do not create new one)
- [ ] Cancel collection on user-initiated abandon: `cancelCollectPaymentMethod()`

### Hardware (Production)

- [ ] Confirm smart reader (WisePOS E or S700) is on same local network as POS browser
- [ ] Confirm working local DNS resolution between POS and reader
- [ ] Register reader in Stripe Dashboard or via API with correct location
- [ ] Test with physical test card before go-live

### Development

- [ ] Use `simulated: true` for initial development
- [ ] Set `testCardNumber: '4242424242424242'` for approval scenarios
- [ ] Set `testCardNumber: '4000000000000002'` to test decline handling
- [ ] Use test mode Stripe keys — prefix `sk_test_` and `pk_test_`

---

## Sources

- [Stripe Terminal JavaScript SDK Setup](https://docs.stripe.com/terminal/payments/setup-integration) — Official integration guide
- [Stripe Terminal JavaScript API Reference](https://docs.stripe.com/terminal/references/api/js-sdk) — Complete method signatures
- [Stripe Terminal Reader Discovery & Connection](https://docs.stripe.com/terminal/payments/connect-reader?terminal-sdk-platform=js&reader-type=internet) — Reader connection guide
- [Stripe Terminal Payment Collection](https://docs.stripe.com/terminal/payments/collect-card-payment?terminal-sdk-platform=js) — Payment flow guide
- [Stripe Terminal Reader Hardware](https://docs.stripe.com/terminal/payments/setup-reader) — Hardware options and SDK compatibility
- [Stripe Terminal Testing](https://docs.stripe.com/terminal/testing) — Test cards and simulated reader
- [Stripe Terminal Receipts](https://docs.stripe.com/terminal/features/receipts) — Receipt data fields
- [Stripe Terminal Tap to Pay](https://docs.stripe.com/terminal/payments/setup-reader/tap-to-pay) — Platform availability
- [POST /v1/terminal/connection_tokens](https://docs.stripe.com/api/terminal/connection_tokens/create) — API reference
- [POST /v1/terminal/readers](https://docs.stripe.com/api/terminal/readers/create) — API reference
- [POST /v1/terminal/locations](https://docs.stripe.com/api/terminal/locations/create) — API reference
- [Stripe Terminal Hardware Pricing](https://paymentforstripe.com/card-readers) — Third-party pricing reference
- [Tap to Pay on iPhone Support](https://support.stripe.com/questions/tap-to-pay-on-iphone-or-android-and-stripe-terminal) — SDK availability confirmation

---

## Micro-Retrospective

### What Went Well
1. Stripe's API reference (`/terminal/references/api/js-sdk`) provided a complete method signature list in one fetch, covering all SDK methods with parameters and return types.
2. Cross-referencing setup guide, testing guide, and API reference gave a complete picture without relying on any single document.

### What Needs Improvement
1. Several Stripe documentation URLs returned 404 (webhooks page, Tap to Pay dedicated page, simulated reader page) — Stripe has been reorganizing docs URLs. Future research should start with the SDK reference page rather than trying to guess specific section URLs.
2. Pricing information is not on the official docs pages — requires checking stripe.com marketing pages or third-party aggregators, which may lag actual prices.

### Action Items
1. **Verify pricing at stripe.com/terminal/devices at time of hardware purchase** — current prices: M2 $59, WisePOS E $249, S700 $349. These can change without documentation updates.
2. **Test simulated reader flow in test environment before integrating physical reader** — eliminates hardware dependency during early development.

### Patterns Discovered
- **Pattern**: Smart readers (WisePOS E, S700) are the only JavaScript SDK-compatible hardware. Any web POS project must budget for $249+ readers, not the cheaper $59 Bluetooth models.
- **Anti-Pattern**: Do not attempt to use `@stripe/terminal-js` with Bluetooth readers (M2, WisePad 3) — they require native iOS/Android SDKs. This is a common misunderstanding when selecting hardware for a web POS.
