import React from 'react';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { cartSessions, cartItems } from '@/db/schema';
import { cookies } from 'next/headers';
import CartClient from './CartClient';
import { getSettings } from '@/lib/actions/settings';

export const metadata = {
  title: 'Shopping Bag | Erlinshop',
  description: 'Your premium shopping bag at Erlinshop. Finalize your order via WhatsApp.',
};

export default async function CartPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('erlins_cart_session')?.value;
  const settings = await getSettings();

  let items: any[] = [];

  if (sessionId) {
    const session = await db.query.cartSessions.findFirst({
      where: eq(cartSessions.sessionId, sessionId),
      with: {
        items: {
          with: {
            variant: {
              with: {
                product: true
              }
            }
          }
        }
      }
    });

    if (session) {
      items = session.items;
    }
  }

  return (
    <div className="min-h-screen bg-white pt-24 md:pt-32 pb-32">
      <div className="max-w-6xl mx-auto px-6">
        <CartClient initialItems={items} settings={settings} />
      </div>
    </div>
  );
}
