// 📁 File Target: d:\Erlinshop\src\app\api\webhooks\midtrans\route.ts
// 🎯 Purpose: Handler Webhook pembayaran Midtrans yang aman dengan Lapis Tiga Verifikasi (Signature, Direct Check, Idempotency).
// 🔗 Depends on: @/db, @/db/schema, drizzle-orm, crypto, next/server
// 💥 Used by (Blast Radius): Sistem status pembayaran Midtrans, FSM pesanan

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? "";
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";

export async function POST(req: NextRequest) {
  try {
    // 1. Baca request body dari Midtrans
    const body = await req.json();
    
    const {
      order_id: orderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: sentSignature,
      transaction_status: transactionStatus,
      fraud_status: fraudStatus,
    } = body;

    if (!orderId || !sentSignature || !MIDTRANS_SERVER_KEY) {
      return NextResponse.json({ error: "Missing required fields or server key" }, { status: 400 });
    }

    // ==========================================
    // LAPIS 1: VERIFIKASI SIGNATURE KEY (SHA512)
    // ==========================================
    const stringToHash = `${orderId}${statusCode}${grossAmount}${MIDTRANS_SERVER_KEY}`;
    const calculatedSignature = createHash("sha512")
      .update(stringToHash)
      .digest("hex");

    if (calculatedSignature !== sentSignature) {
      console.warn(`[MIDTRANS WEBHOOK ALERT] Invalid signature for order ${orderId}`);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // ==========================================
    // LAPIS 2: DIRECT STATUS VERIFICATION (DOUBLE CHECK)
    // ==========================================
    const authHeader = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64");
    const statusUrl = MIDTRANS_IS_PRODUCTION
      ? `https://api.midtrans.com/v2/${orderId}/status`
      : `https://api.sandbox.midtrans.com/v2/${orderId}/status`;

    const statusCheckResponse = await fetch(statusUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${authHeader}`,
        Accept: "application/json",
      },
    });

    if (!statusCheckResponse.ok) {
      console.error(`[MIDTRANS WEBHOOK ERROR] Failed double-checking status for order ${orderId}`);
      return NextResponse.json({ error: "Failed to verify transaction status" }, { status: 502 });
    }

    const verifiedData = await statusCheckResponse.json();
    const verifiedStatus = verifiedData.transaction_status;
    const verifiedFraud = verifiedData.fraud_status;

    // ==========================================
    // LAPIS 3: IDEMPOTENCY GUARD & DATABASE UPDATE
    // ==========================================
    const orderRecord = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!orderRecord) {
      console.warn(`[MIDTRANS WEBHOOK ALERT] Order ${orderId} not found in database`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Jika pesanan sudah lunas dibayar, langsung return sukses tanpa memproses ulang (Idempotency Guard)
    if (orderRecord.paymentStatus === "PAID") {
      return NextResponse.json({ status: "already_processed" }, { status: 200 });
    }

    // Logika penentuan status berdasarkan respon terverifikasi Midtrans
    let dbPaymentStatus: "UNPAID" | "PAID" | "EXPIRED" | "FAILED" = "UNPAID";
    let shouldAdvanceOrderStatus = false;

    if (verifiedStatus === "capture") {
      if (verifiedFraud === "challenge") {
        dbPaymentStatus = "UNPAID"; // Butuh review manual di Midtrans dashboard
      } else if (verifiedFraud === "accept") {
        dbPaymentStatus = "PAID";
        shouldAdvanceOrderStatus = true;
      }
    } else if (verifiedStatus === "settlement") {
      dbPaymentStatus = "PAID";
      shouldAdvanceOrderStatus = true;
    } else if (["cancel", "deny", "expire"].includes(verifiedStatus)) {
      dbPaymentStatus = "FAILED";
      if (verifiedStatus === "expire") {
        dbPaymentStatus = "EXPIRED";
      }
    }

    // Update status pembayaran pesanan di database
    await db.transaction(async (tx) => {
      // 1. Perbarui status pembayaran
      await tx.update(orders)
        .set({
          paymentStatus: dbPaymentStatus,
          paidAt: dbPaymentStatus === "PAID" ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      // 2. Jika pembayaran lunas, pindahkan status order logistik dari PENDING -> PROCESSING
      if (shouldAdvanceOrderStatus && orderRecord.status === "PENDING") {
        await tx.update(orders)
          .set({
            status: "PROCESSING",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId));
      }
    });

    console.log(`[MIDTRANS WEBHOOK SUCCESS] Order ${orderId} payment status updated to ${dbPaymentStatus}`);
    return NextResponse.json({ status: "success", payment_status: dbPaymentStatus }, { status: 200 });
  } catch (error) {
    console.error("[MIDTRANS WEBHOOK CRITICAL ERROR] processing webhook failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
