/**
 * Booking Email Notifications via ACS (Azure Communication Services)
 *
 * Degrades gracefully when ACS is not configured — logs a warning and skips.
 * Uses lazy import to avoid cold-start failures.
 */

const SENDER_ADDRESS = process.env.ACS_SENDER_ADDRESS || 'charlotte@netrunsystems.com';

async function getEmailClient() {
  const connStr = process.env.ACS_CONNECTION_STRING || process.env.AZURE_ACS_CONNECTION_STRING;
  if (!connStr) return null;

  const { EmailClient } = await import('@azure/communication-email');
  return EmailClient.fromConnectionString(connStr);
}

/**
 * Send booking confirmation email with confirm/cancel links.
 */
export async function sendConfirmationEmail(params: {
  to: string;
  customerName: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
  confirmUrl: string;
  cancelUrl: string;
  siteUrl: string;
  siteName: string;
}): Promise<void> {
  const client = await getEmailClient();
  if (!client) {
    console.warn('[booking] ACS not configured — skipping confirmation email to', params.to);
    return;
  }

  try {
    const poller = await client.beginSend({
      senderAddress: SENDER_ADDRESS,
      recipients: { to: [{ address: params.to, displayName: params.customerName }] },
      content: {
        subject: `Booking Confirmation — ${params.serviceName} on ${params.date}`,
        plainText: [
          `Hi ${params.customerName},`,
          '',
          `Your appointment for "${params.serviceName}" has been received.`,
          '',
          `Date: ${params.date}`,
          `Time: ${params.startTime} - ${params.endTime} (${params.timezone})`,
          '',
          `Please confirm your appointment:`,
          params.confirmUrl,
          '',
          `Need to cancel? Use this link:`,
          params.cancelUrl,
          '',
          `---`,
          params.siteName,
          params.siteUrl,
        ].join('\n'),
      },
    });

    const result = await poller.result();
    if (result.status !== 'Succeeded') {
      console.warn('[booking] Confirmation email send status:', result.status);
    }
  } catch (err) {
    console.error('[booking] Failed to send confirmation email:', err instanceof Error ? err.message : err);
  }
}

/**
 * Send booking reminder email (typically 24h before appointment).
 */
export async function sendReminderEmail(params: {
  to: string;
  customerName: string;
  serviceName: string;
  date: string;
  startTime: string;
  timezone: string;
  cancelUrl: string;
  siteName: string;
}): Promise<void> {
  const client = await getEmailClient();
  if (!client) {
    console.warn('[booking] ACS not configured — skipping reminder email to', params.to);
    return;
  }

  try {
    const poller = await client.beginSend({
      senderAddress: SENDER_ADDRESS,
      recipients: { to: [{ address: params.to, displayName: params.customerName }] },
      content: {
        subject: `Reminder: ${params.serviceName} tomorrow at ${params.startTime}`,
        plainText: [
          `Hi ${params.customerName},`,
          '',
          `This is a friendly reminder about your upcoming appointment:`,
          '',
          `Service: ${params.serviceName}`,
          `Date: ${params.date}`,
          `Time: ${params.startTime} (${params.timezone})`,
          '',
          `Need to cancel? Use this link:`,
          params.cancelUrl,
          '',
          `---`,
          params.siteName,
        ].join('\n'),
      },
    });

    const result = await poller.result();
    if (result.status !== 'Succeeded') {
      console.warn('[booking] Reminder email send status:', result.status);
    }
  } catch (err) {
    console.error('[booking] Failed to send reminder email:', err instanceof Error ? err.message : err);
  }
}

/**
 * Send cancellation confirmation email.
 */
export async function sendCancellationEmail(params: {
  to: string;
  customerName: string;
  serviceName: string;
  date: string;
  startTime: string;
  siteName: string;
}): Promise<void> {
  const client = await getEmailClient();
  if (!client) {
    console.warn('[booking] ACS not configured — skipping cancellation email to', params.to);
    return;
  }

  try {
    const poller = await client.beginSend({
      senderAddress: SENDER_ADDRESS,
      recipients: { to: [{ address: params.to, displayName: params.customerName }] },
      content: {
        subject: `Appointment Cancelled — ${params.serviceName}`,
        plainText: [
          `Hi ${params.customerName},`,
          '',
          `Your appointment has been cancelled:`,
          '',
          `Service: ${params.serviceName}`,
          `Date: ${params.date}`,
          `Time: ${params.startTime}`,
          '',
          `If this was a mistake, please visit our site to book a new appointment.`,
          '',
          `---`,
          params.siteName,
        ].join('\n'),
      },
    });

    const result = await poller.result();
    if (result.status !== 'Succeeded') {
      console.warn('[booking] Cancellation email send status:', result.status);
    }
  } catch (err) {
    console.error('[booking] Failed to send cancellation email:', err instanceof Error ? err.message : err);
  }
}
