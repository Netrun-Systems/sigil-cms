/**
 * Receipt generation for POS transactions.
 *
 * Produces structured JSON suitable for both on-screen display
 * and thermal printer formatting.
 */

export interface PosReceiptItem {
  name: string;
  artist?: string;
  qty: number;
  unitPrice: string;
  lineTotal: string;
}

export interface PosReceipt {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  receiptNumber: string;
  date: string;
  cashier: string;
  items: PosReceiptItem[];
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  discount?: string;
  total: string;
  paymentMethod: string;
  cashTendered?: string;
  changeDue?: string;
  footer: string;
}

interface ReceiptLineItem {
  product_name: string;
  artist_name?: string | null;
  quantity: number;
  unit_price: string | number;
  line_total: string | number;
}

interface ReceiptTransaction {
  receipt_number: string;
  created_at: string;
  cashier_name: string;
  subtotal: string | number;
  tax_rate: string | number;
  tax_amount: string | number;
  discount_amount?: string | number | null;
  total: string | number;
  payment_method: string;
  card_brand?: string | null;
  card_last4?: string | null;
  cash_amount?: string | number | null;
  change_due?: string | number | null;
}

const STORE_NAME = 'Poppies Art & Gifts';
const STORE_ADDRESS = '211 E Matilija St, Ojai, CA 93023';
const STORE_PHONE = '(805) 646-2806';
const RECEIPT_FOOTER = 'Thank you for supporting local artists!';

function formatMoney(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `$${num.toFixed(2)}`;
}

function formatPaymentMethod(tx: ReceiptTransaction): string {
  if (tx.payment_method === 'cash') return 'Cash';
  if (tx.payment_method === 'split') return 'Split (Card + Cash)';
  if (tx.card_brand && tx.card_last4) {
    return `${tx.card_brand} ****${tx.card_last4}`;
  }
  return 'Card';
}

/**
 * Generate receipt data from a transaction and its line items.
 */
export function generateReceipt(
  tx: ReceiptTransaction,
  lineItems: ReceiptLineItem[],
): PosReceipt {
  const receipt: PosReceipt = {
    storeName: STORE_NAME,
    storeAddress: STORE_ADDRESS,
    storePhone: STORE_PHONE,
    receiptNumber: tx.receipt_number,
    date: new Date(tx.created_at).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
    cashier: tx.cashier_name,
    items: lineItems.map((item) => ({
      name: item.product_name,
      artist: item.artist_name ?? undefined,
      qty: item.quantity,
      unitPrice: formatMoney(item.unit_price),
      lineTotal: formatMoney(item.line_total),
    })),
    subtotal: formatMoney(tx.subtotal),
    taxRate: `${(Number(tx.tax_rate) * 100).toFixed(2)}%`,
    taxAmount: formatMoney(tx.tax_amount),
    total: formatMoney(tx.total),
    paymentMethod: formatPaymentMethod(tx),
    footer: RECEIPT_FOOTER,
  };

  if (tx.discount_amount && Number(tx.discount_amount) > 0) {
    receipt.discount = formatMoney(tx.discount_amount);
  }

  if (tx.payment_method === 'cash' || tx.payment_method === 'split') {
    if (tx.cash_amount && Number(tx.cash_amount) > 0) {
      receipt.cashTendered = formatMoney(tx.cash_amount);
    }
    if (tx.change_due && Number(tx.change_due) > 0) {
      receipt.changeDue = formatMoney(tx.change_due);
    }
  }

  return receipt;
}

/**
 * Generate the next sequential receipt number for a given date.
 * Format: POP-YYYYMMDD-NNN
 */
export function generateReceiptNumber(date: Date, sequenceNumber: number): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const seq = String(sequenceNumber).padStart(3, '0');
  return `POP-${yyyy}${mm}${dd}-${seq}`;
}
