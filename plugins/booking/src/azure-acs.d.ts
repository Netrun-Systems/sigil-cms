/**
 * Type stubs for @azure/communication-email
 * Optional peer dependency — only available when ACS is configured.
 */
declare module '@azure/communication-email' {
  export class EmailClient {
    static fromConnectionString(connectionString: string): EmailClient;
    beginSend(message: EmailMessage): Promise<{
      result(): Promise<{ id: string; status: string }>;
      getResult(): Promise<{ id: string; status: string }>;
    }>;
  }

  export interface EmailMessage {
    senderAddress: string;
    recipients: {
      to: Array<{ address: string; displayName?: string }>;
    };
    content: {
      subject: string;
      html?: string;
      plainText?: string;
    };
  }
}
