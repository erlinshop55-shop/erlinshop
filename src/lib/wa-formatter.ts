import { CartItem } from '@/stores/cart';

interface OrderData {
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  totalPrice: number;
  storeName: string;
  orderId?: string;
}

/**
 * Formats cart data into a clean, readable WhatsApp message string.
 */
export function formatWhatsAppMessage({ 
  items, 
  customerName, 
  customerPhone, 
  totalPrice,
  storeName,
  orderId 
}: OrderData): string {
  const date = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const itemsList = items
    .map(
      (item, index) => {
        const nameAndVariant = item.variantName ? `${item.name} (${item.variantName})` : item.name;
        return `${index + 1}. *${nameAndVariant}*\n   📦 Qty: ${item.quantity}\n   💰 Subtotal: IDR ${(item.price * item.quantity).toLocaleString('id-ID')}`;
      }
    )
    .join('\n\n');

  const message = `
🔥 *ORDER BARU - ${storeName.toUpperCase()}* 🔥
--------------------------------------------
🆔 *Order ID:* ${orderId || 'N/A'}
📅 *Waktu:* ${date}

👤 *PELANGGAN*
Nama: ${customerName}
No HP: ${customerPhone}

🛍️ *DAFTAR BELANJA*
${itemsList}

--------------------------------------------
✨ *TOTAL PEMBAYARAN:* IDR ${totalPrice.toLocaleString('id-ID')}
--------------------------------------------

Halo ${storeName}, saya telah membuat pesanan dengan ID *${orderId}*. Mohon info detail pembayaran dan konfirmasi stoknya. Terima kasih! 🙏
  `.trim();

  return encodeURIComponent(message);
}
